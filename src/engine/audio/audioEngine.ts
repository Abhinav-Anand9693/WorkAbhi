import type { FFmpeg } from "@ffmpeg/ffmpeg";

/* =========================================================
   TYPES
========================================================= */

export type AudioFormat =
  | "mp3"
  | "wav"
  | "ogg"
  | "m4a";

export interface AudioProcessOptions {
  start?: number;
  end?: number;

  format?: AudioFormat;

  bitrate?:
    | "64k"
    | "96k"
    | "128k"
    | "192k"
    | "256k"
    | "320k";

  volume?: number;

  normalize?: number;

  fadeDuration?: number;

  speed?: number;

  pitch?: number;
}

export interface AudioOutput {
  blob: Blob;
  filename: string;
  mimeType: string;
}

export interface AudioMetadata {
  format?: {
    filename?: string;
    format_name?: string;
    duration?: string;
    size?: string;
    bit_rate?: string;
  };

  streams?: Array<{
    codec_name?: string;
    codec_type?: string;
    sample_rate?: string;
    channels?: number;
    channel_layout?: string;
    duration?: string;
    bit_rate?: string;
  }>;
}

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_AUDIO_FILE_SIZE =
  200 * 1024 * 1024;

const MAX_MERGE_FILES = 10;

const MAX_MERGE_TOTAL_SIZE =
  300 * 1024 * 1024;

const EXEC_TIMEOUT =
  10 * 60 * 1000;

const PROBE_TIMEOUT =
  60 * 1000;

/* =========================================================
   FFMPEG STATE
========================================================= */

let ffmpegInstance: FFmpeg | null =
  null;

let loadingPromise:
  | Promise<FFmpeg>
  | null = null;

/*
 * FFmpeg WASM operations are serialized.
 *
 * This prevents multiple audio operations from
 * simultaneously using the same WASM worker.
 */
let operationQueue: Promise<unknown> =
  Promise.resolve();

/* =========================================================
   EXCLUSIVE QUEUE
========================================================= */

function runExclusive<T>(
  operation: () => Promise<T>
): Promise<T> {
  const next =
    operationQueue.then(
      operation,
      operation
    );

  operationQueue =
    next.then(
      () => undefined,
      () => undefined
    );

  return next;
}

/* =========================================================
   RESET FFMPEG
========================================================= */

export function resetAudioFFmpeg(): void {
  if (ffmpegInstance) {
    try {
      ffmpegInstance.terminate();
    } catch {
      // Worker may already be terminated.
    }
  }

  ffmpegInstance = null;
  loadingPromise = null;
}

/* =========================================================
   ERROR HELPERS
========================================================= */

