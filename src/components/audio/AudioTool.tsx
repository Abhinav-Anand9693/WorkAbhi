"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getAudioMetadata,
  mergeAudio,
  processAudio,
  type AudioMetadata,
  type AudioOutput,
  type AudioProcessOptions,
} from "@/engine/audio/audioEngine";

interface AudioToolProps {
  toolId: string;
}

type AudioFormat = "mp3" | "wav" | "ogg" | "m4a";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const total = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default function AudioTool({
  toolId,
}: AudioToolProps) {
  const isMerge = toolId === "audio-merger";

  const isMetadata =
    toolId === "audio-metadata-viewer";

  const isTrim =
    toolId === "audio-trimmer" ||
    toolId === "audio-cutter";

  const isConverter =
    toolId === "audio-converter" ||
    toolId === "mp3-converter" ||
    toolId === "wav-converter" ||
    toolId === "ogg-converter" ||
    toolId === "m4a-converter" ||
    toolId === "mp3-to-wav" ||
    toolId === "wav-to-mp3" ||
    toolId === "mp3-to-ogg" ||
    toolId === "ogg-to-mp3";

  const isVolumeBooster =
    toolId === "audio-volume-booster";

  const isFade =
    toolId === "audio-fade-in" ||
    toolId === "audio-fade-out";

  const isSpeedChanger =
    toolId === "audio-speed-changer";

  const isPitchChanger =
    toolId === "audio-pitch-changer";

  const [files, setFiles] = useState<File[]>([]);

  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");

  const [format, setFormat] =
    useState<AudioFormat>("mp3");

  const [bitrate, setBitrate] =
    useState<AudioProcessOptions["bitrate"]>("192k");

  const [volume, setVolume] = useState("2");

  const [fadeDuration, setFadeDuration] =
    useState("3");

  const [speed, setSpeed] = useState("1");

  const [pitch, setPitch] = useState("0");

  const [result, setResult] =
    useState<AudioOutput | null>(null);

  const [metadata, setMetadata] =
    useState<AudioMetadata | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] = useState("");

  const [previewUrl, setPreviewUrl] =
    useState("");

  /*
   * Object URL reference used only for cleanup.
   *
   * IMPORTANT:
   * string | null is required because the ref
   * intentionally becomes null after cleanup.
   */
  const previewUrlRef =
    useRef<string | null>(null);

  /*
   * Cleanup the current preview URL when the
   * component is unmounted.
   */
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );

        previewUrlRef.current = null;
      }
    };
  }, []);

  /*
   * Revoke the current preview URL and clear
   * the state.
   *
   * This is called before creating a new result.
   */
  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );

      previewUrlRef.current = null;
    }

    setPreviewUrl("");
  }

  /*
   * Create a preview URL for a processed
   * audio output.
   */
  function setResultPreview(
    output: AudioOutput
  ) {
    clearPreviewUrl();

    const url =
      URL.createObjectURL(output.blob);

    previewUrlRef.current = url;

    setPreviewUrl(url);
  }

  async function handleProcess() {
    const selectedFile = files[0];

    if (!selectedFile) {
      setError(
        "Please select an audio file."
      );
      return;
    }

    setError("");
    setResult(null);
    setMetadata(null);

    /*
     * Remove the previous generated preview
     * before starting a new operation.
     */
    clearPreviewUrl();

    setProcessing(true);

    try {
      /*
       * Metadata Viewer
       */
      if (isMetadata) {
        const data =
          await getAudioMetadata(
            selectedFile
          );

        setMetadata(data);
        return;
      }

      /*
       * Audio Merger
       */
      if (isMerge) {
        if (files.length < 2) {
          setError(
            "Please select at least two audio files to merge."
          );
          return;
        }

        const output =
          await mergeAudio(files);

        setResult(output);
        setResultPreview(output);

        return;
      }

      /*
       * Build processing options.
       */
      const options: AudioProcessOptions = {};

      /*
       * Trim / Cutter
       */
      if (isTrim) {
        const startValue =
          Number(start);

        if (
          !Number.isFinite(startValue) ||
          startValue < 0
        ) {
          throw new Error(
            "Start time must be a valid number greater than or equal to 0."
          );
        }

        options.start = startValue;

        if (end.trim() !== "") {
          const endValue = Number(end);

          if (
            !Number.isFinite(endValue) ||
            endValue <= startValue
          ) {
            throw new Error(
              "End time must be greater than the start time."
            );
          }

          options.end = endValue;
        }
      }

      /*
       * Converter
       */
      if (isConverter) {
        options.format = format;
        options.bitrate = bitrate;
      }

      /*
       * Volume Booster
       */
      if (isVolumeBooster) {
        const volumeValue =
          Number(volume);

        if (
          !Number.isFinite(volumeValue) ||
          volumeValue <= 0
        ) {
          throw new Error(
            "Volume multiplier must be greater than 0."
          );
        }

        options.volume = volumeValue;
        options.bitrate = bitrate;
      }

      /*
       * Fade In / Fade Out
       */
      if (isFade) {
        const fadeValue =
          Number(fadeDuration);

        if (
          !Number.isFinite(fadeValue) ||
          fadeValue <= 0
        ) {
          throw new Error(
            "Fade duration must be greater than 0."
          );
        }

        options.fadeDuration = fadeValue;
        options.bitrate = bitrate;
      }

      /*
       * Speed Changer
       */
      if (isSpeedChanger) {
        const speedValue =
          Number(speed);

        if (
          !Number.isFinite(speedValue) ||
          speedValue <= 0
        ) {
          throw new Error(
            "Speed must be greater than 0."
          );
        }

        options.speed = speedValue;
        options.bitrate = bitrate;
      }

      /*
       * Pitch Changer
       */
      if (isPitchChanger) {
        const pitchValue =
          Number(pitch);

        if (
          !Number.isFinite(pitchValue) ||
          pitchValue < -12 ||
          pitchValue > 12
        ) {
          throw new Error(
            "Pitch must be between -12 and +12 semitones."
          );
        }

        options.pitch = pitchValue;
        options.bitrate = bitrate;
      }

      /*
       * General audio processing.
       */
      if (
        !isConverter &&
        !isVolumeBooster &&
        !isFade &&
        !isSpeedChanger &&
        !isPitchChanger &&
        !isTrim
      ) {
        options.bitrate = bitrate;
      }

      const output =
        await processAudio(
          toolId,
          selectedFile,
          options
        );

      setResult(output);
      setResultPreview(output);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Audio processing failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      Array.from(
        event.target.files ?? []
      );

    /*
     * Clean the previous generated
     * preview immediately.
     */
    clearPreviewUrl();

    setFiles(selected);
    setResult(null);
    setMetadata(null);
    setError("");
  }

  function downloadResult() {
    if (!result) {
      return;
    }

    const url =
      URL.createObjectURL(
        result.blob
      );

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = result.filename;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    /*
     * Download URL is independent from
     * the preview URL.
     */
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      {/* =================================================
          UPLOADER
      ================================================= */}

      <div className="rounded-2xl border bg-card p-6">
        <label className="block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition hover:bg-muted/50">
          <input
            type="file"
            accept="audio/*"
            multiple={isMerge}
            onChange={handleFileChange}
            className="sr-only"
          />

          <div className="space-y-2">
            <div className="text-lg font-semibold">
              {isMerge
                ? "Select audio files"
                : "Select an audio file"}
            </div>

            <p className="text-sm text-muted-foreground">
              MP3, WAV, OGG, M4A and other
              browser-supported audio files
            </p>
          </div>
        </label>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span className="truncate">
                  {file.name}
                </span>

                <span className="ml-4 shrink-0 text-muted-foreground">
                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================
          CONTROLS
      ================================================= */}

      {files.length > 0 &&
        !isMetadata && (
          <div className="rounded-2xl border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* TRIM / CUT */}

              {isTrim && (
                <>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Start (seconds)
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={start}
                      onChange={(e) =>
                        setStart(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      End (seconds)
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="End of audio"
                      value={end}
                      onChange={(e) =>
                        setEnd(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2"
                    />
                  </label>
                </>
              )}

              {/* CONVERTER */}

              {isConverter && (
                <label className="space-y-2">
                  <span className="text-sm font-medium">
                    Output format
                  </span>

                  <select
                    value={format}
                    onChange={(e) =>
                      setFormat(
                        e.target.value as AudioFormat
                      )
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="mp3">
                      MP3
                    </option>

                    <option value="wav">
                      WAV
                    </option>

                    <option value="ogg">
                      OGG
                    </option>

                    <option value="m4a">
                      M4A
                    </option>
                  </select>
                </label>
              )}

              {/* BITRATE */}

              {!isMerge && (
                <label className="space-y-2">
                  <span className="text-sm font-medium">
                    Bitrate
                  </span>

                  <select
                    value={bitrate}
                    onChange={(e) =>
                      setBitrate(
                        e.target.value as AudioProcessOptions["bitrate"]
                      )
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="64k">
                      64 kbps
                    </option>

                    <option value="96k">
                      96 kbps
                    </option>

                    <option value="128k">
                      128 kbps
                    </option>

                    <option value="192k">
                      192 kbps
                    </option>

                    <option value="256k">
                      256 kbps
                    </option>

                    <option value="320k">
                      320 kbps
                    </option>
                  </select>
                </label>
              )}

              {/* VOLUME BOOSTER */}

              {isVolumeBooster && (
                <label className="space-y-2">
                  <span className="text-sm font-medium">
                    Volume multiplier
                  </span>

                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={volume}
                    onChange={(e) =>
                      setVolume(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />

                  <span className="block text-xs text-muted-foreground">
                    1× = original volume
                  </span>
                </label>
              )}

              {/* FADE */}

              {isFade && (
                <label className="space-y-2">
                  <span className="text-sm font-medium">
                    Fade duration
                  </span>

                  <input
                    type="number"
                    min="0.1"
                    max="60"
                    step="0.1"
                    value={fadeDuration}
                    onChange={(e) =>
                      setFadeDuration(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  />

                  <span className="block text-xs text-muted-foreground">
                    Duration in seconds
                  </span>
                </label>
              )}

              {/* SPEED */}

              {isSpeedChanger && (
                <label className="space-y-2">
                  <span className="text-sm font-medium">
                    Speed
                  </span>

                  <select
                    value={speed}
                    onChange={(e) =>
                      setSpeed(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="0.25">
                      0.25×
                    </option>

                    <option value="0.5">
                      0.5×
                    </option>

                    <option value="0.75">
                      0.75×
                    </option>

                    <option value="1">
                      1×
                    </option>

                    <option value="1.25">
                      1.25×
                    </option>

                    <option value="1.5">
                      1.5×
                    </option>

                    <option value="2">
                      2×
                    </option>

                    <option value="3">
                      3×
                    </option>

                    <option value="4">
                      4×
                    </option>
                  </select>
                </label>
              )}

              {/* PITCH */}

              {isPitchChanger && (
                <label className="space-y-2">
                  <span className="text-sm font-medium">
                    Pitch
                  </span>

                  <select
                    value={pitch}
                    onChange={(e) =>
                      setPitch(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="-12">
                      -12 semitones
                    </option>

                    <option value="-6">
                      -6 semitones
                    </option>

                    <option value="-3">
                      -3 semitones
                    </option>

                    <option value="0">
                      Original
                    </option>

                    <option value="3">
                      +3 semitones
                    </option>

                    <option value="6">
                      +6 semitones
                    </option>

                    <option value="12">
                      +12 semitones
                    </option>
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

      {/* =================================================
          ACTION
      ================================================= */}

      {files.length > 0 && (
        <button
          type="button"
          onClick={handleProcess}
          disabled={processing}
          className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing
            ? "Processing locally..."
            : isMetadata
              ? "Read Metadata"
              : isMerge
                ? "Merge Audio"
                : "Process Audio"}
        </button>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* =================================================
          RESULT
      ================================================= */}

      {result && (
        <div className="rounded-2xl border bg-card p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">
                Processing complete
              </h3>

              <p className="text-sm text-muted-foreground">
                {result.filename}
              </p>
            </div>

            {previewUrl && (
              <audio
                controls
                preload="metadata"
                src={previewUrl}
                className="w-full"
              >
                Your browser does not support
                the audio player.
              </audio>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={downloadResult}
                className="flex-1 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90"
              >
                Download Audio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          METADATA
      ================================================= */}

      {metadata && (
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Audio Metadata
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetadataRow
              label="Format"
              value={
                metadata.format
                  ?.format_name
              }
            />

            <MetadataRow
              label="Duration"
              value={
                metadata.format
                  ?.duration
                  ? formatTime(
                      Number(
                        metadata.format
                          .duration
                      )
                    )
                  : undefined
              }
            />

            <MetadataRow
              label="File size"
              value={
                metadata.format
                  ?.size
                  ? `${(
                      Number(
                        metadata.format.size
                      ) /
                      1024 /
                      1024
                    ).toFixed(2)} MB`
                  : undefined
              }
            />

            <MetadataRow
              label="Bitrate"
              value={
                metadata.format
                  ?.bit_rate
                  ? `${Math.round(
                      Number(
                        metadata.format
                          .bit_rate
                      ) / 1000
                    )} kbps`
                  : undefined
              }
            />

            {metadata.streams
              ?.filter(
                (stream) =>
                  stream.codec_type ===
                  "audio"
              )
              .map(
                (stream, index) => (
                  <div
                    key={index}
                    className="contents"
                  >
                    <MetadataRow
                      label="Codec"
                      value={
                        stream.codec_name
                      }
                    />

                    <MetadataRow
                      label="Sample rate"
                      value={
                        stream.sample_rate
                          ? `${(
                              Number(
                                stream.sample_rate
                              ) / 1000
                            ).toFixed(1)} kHz`
                          : undefined
                      }
                    />

                    <MetadataRow
                      label="Channels"
                      value={
                        stream.channels?.toString()
                      }
                    />

                    <MetadataRow
                      label="Channel layout"
                      value={
                        stream.channel_layout
                      }
                    />
                  </div>
                )
              )}
          </div>
        </div>
      )}

      {/* =================================================
          PRIVACY
      ================================================= */}

      <p className="text-center text-xs text-muted-foreground">
        Your audio is processed locally in
        your browser. Your file does not need
        to be uploaded to WorkAbhi servers.
      </p>
    </div>
  );
}

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 break-all font-medium">
        {value || "—"}
      </div>
    </div>
  );
}