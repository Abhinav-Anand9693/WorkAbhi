import type { FFmpeg } from "@ffmpeg/ffmpeg";

import {
  MAX_EXTRACTED_FRAMES,
  VideoProcessingError,
  type ImageOutput,
  type VideoEngineCallbacks,
  type VideoMetadata,
  type VideoOutput,
  type VideoProcessOptions,
  evenNumber,
  execFFmpeg,
  execFFprobe,
  getExtension,
  getMimeType,
  getFFmpeg,
  positiveInteger,
  readBlob,
  safeDelete,
  safeDeleteMany,
  safeNumber,
  sanitizeBaseName,
  throwIfAborted,
  validateFile,
  validateMergeFiles,
  writeInput,
  isFatalWasmError,
  resetFFmpeg,
} from "./videoCore";

function getVideoStream(metadata: VideoMetadata) {
  return metadata.streams?.find(
    (stream) => stream.codec_type === "video"
  );
}

function getAudioStream(metadata: VideoMetadata) {
  return metadata.streams?.find(
    (stream) => stream.codec_type === "audio"
  );
}

function getDuration(metadata: VideoMetadata): number | null {
  const formatDuration = Number(metadata.format?.duration);

  if (Number.isFinite(formatDuration) && formatDuration > 0) {
    return formatDuration;
  }

  const streamDuration = Number(
    getVideoStream(metadata)?.duration
  );

  return Number.isFinite(streamDuration) && streamDuration > 0
    ? streamDuration
    : null;
}

async function probeMetadataFromInput(
  ffmpeg: FFmpeg,
  input: string,
  signal?: AbortSignal
): Promise<VideoMetadata> {
  const output = "probe.json";

  try {
    await execFFprobe(
      ffmpeg,
      [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_entries",
        "format=filename,format_name,duration,size,bit_rate:stream=codec_name,codec_type,width,height,r_frame_rate,duration,sample_rate,channels,channel_layout,bit_rate",
        input,
        "-o",
        output,
      ],
      signal
    );

    const data = (await ffmpeg.readFile(output, "utf8")) as string;
    return JSON.parse(data) as VideoMetadata;
  } finally {
    await safeDelete(ffmpeg, output);
  }
}

function qualityArgs(
  quality: VideoProcessOptions["quality"]
): string[] {
  switch (quality) {
    case "high":
      return ["-crf", "18"];
    case "low":
      return ["-crf", "30"];
    case "medium":
    default:
      return ["-crf", "23"];
  }
}

function atempoFilters(speed: number): string {
  const safeSpeed = Math.max(0.25, Math.min(4, speed));
  let remaining = safeSpeed;
  const filters: string[] = [];

  while (remaining > 2) {
    filters.push("atempo=2");
    remaining /= 2;
  }

  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }

  filters.push(`atempo=${remaining.toFixed(4)}`);
  return filters.join(",");
}

function makeOutputName(
  file: File,
  suffix: string,
  extension: string
): string {
  return `${sanitizeBaseName(file.name)}-${suffix}.${extension}`;
}

function makeMergeOutputName(files: File[]): string {
  const first = files[0]?.name
    ? sanitizeBaseName(files[0].name)
    : "merged-video";

  return `${first}-merged.mp4`;
}

function normalizeCrop(
  options: VideoProcessOptions,
  videoWidth: number,
  videoHeight: number
) {
  const requestedWidth = positiveInteger(
    options.cropWidth,
    Math.min(640, videoWidth)
  );
  const requestedHeight = positiveInteger(
    options.cropHeight,
    Math.min(360, videoHeight)
  );

  const width = evenNumber(
    Math.min(requestedWidth, videoWidth)
  );
  const height = evenNumber(
    Math.min(requestedHeight, videoHeight)
  );

  let x = Math.max(
    0,
    Math.floor(safeNumber(options.cropX, 0))
  );
  let y = Math.max(
    0,
    Math.floor(safeNumber(options.cropY, 0))
  );

  x = Math.min(x, Math.max(0, videoWidth - width));
  y = Math.min(y, Math.max(0, videoHeight - height));

  x -= x % 2;
  y -= y % 2;

  return { width, height, x, y };
}

function throwIfNoVideo(metadata: VideoMetadata): void {
  if (!getVideoStream(metadata)) {
    throw new VideoProcessingError(
      "No video stream was found in this file."
    );
  }
}