function errorToString(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isFatalWasmError(
  error: unknown
): boolean {
  const message =
    errorToString(error).toLowerCase();

  return (
    message.includes(
      "memory access out of bounds"
    ) ||
    message.includes(
      "out of memory"
    ) ||
    message.includes(
      "cannot enlarge memory"
    ) ||
    message.includes(
      "abort(oom)"
    ) ||
    message.includes(
      "wasm trap"
    ) ||
    message.includes(
      "unreachable"
    )
  );
}

/* =========================================================
   FFMPEG LOADER
========================================================= */

async function getFFmpeg(): Promise<FFmpeg> {
  if (
    ffmpegInstance &&
    ffmpegInstance.loaded
  ) {
    return ffmpegInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise =
    (async () => {
      const {
        FFmpeg,
      } = await import(
        "@ffmpeg/ffmpeg"
      );

      const ffmpeg =
        new FFmpeg();

      try {
        await ffmpeg.load({
          coreURL:
            "/ffmpeg/ffmpeg-core.js",

          wasmURL:
            "/ffmpeg/ffmpeg-core.wasm",

          workerURL:
            "/ffmpeg/ffmpeg-core.worker.js",
        });

        ffmpegInstance =
          ffmpeg;

        return ffmpeg;
      } catch (error) {
        try {
          ffmpeg.terminate();
        } catch {
          // Ignore cleanup error.
        }

        throw error;
      }
    })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

/* =========================================================
   FILE HELPERS
========================================================= */

function getExtension(
  file: File
): string {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  return extension || "mp3";
}

function getMimeType(
  format: string
): string {
  switch (
    format.toLowerCase()
  ) {
    case "mp3":
      return "audio/mpeg";

    case "wav":
      return "audio/wav";

    case "ogg":
      return "audio/ogg";

    case "m4a":
    case "mp4":
      return "audio/mp4";

    default:
      return "audio/mpeg";
  }
}

function validateAudioFile(
  file: File
): void {
  if (!file) {
    throw new Error(
      "Please select an audio file."
    );
  }

  if (file.size <= 0) {
    throw new Error(
      "The selected audio file is empty."
    );
  }

  if (
    file.size >
    MAX_AUDIO_FILE_SIZE
  ) {
    throw new Error(
      "This audio file is larger than 200 MB. Please use a smaller file for stable browser processing."
    );
  }
}

function validateMergeFiles(
  files: File[]
): void {
  if (files.length < 2) {
    throw new Error(
      "Please select at least 2 audio files."
    );
  }

  if (
    files.length >
    MAX_MERGE_FILES
  ) {
    throw new Error(
      `You can merge up to ${MAX_MERGE_FILES} audio files at once.`
    );
  }

  let totalSize = 0;

  for (const file of files) {
    validateAudioFile(file);
    totalSize += file.size;
  }

  if (
    totalSize >
    MAX_MERGE_TOTAL_SIZE
  ) {
    throw new Error(
      "The combined audio size is too large for stable browser processing."
    );
  }
}

/* =========================================================
   NUMBER HELPERS
========================================================= */

function safeNumber(
  value: unknown,
  fallback: number
): number {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return fallback;
  }

  return number;
}

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}

/* =========================================================
   BITRATE
========================================================= */

function getBitrate(
  bitrate:
    | AudioProcessOptions["bitrate"]
): string {
  return bitrate ?? "192k";
}

/* =========================================================
   WRITE INPUT
========================================================= */

async function writeInput(
  ffmpeg: FFmpeg,
  file: File,
  name = "input"
): Promise<string> {
  validateAudioFile(file);

  const extension =
    getExtension(file);

  const filename =
    `${name}.${extension}`;

  const {
    fetchFile,
  } = await import(
    "@ffmpeg/util"
  );

  const data =
    await fetchFile(file);

  await ffmpeg.writeFile(
    filename,
    data
  );

  return filename;
}

/* =========================================================
   READ OUTPUT
========================================================= */

async function readBlob(
  ffmpeg: FFmpeg,
  filename: string,
  mimeType: string
): Promise<Blob> {
  const data =
    (await ffmpeg.readFile(
      filename
    )) as Uint8Array;

  const copy =
    new Uint8Array(data);

  return new Blob(
    [copy.buffer],
    {
      type: mimeType,
    }
  );
}

/* =========================================================
   DELETE
========================================================= */

async function safeDelete(
  ffmpeg: FFmpeg,
  filename: string
): Promise<void> {
  try {
    await ffmpeg.deleteFile(
      filename
    );
  } catch {
    // File may not exist.
  }
}

async function safeDeleteMany(
  ffmpeg: FFmpeg,
  filenames: string[]
): Promise<void> {
  for (
    const filename of filenames
  ) {
    await safeDelete(
      ffmpeg,
      filename
    );
  }
}

/* =========================================================
   FFMPEG EXEC
========================================================= */

async function execFFmpeg(
  ffmpeg: FFmpeg,
  args: string[]
): Promise<void> {
  const code =
    await ffmpeg.exec(
      args,
      EXEC_TIMEOUT
    );

  if (code !== 0) {
    throw new Error(
      `Audio processing failed (FFmpeg code ${code}).`
    );
  }
}

/* =========================================================
   FFMPEG PROBE
========================================================= */

async function execFFprobe(
  ffmpeg: FFmpeg,
  args: string[]
): Promise<void> {
  const code =
    await ffmpeg.ffprobe(
      args,
      PROBE_TIMEOUT
    );

  if (code !== 0) {
    throw new Error(
      `Unable to read audio information (FFmpeg code ${code}).`
    );
  }
}

/* =========================================================
   METADATA PROBE
========================================================= */

async function probeMetadata(
  ffmpeg: FFmpeg,
  input: string,
  output = "audio_probe.json"
): Promise<AudioMetadata> {
  try {
    await execFFprobe(
      ffmpeg,
      [
        "-v",
        "quiet",

        "-print_format",
        "json",

        "-show_entries",
        "format=filename,format_name,duration,size,bit_rate:stream=codec_name,codec_type,sample_rate,channels,channel_layout,duration,bit_rate",

        input,

        "-o",
        output,
      ]
    );

    const data =
      (await ffmpeg.readFile(
        output,
        "utf8"
      )) as string;

    return JSON.parse(
      data
    ) as AudioMetadata;
  } finally {
    await safeDelete(
      ffmpeg,
      output
    );
  }
}

/* =========================================================
   DURATION
========================================================= */

function getDuration(
  metadata: AudioMetadata
): number | null {
  const duration =
    Number(
      metadata.format?.duration
    );

  if (
    Number.isFinite(duration) &&
    duration > 0
  ) {
    return duration;
  }

  const stream =
    metadata.streams?.find(
      (item) =>
        item.codec_type ===
        "audio"
    );

  const streamDuration =
    Number(
      stream?.duration
    );

  if (
    Number.isFinite(
      streamDuration
    ) &&
    streamDuration > 0
  ) {
    return streamDuration;
  }

  return null;
}

/* =========================================================
   AUDIO STREAM
========================================================= */

function getAudioStream(
  metadata: AudioMetadata
) {
  return metadata.streams?.find(
    (stream) =>
      stream.codec_type ===
      "audio"
  );
}

/* =========================================================
   FORMAT OUTPUT
========================================================= */

interface FormatConfig {
  extension: string;
  mimeType: string;
  codecArgs: string[];
}

function getFormatConfig(
  format: AudioFormat,
  bitrate: string
): FormatConfig {
  switch (format) {
    case "wav":
      return {
        extension: "wav",
        mimeType:
          "audio/wav",
        codecArgs: [
          "-c:a",
          "pcm_s16le",
        ],
      };

    case "ogg":
      return {
        extension: "ogg",
        mimeType:
          "audio/ogg",
        codecArgs: [
          "-c:a",
          "libvorbis",
          "-b:a",
          bitrate,
        ],
      };

    case "m4a":
      return {
        extension: "m4a",
        mimeType:
          "audio/mp4",
        codecArgs: [
          "-c:a",
          "aac",
          "-b:a",
          bitrate,
        ],
      };

    case "mp3":
    default:
      return {
        extension: "mp3",
        mimeType:
          "audio/mpeg",
        codecArgs: [
          "-c:a",
          "libmp3lame",
          "-b:a",
          bitrate,
        ],
      };
  }
}

/* =========================================================
   PROCESSING
========================================================= */

async function processAudioInternal(
  toolId: string,
  file: File,
  options: AudioProcessOptions
): Promise<AudioOutput> {
  validateAudioFile(file);

  const ffmpeg =
    await getFFmpeg();

  const input =
    await writeInput(
      ffmpeg,
      file
    );

  let output =
    "output.mp3";

  let mimeType =
    "audio/mpeg";

  let resetAfterError =
    false;

  try {
    let metadata:
      | AudioMetadata
      | null = null;

    const needsMetadata =
      toolId ===
        "audio-trimmer" ||
      toolId ===
        "audio-cutter" ||
      toolId ===
        "audio-fade-in" ||
      toolId ===
        "audio-fade-out" ||
      toolId ===
        "audio-speed-changer" ||
      toolId ===
        "audio-pitch-changer";

    if (needsMetadata) {
      metadata =
        await probeMetadata(
          ffmpeg,
          input
        );
    }

    /* =====================================================
       TRIM / CUT
    ===================================================== */

    if (
      toolId ===
        "audio-trimmer" ||
      toolId ===
        "audio-cutter"
    ) {
      const duration =
        metadata
          ? getDuration(
              metadata
            )
          : null;

      const start =
        clamp(
          safeNumber(
            options.start,
            0
          ),
          0,
          duration ?? Number.MAX_SAFE_INTEGER
        );

      let end =
        options.end !== undefined
          ? safeNumber(
              options.end,
              start
            )
          : duration ?? start + 30;

      if (
        duration !== null
      ) {
        end =
          clamp(
            end,
            start,
            duration
          );
      } else {
        end =
          Math.max(
            start + 0.1,
            end
          );
      }

      const args = [
        "-ss",
        String(start),

        "-i",
        input,

        "-vn",

        "-c:a",
        "libmp3lame",

        "-b:a",
        getBitrate(
          options.bitrate
        ),
      ];

      if (
        end > start
      ) {
        args.push(
          "-t",
          String(
            Math.max(
              0.1,
              end - start
            )
          )
        );
      }

      args.push(
        "-write_xing",
        "0",
        "trimmed.mp3"
      );

      output =
        "trimmed.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        args
      );
    }

    /* =====================================================
       CONVERTERS
    ===================================================== */

    else if (
      toolId ===
        "audio-converter" ||
      toolId ===
        "mp3-converter" ||
      toolId ===
        "wav-converter" ||
      toolId ===
        "ogg-converter" ||
      toolId ===
        "m4a-converter" ||
      toolId ===
        "mp3-to-wav" ||
      toolId ===
        "wav-to-mp3" ||
      toolId ===
        "mp3-to-ogg" ||
      toolId ===
        "ogg-to-mp3"
    ) {
      let format:
        AudioFormat =
        options.format ??
        "mp3";

      if (
        toolId ===
        "mp3-to-wav"
      ) {
        format = "wav";
      }

      if (
        toolId ===
          "wav-to-mp3" ||
        toolId ===
          "ogg-to-mp3"
      ) {
        format = "mp3";
      }

      if (
        toolId ===
        "mp3-to-ogg"
      ) {
        format = "ogg";
      }

      if (
        toolId ===
        "mp3-converter"
      ) {
        format = "mp3";
      }

      if (
        toolId ===
        "wav-converter"
      ) {
        format = "wav";
      }

      if (
        toolId ===
        "ogg-converter"
      ) {
        format = "ogg";
      }

      if (
        toolId ===
        "m4a-converter"
      ) {
        format = "m4a";
      }

      const config =
        getFormatConfig(
          format,
          getBitrate(
            options.bitrate
          )
        );

      output =
        `converted.${config.extension}`;

      mimeType =
        config.mimeType;

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          ...config.codecArgs,

          "-threads",
          "1",

          output,
        ]
      );
    }

    /* =====================================================
       AUDIO COMPRESSOR
    ===================================================== */

    else if (
      toolId ===
      "audio-compressor"
    ) {
      const bitrate =
        options.bitrate ??
        "96k";

      output =
        "compressed.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          "-c:a",
          "libmp3lame",

          "-b:a",
          bitrate,

          "-compression_level",
          "2",

          "-threads",
          "1",

          output,
        ]
      );
    }

    /* =====================================================
       VOLUME BOOSTER
    ===================================================== */

    else if (
      toolId ===
      "audio-volume-booster"
    ) {
      const volume =
        clamp(
          safeNumber(
            options.volume,
            2
          ),
          0.1,
          5
        );

      output =
        "boosted.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          "-af",
          `volume=${volume}`,

          "-c:a",
          "libmp3lame",

          "-b:a",
          getBitrate(
            options.bitrate
          ),

          output,
        ]
      );
    }

    /* =====================================================
       NORMALIZER
    ===================================================== */

    else if (
      toolId ===
      "audio-volume-normalizer"
    ) {
      output =
        "normalized.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          "-af",
          "loudnorm=I=-16:TP=-1.5:LRA=11",

          "-c:a",
          "libmp3lame",

          "-b:a",
          getBitrate(
            options.bitrate
          ),

          output,
        ]
      );
    }

    /* =====================================================
       FADE IN
    ===================================================== */

    else if (
      toolId ===
      "audio-fade-in"
    ) {
      const duration =
        clamp(
          safeNumber(
            options.fadeDuration,
            3
          ),
          0.1,
          60
        );

      output =
        "fade-in.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          "-af",
          `afade=t=in:st=0:d=${duration}`,

          "-c:a",
          "libmp3lame",

          "-b:a",
          getBitrate(
            options.bitrate
          ),

          output,
        ]
      );
    }

    /* =====================================================
       FADE OUT
    ===================================================== */

    else if (
      toolId ===
      "audio-fade-out"
    ) {
      const duration =
        clamp(
          safeNumber(
            options.fadeDuration,
            3
          ),
          0.1,
          60
        );

      const totalDuration =
        metadata
          ? getDuration(
              metadata
            )
          : null;

      if (
        totalDuration === null
      ) {
        throw new Error(
          "Unable to determine the audio duration for fade-out."
        );
      }

      const start =
        Math.max(
          0,
          totalDuration -
            duration
        );

      output =
        "fade-out.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          "-af",
          `afade=t=out:st=${start}:d=${duration}`,

          "-c:a",
          "libmp3lame",

          "-b:a",
          getBitrate(
            options.bitrate
          ),

          output,
        ]
      );
    }

    /* =====================================================
       SPEED CHANGER
    ===================================================== */

    else if (
      toolId ===
      "audio-speed-changer"
    ) {
      const speed =
        clamp(
          safeNumber(
            options.speed,
            1
          ),
          0.25,
          4
        );

      /*
       * atempo supports 0.5–2 per filter.
       * Chain filters when necessary.
       */
      const filters: string[] =
        [];

      let remaining =
        speed;

      while (
        remaining > 2
      ) {
        filters.push(
          "atempo=2"
        );

        remaining /= 2;
      }

      while (
        remaining < 0.5
      ) {
        filters.push(
          "atempo=0.5"
        );

        remaining /= 0.5;
      }

      filters.push(
        `atempo=${remaining.toFixed(
          4
        )}`
      );

      output =
        "speed-changed.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          "-af",
          filters.join(","),

          "-c:a",
          "libmp3lame",

          "-b:a",
          getBitrate(
            options.bitrate
          ),

          output,
        ]
      );
    }

    /* =====================================================
       PITCH CHANGER
    ===================================================== */

    else if (
      toolId ===
      "audio-pitch-changer"
    ) {
      const semitones =
        clamp(
          safeNumber(
            options.pitch,
            0
          ),
          -12,
          12
        );

      const factor =
        Math.pow(
          2,
          semitones / 12
        );

      const audioStream =
        metadata
          ? getAudioStream(
              metadata
            )
          : undefined;

      const sampleRate =
        Number(
          audioStream?.sample_rate
        );

      if (
        !Number.isFinite(
          sampleRate
        ) ||
        sampleRate <= 0
      ) {
        throw new Error(
          "Unable to determine the audio sample rate."
        );
      }

      /*
       * asetrate changes pitch.
       *
       * aresample restores the original sample rate.
       *
       * atempo compensates duration so the pitch change
       * does not unintentionally change playback speed.
       */
      const changedRate =
        Math.round(
          sampleRate *
            factor
        );

      const compensation =
        1 / factor;

      const tempoFilters: string[] =
        [];

      let remaining =
        compensation;

      while (
        remaining > 2
      ) {
        tempoFilters.push(
          "atempo=2"
        );

        remaining /= 2;
      }

      while (
        remaining < 0.5
      ) {
        tempoFilters.push(
          "atempo=0.5"
        );

        remaining /= 0.5;
      }

      tempoFilters.push(
        `atempo=${remaining.toFixed(
          4
        )}`
      );

      output =
        "pitch-changed.mp3";

      mimeType =
        "audio/mpeg";

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          input,

          "-vn",

          "-af",
          [
            `asetrate=${changedRate}`,
            `aresample=${sampleRate}`,
            ...tempoFilters,
          ].join(","),

          "-c:a",
          "libmp3lame",

          "-b:a",
          getBitrate(
            options.bitrate
          ),

          output,
        ]
      );
    }

    /* =====================================================
       METADATA
    ===================================================== */

    else if (
      toolId ===
      "audio-metadata-viewer"
    ) {
      throw new Error(
        "Metadata viewing is handled by getAudioMetadata()."
      );
    }

    else {
      throw new Error(
        `Unsupported audio operation: ${toolId}`
      );
    }

    const blob =
      await readBlob(
        ffmpeg,
        output,
        mimeType
      );

    return {
      blob,
      filename: output,
      mimeType,
    };
  } catch (error) {
    if (
      isFatalWasmError(
        error
      )
    ) {
      resetAfterError = true;
    }

    throw error;
  } finally {
    await safeDelete(
      ffmpeg,
      input
    );

    await safeDelete(
      ffmpeg,
      output
    );

    if (
      resetAfterError
    ) {
      resetAudioFFmpeg();
    }
  }
}

