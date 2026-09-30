"use client";
import Image from "next/image";

interface ImagePreviewProps {
  originalPreview?: string | null;
  resultPreview?: string | null;

  originalName?: string;

  originalSize?: number;
  resultSize?: number;

  result?: Blob | null;

  onDownload?: () => void;
  onReset?: () => void;

  loading?: boolean;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "0 B";

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.floor(
    Math.log(bytes) /
      Math.log(1024)
  );

  return `${(
    bytes /
    Math.pow(1024, index)
  ).toFixed(2)} ${units[index]}`;
}

export default function ImagePreview({
  originalPreview,
  resultPreview,
  originalName,
  originalSize,
  resultSize,
  result,
  onDownload,
  onReset,
  loading = false,
}:  ImagePreviewProps) {
  const savedBytes =
    originalSize && resultSize
      ? originalSize - resultSize
      : 0;

  const savedPercentage =
    originalSize &&
    resultSize &&
    originalSize > 0
      ? Math.max(
          0,
          Math.round(
            (savedBytes /
              originalSize) *
              100
          )
        )
      : 0;

  return (
    <section className="rounded-2xl border bg-background p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          Preview
        </h2>

        {originalName && (
          <p className="mt-1 text-sm text-muted-foreground">
            {originalName}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border">
          <div className="border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Original
              </span>

              {originalSize && (
                <span className="text-sm text-muted-foreground">
                  {formatBytes(
                    originalSize
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-h-[280px] items-center justify-center bg-muted/10 p-4">
            {originalPreview ? (
                        <Image
              src={originalPreview}
              alt="Original image"
              width={1200}
              height={900}
              unoptimized
              className="max-h-[500px] max-w-full object-contain"
            />
            ) : (
              <span className="text-sm text-muted-foreground">
                No image
              </span>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <div className="border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Result
              </span>

              {resultSize && (
                <span className="text-sm text-muted-foreground">
                  {formatBytes(
                    resultSize
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-h-[280px] items-center justify-center bg-muted/10 p-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">
                Processing image...
              </div>
            ) : resultPreview ? (
                            <Image
                src={resultPreview}
                alt="Processed image"
                width={1200}
                height={900}
                unoptimized
                className="max-h-[500px] max-w-full object-contain"
              />
            ) : (
              <span className="text-sm text-muted-foreground">
                Processed image will appear here
              </span>
            )}
          </div>
        </div>
      </div>

      {resultSize &&
        originalSize && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Original
              </p>

              <p className="mt-1 font-semibold">
                {formatBytes(
                  originalSize
                )}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Result
              </p>

              <p className="mt-1 font-semibold">
                {formatBytes(
                  resultSize
                )}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Saved
              </p>

              <p className="mt-1 font-semibold">
                {savedPercentage}%
              </p>
            </div>
          </div>
        )}

      {result && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onDownload}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            Download Result
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border px-6 py-3 font-semibold hover:bg-muted"
          >
            Start Over
          </button>
        </div>
      )}
    </section>
  );
}