async function processVideoInternal(
  toolId: string,
  file: File,
  options: VideoProcessOptions,
  callbacks: VideoEngineCallbacks
): Promise<VideoOutput> {
  validateFile(file, toolId === "gif-to-video" ? "GIF" : "Video");
  throwIfAborted(callbacks.signal);

  const ffmpeg = await getFFmpeg();
  let input: string | null = null;
  let output = "output.mp4";
  let mimeType = "video/mp4";
  let shouldResetOnError = false;

  try {
    callbacks.onStatus?.("Preparing video engine…");

    input = await writeInput(
      ffmpeg,
      file,
      "input",
      callbacks.signal
    );

    callbacks.onStatus?.("Video ready. Starting processing…");

    let metadata: VideoMetadata | null = null;
    const needsMetadata = new Set([
      "video-trimmer",
      "video-cutter",
      "video-cropper",
      "video-speed-changer",
      "video-volume-booster",
      "extract-audio-from-video",
      "video-frame-extractor",
      "video-thumbnail-generator",
    ]).has(toolId);

    if (needsMetadata) {
      callbacks.onStatus?.("Reading video information…");
      metadata = await probeMetadataFromInput(
        ffmpeg,
        input,
        callbacks.signal
      );
      throwIfNoVideo(metadata);
    }

    const hasAudio = Boolean(
      metadata && getAudioStream(metadata)
    );

    /* --------------------------------------------------
       TRIM / CUT
    -------------------------------------------------- */
    if (
      toolId === "video-trimmer" ||
      toolId === "video-cutter"
    ) {
      const duration = metadata ? getDuration(metadata) : null;
      const start = Math.max(
        0,
        safeNumber(options.start, 0)
      );

      if (duration !== null && start >= duration) {
        throw new VideoProcessingError(
          "The start time is outside the video duration."
        );
      }

      const requestedEnd =
        options.end !== undefined
          ? Math.max(
              start,
              safeNumber(options.end, start)
            )
          : null;

      if (
        requestedEnd !== null &&
        duration !== null &&
        requestedEnd > duration
      ) {
        throw new VideoProcessingError(
          "The end time is longer than the video duration."
        );
      }

      output = makeOutputName(file, "trimmed", "mp4");

      const args = [
        "-ss",
        String(start),
        "-i",
        input,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "23",
      ];

      if (hasAudio) {
        args.push("-c:a", "aac", "-b:a", "128k");
      } else {
        args.push("-an");
      }

      if (requestedEnd !== null) {
        args.push(
          "-t",
          String(Math.max(0.1, requestedEnd - start))
        );
      }

      args.push("-movflags", "+faststart", output);

      await execFFmpeg(ffmpeg, args, callbacks);
    }

    /* --------------------------------------------------
       COMPRESS
    -------------------------------------------------- */
    else if (toolId === "video-compressor") {
      output = makeOutputName(file, "compressed", "mp4");

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-map",
          "0:v:0",
          "-map",
          "0:a:0?",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          ...qualityArgs(options.quality),
          "-c:a",
          "aac",
          "-b:a",
          "96k",
          "-movflags",
          "+faststart",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       RESIZE
    -------------------------------------------------- */
    else if (toolId === "video-resizer") {
      const width = evenNumber(
        positiveInteger(options.width, 1280)
      );
      const height =
        options.height && options.height > 0
          ? evenNumber(positiveInteger(options.height, 720))
          : null;

      const scaleFilter = height
        ? `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
        : `scale=${width}:-2:flags=lanczos`;

      output = makeOutputName(file, "resized", "mp4");

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-map",
          "0:v:0",
          "-map",
          "0:a:0?",
          "-vf",
          scaleFilter,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       CROP
    -------------------------------------------------- */
    else if (toolId === "video-cropper") {
      const stream = metadata ? getVideoStream(metadata) : undefined;
      const sourceWidth = stream?.width;
      const sourceHeight = stream?.height;

      if (!sourceWidth || !sourceHeight) {
        throw new VideoProcessingError(
          "Unable to determine the video's dimensions."
        );
      }

      const crop = normalizeCrop(
        options,
        sourceWidth,
        sourceHeight
      );

      if (crop.width < 2 || crop.height < 2) {
        throw new VideoProcessingError(
          "The crop area is too small."
        );
      }

      output = makeOutputName(file, "cropped", "mp4");

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-map",
          "0:v:0",
          "-map",
          "0:a:0?",
          "-vf",
          `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       ROTATE
    -------------------------------------------------- */
    else if (toolId === "video-rotator") {
      const rotation = options.rotation ?? 90;
      const filter =
        rotation === 180
          ? "hflip,vflip"
          : rotation === 270
            ? "transpose=2"
            : "transpose=1";

      output = makeOutputName(file, "rotated", "mp4");

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-map",
          "0:v:0",
          "-map",
          "0:a:0?",
          "-vf",
          filter,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       FLIP
    -------------------------------------------------- */
    else if (toolId === "video-flipper") {
      const filter =
        options.flip === "vertical" ? "vflip" : "hflip";

      output = makeOutputName(file, "flipped", "mp4");

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-map",
          "0:v:0",
          "-map",
          "0:a:0?",
          "-vf",
          filter,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       SPEED
    -------------------------------------------------- */
    else if (toolId === "video-speed-changer") {
      const speed = Math.max(
        0.25,
        Math.min(4, safeNumber(options.speed, 1))
      );

      output = makeOutputName(file, "speed-changed", "mp4");

      if (hasAudio) {
        await execFFmpeg(
          ffmpeg,
          [
            "-i",
            input,
            "-filter_complex",
            `[0:v]setpts=PTS/${speed}[v];[0:a]${atempoFilters(speed)}[a]`,
            "-map",
            "[v]",
            "-map",
            "[a]",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            output,
          ],
          callbacks
        );
      } else {
        await execFFmpeg(
          ffmpeg,
          [
            "-i",
            input,
            "-filter:v",
            `setpts=PTS/${speed}`,
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-an",
            "-movflags",
            "+faststart",
            output,
          ],
          callbacks
        );
      }
    }

    /* --------------------------------------------------
       VOLUME BOOSTER
    -------------------------------------------------- */
    else if (toolId === "video-volume-booster") {
      if (!hasAudio) {
        throw new VideoProcessingError(
          "This video does not contain an audio track."
        );
      }

      const volume = Math.max(
        0.1,
        Math.min(5, safeNumber(options.volume, 2))
      );

      output = makeOutputName(file, "volume-boosted", "mp4");

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-map",
          "0:v:0",
          "-map",
          "0:a:0",
          "-af",
          `volume=${volume}`,
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-movflags",
          "+faststart",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       MUTE
    -------------------------------------------------- */
    else if (toolId === "mute-video") {
      output = makeOutputName(file, "muted", "mp4");

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-map",
          "0:v:0",
          "-an",
          "-c:v",
          "copy",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       EXTRACT AUDIO
    -------------------------------------------------- */
    else if (toolId === "extract-audio-from-video") {
      if (!hasAudio) {
        throw new VideoProcessingError(
          "This video does not contain an audio track."
        );
      }

      output = makeOutputName(file, "audio", "mp3");
      mimeType = "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-vn",
          "-map",
          "0:a:0",
          "-c:a",
          "libmp3lame",
          "-q:a",
          "2",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       VIDEO -> GIF
    -------------------------------------------------- */
    else if (toolId === "video-to-gif") {
      output = makeOutputName(file, "converted", "gif");
      mimeType = "image/gif";

      const fps = Math.max(
        1,
        Math.min(15, safeNumber(options.fps, 10))
      );

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-vf",
          `fps=${fps},scale=640:-2:flags=lanczos`,
          "-an",
          "-loop",
          "0",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       GIF -> VIDEO
    -------------------------------------------------- */
    else if (toolId === "gif-to-video") {
      output = makeOutputName(file, "converted", "mp4");

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,
          "-vf",
          "fps=15,format=yuv420p",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-pix_fmt",
          "yuv420p",
          "-an",
          "-movflags",
          "+faststart",
          output,
        ],
        callbacks
      );
    }

    /* --------------------------------------------------
       MP4 -> WEBM
    -------------------------------------------------- */
    else if (toolId === "mp4-to-webm") {
      output = makeOutputName(file, "converted", "webm");
      mimeType = "video/webm";

      const args = [
        "-i",
        input,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-c:v",
        "libvpx-vp9",
        "-crf",
        "32",
        "-b:v",
        "0",
        "-deadline",
        "good",
        "-cpu-used",
        "4",
        "-c:a",
        "libopus",
        "-b:a",
        "96k",
        output,
      ];
      await execFFmpeg(ffmpeg, args, callbacks);
    }

    /* --------------------------------------------------
       WEBM -> MP4
    -------------------------------------------------- */
    else if (toolId === "webm-to-mp4") {
      output = makeOutputName(file, "converted", "mp4");

      const args = [
        "-i",
        input,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        output,
      ];
      await execFFmpeg(ffmpeg, args, callbacks);
    }

    /* --------------------------------------------------
       FRAME / THUMBNAIL
    --------------------------------------------------
    */
    else if (
      toolId === "video-frame-extractor" ||
      toolId === "video-thumbnail-generator"
    ) {
      const duration = metadata ? getDuration(metadata) : null;
      const requestedTime = Math.max(
        0,
        safeNumber(options.frameTime, 0)
      );

      const time =
        duration !== null
          ? Math.min(requestedTime, Math.max(0, duration - 0.05))
          : requestedTime;

      const suffix =
        toolId === "video-thumbnail-generator"
          ? "thumbnail"
          : "frame";

      output = makeOutputName(file, suffix, "png");
      mimeType = "image/png";

      await execFFmpeg(
        ffmpeg,
        [
          "-ss",
          String(time),
          "-i",
          input,
          "-frames:v",
          "1",
          "-vf",
          "scale='min(1280,iw)':-2",
          output,
        ],
        callbacks
      );
    } else {
      throw new VideoProcessingError(
        `Unsupported video operation: ${toolId}`
      );
    }

    throwIfAborted(callbacks.signal);
    callbacks.onStatus?.("Preparing your result…");

    const blob = await readBlob(ffmpeg, output, mimeType);

    return {
      blob,
      filename: output,
      mimeType,
    };
  } catch (error) {
    if (isFatalWasmError(error)) {
      shouldResetOnError = true;
    }

    throw error;
  } finally {
    if (input) {
      await safeDelete(ffmpeg, input);
    }

    await safeDelete(ffmpeg, output);

    if (shouldResetOnError) {
      resetFFmpeg();
    }
  }
}

export async function processVideoOperation(
  toolId: string,
  file: File,
  options: VideoProcessOptions = {},
  callbacks: VideoEngineCallbacks = {}
): Promise<VideoOutput> {
  return processVideoInternal(toolId, file, options, callbacks);
}

export async function mergeVideosOperation(
  files: File[],
  callbacks: VideoEngineCallbacks = {}
): Promise<VideoOutput> {
  validateMergeFiles(files);
  throwIfAborted(callbacks.signal);

  const ffmpeg = await getFFmpeg();
  const inputs: string[] = [];
  const normalized: string[] = [];
  const temporaryFiles: string[] = [];
  let shouldResetOnError = false;

  try {
    callbacks.onStatus?.("Preparing videos for merge…");

    for (let index = 0; index < files.length; index += 1) {
      throwIfAborted(callbacks.signal);

      const input = await writeInput(
        ffmpeg,
        files[index],
        `merge_${index}`,
        callbacks.signal
      );

      inputs.push(input);
    }

    /*
     * Normalize every input to the same MP4 video/audio layout.
     * Inputs without audio receive a silent stereo AAC track so the
     * final concat remains stream-compatible instead of dropping
     * audio from the whole merge.
     */
    for (let index = 0; index < inputs.length; index += 1) {
      const normalizedName = `normalized_${index}.mp4`;
      const metadata = await probeMetadataFromInput(
        ffmpeg,
        inputs[index],
        callbacks.signal
      );
      const hasAudio = Boolean(getAudioStream(metadata));

      callbacks.onStatus?.(
        `Preparing video ${index + 1} of ${inputs.length}…`
      );

      const args = hasAudio
        ? [
            "-i",
            inputs[index],
            "-map",
            "0:v:0",
            "-map",
            "0:a:0",
            "-vf",
            "scale=trunc(iw/2)*2:trunc(ih/2)*2",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-b:a",
            "128k",
            normalizedName,
          ]
        : [
            "-f",
            "lavfi",
            "-i",
            "anullsrc=channel_layout=stereo:sample_rate=48000",
            "-i",
            inputs[index],
            "-map",
            "1:v:0",
            "-map",
            "0:a:0",
            "-vf",
            "scale=trunc(iw/2)*2:trunc(ih/2)*2",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-b:a",
            "128k",
            "-shortest",
            normalizedName,
          ];

      await execFFmpeg(ffmpeg, args, callbacks);

      normalized.push(normalizedName);
      temporaryFiles.push(normalizedName);
    }

    throwIfAborted(callbacks.signal);

    const concatFile = "concat.txt";
    const list = normalized
      .map((name) => `file '${name}'`)
      .join("\n");

    await ffmpeg.writeFile(
      concatFile,
      new TextEncoder().encode(list)
    );
    temporaryFiles.push(concatFile);

    const output = makeMergeOutputName(files);

    await execFFmpeg(
      ffmpeg,
      [
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatFile,
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        output,
      ],
      callbacks
    );

    temporaryFiles.push(output);

    callbacks.onStatus?.("Preparing your merged video…");

    const blob = await readBlob(
      ffmpeg,
      output,
      "video/mp4"
    );

    return {
      blob,
      filename: output,
      mimeType: "video/mp4",
    };
  } catch (error) {
    if (isFatalWasmError(error)) {
      shouldResetOnError = true;
    }
    throw error;
  } finally {
    await safeDeleteMany(ffmpeg, [
      ...inputs,
      ...temporaryFiles,
    ]);

    if (shouldResetOnError) {
      resetFFmpeg();
    }
  }
}

export async function extractVideoImagesOperation(
  file: File,
  fps = 1,
  maxFrames = 30,
  callbacks: VideoEngineCallbacks = {}
): Promise<ImageOutput[]> {
  validateFile(file);
  throwIfAborted(callbacks.signal);

  const ffmpeg = await getFFmpeg();
  let input: string | null = null;
  const frameFiles: string[] = [];
  let shouldResetOnError = false;

  const safeFPS = Math.max(
    0.1,
    Math.min(5, safeNumber(fps, 1))
  );
  const safeMax = Math.max(
    1,
    Math.min(
      MAX_EXTRACTED_FRAMES,
      Math.floor(safeNumber(maxFrames, 30))
    )
  );

  try {
    callbacks.onStatus?.("Preparing frame extraction…");

    input = await writeInput(
      ffmpeg,
      file,
      "frames_input",
      callbacks.signal
    );

    await execFFmpeg(
      ffmpeg,
      [
        "-i",
        input,
        "-vf",
        `fps=${safeFPS},scale='min(1280,iw)':-2`,
        "-frames:v",
        String(safeMax),
        "frame_%03d.png",
      ],
      callbacks
    );

    const entries = await ffmpeg.listDir("/");
    const names = entries
      .filter(
        (entry) =>
          !entry.isDir &&
          /^frame_\d+\.png$/.test(entry.name)
      )
      .map((entry) => entry.name)
      .sort();

    frameFiles.push(...names);

    const outputs: ImageOutput[] = [];

    for (let index = 0; index < names.length; index += 1) {
      throwIfAborted(callbacks.signal);

      const name = names[index];
      callbacks.onStatus?.(
        `Preparing extracted image ${index + 1} of ${names.length}…`
      );

      outputs.push({
        blob: await readBlob(ffmpeg, name, "image/png"),
        filename: name,
      });
    }

    return outputs;
  } catch (error) {
    if (isFatalWasmError(error)) {
      shouldResetOnError = true;
    }
    throw error;
  } finally {
    if (input) {
      await safeDelete(ffmpeg, input);
    }

    await safeDeleteMany(ffmpeg, frameFiles);

    // Remove any partially generated frames left after an interrupted run.
    try {
      const entries = await ffmpeg.listDir("/");
      const leftovers = entries
        .filter(
          (entry) =>
            !entry.isDir &&
            /^frame_\d+\.png$/.test(entry.name)
        )
        .map((entry) => entry.name);

      await safeDeleteMany(ffmpeg, leftovers);
    } catch {
      // Ignore cleanup failure if the worker was reset.
    }

    if (shouldResetOnError) {
      resetFFmpeg();
    }
  }
}

export async function getVideoMetadataOperation(
  file: File,
  callbacks: VideoEngineCallbacks = {}
): Promise<VideoMetadata> {
  validateFile(file);
  throwIfAborted(callbacks.signal);

  const ffmpeg = await getFFmpeg();
  let input: string | null = null;
  let shouldResetOnError = false;
  const output = "metadata.json";

  try {
    callbacks.onStatus?.("Reading video metadata…");

    input = await writeInput(
      ffmpeg,
      file,
      "metadata_input",
      callbacks.signal
    );

    await execFFprobe(
      ffmpeg,
      [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_entries",
        "format=filename,format_name,duration,size,bit_rate:stream=codec_name,codec_type,width,height,r_frame_rate,duration,sample_rate,channels,channel_layout,bit_rate",
        input,
        "-o",
        output,
      ],
      callbacks.signal
    );

    const data = (await ffmpeg.readFile(output, "utf8")) as string;
    return JSON.parse(data) as VideoMetadata;
  } catch (error) {
    if (isFatalWasmError(error)) {
      shouldResetOnError = true;
    }
    throw error;
  } finally {
    if (input) {
      await safeDelete(ffmpeg, input);
    }
    await safeDelete(ffmpeg, output);

    if (shouldResetOnError) {
      resetFFmpeg();
    }
  }
}