/* =========================================================
   PUBLIC PROCESS
========================================================= */

export async function processAudio(
  toolId: string,
  file: File,
  options: AudioProcessOptions = {}
): Promise<AudioOutput> {
  return runExclusive(
    async () => {
      try {
        return await processAudioInternal(
          toolId,
          file,
          options
        );
      } catch (error) {
        if (
          isFatalWasmError(
            error
          )
        ) {
          resetAudioFFmpeg();
        }

        throw error;
      }
    }
  );
}

/* =========================================================
   MERGE AUDIO
========================================================= */

async function mergeAudioInternal(
  files: File[]
): Promise<AudioOutput> {
  validateMergeFiles(
    files
  );

  const ffmpeg =
    await getFFmpeg();

  const inputs: string[] =
    [];

  const normalized: string[] =
    [];

  try {
    /*
     * Normalize every input to MP3.
     *
     * This allows different input formats to be merged.
     */
    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const input =
        await writeInput(
          ffmpeg,
          files[index],
          `merge_${index}`
        );

      inputs.push(
        input
      );
    }

    for (
      let index = 0;
      index < inputs.length;
      index++
    ) {
      const normalizedName =
        `normalized_${index}.mp3`;

      await execFFmpeg(
        ffmpeg,
        [
          "-i",
          inputs[index],

          "-vn",

          "-c:a",
          "libmp3lame",

          "-b:a",
          "192k",

          "-threads",
          "1",

          normalizedName,
        ]
      );

      normalized.push(
        normalizedName
      );
    }

    const concatFile =
      "audio_concat.txt";

    const concatContent =
      normalized
        .map(
          (name) =>
            `file '${name}'`
        )
        .join("\n");

    await ffmpeg.writeFile(
      concatFile,
      new TextEncoder().encode(
        concatContent
      )
    );

    const output =
      "merged.mp3";

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

        output,
      ]
    );

    const blob =
      await readBlob(
        ffmpeg,
        output,
        "audio/mpeg"
      );

    return {
      blob,
      filename: output,
      mimeType:
        "audio/mpeg",
    };
  } catch (error) {
    if (
      isFatalWasmError(
        error
      )
    ) {
      resetAudioFFmpeg();
    }

    throw error;
  } finally {
    await safeDeleteMany(
      ffmpeg,
      [
        ...inputs,
        ...normalized,
        "audio_concat.txt",
        "merged.mp3",
      ]
    );
  }
}

export async function mergeAudio(
  files: File[]
): Promise<AudioOutput> {
  return runExclusive(
    () =>
      mergeAudioInternal(
        files
      )
  );
}

/* =========================================================
   METADATA
========================================================= */

async function getAudioMetadataInternal(
  file: File
): Promise<AudioMetadata> {
  validateAudioFile(file);

  const ffmpeg =
    await getFFmpeg();

  const input =
    await writeInput(
      ffmpeg,
      file,
      "metadata_input"
    );

  const metadataFile =
    "metadata.json";

  try {
    await execFFprobe(
      ffmpeg,
      [
        "-v",
        "quiet",

        "-print_format",
        "json",

        "-show_entries",
        "format=filename,format_name,duration,size,bit_rate:stream=codec_name,codec_type,sample_rate,channels,channel_layout,duration,bit_rate",

        input,

        "-o",
        metadataFile,
      ]
    );

    const data =
      (await ffmpeg.readFile(
        metadataFile,
        "utf8"
      )) as string;

    return JSON.parse(
      data
    ) as AudioMetadata;
  } catch (error) {
    if (
      isFatalWasmError(
        error
      )
    ) {
      resetAudioFFmpeg();
    }

    throw error;
  } finally {
    await safeDelete(
      ffmpeg,
      input
    );

    await safeDelete(
      ffmpeg,
      metadataFile
    );
  }
}

export async function getAudioMetadata(
  file: File
): Promise<AudioMetadata> {
  return runExclusive(
    () =>
      getAudioMetadataInternal(
        file
      )
  );
}