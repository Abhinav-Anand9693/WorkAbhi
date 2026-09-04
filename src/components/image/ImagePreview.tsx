"use client";

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
  if (
    bytes === undefined ||
    bytes === null ||
    bytes === 0
  ) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
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
}: ImagePreviewProps) {
  const hasOriginal =
    Boolean(originalPreview);

  const hasResult =
    Boolean(resultPreview);

  if (!hasOriginal && !hasResult) {
    return null;
  }

  const preview =
    resultPreview ??
    originalPreview;

  return (
    <section className="rounded-2xl border bg-background p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Preview
          </h2>

          {originalName && (
            <p className="mt-1 text-sm text-muted-foreground">
              {originalName}
            </p>
          )}
        </div>

        {loading && (
          <span className="text-sm text-muted-foreground">
            Processing...
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {hasOriginal && (
          <PreviewCard
            title="Original"
            src={originalPreview!}
            size={originalSize}
          />
        )}

        {hasResult && resultPreview && (
          <PreviewCard
            title="Result"
            src={resultPreview}
            size={resultSize}
          />
        )}
      </div>

      {hasResult && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {result && onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={loading}
              className="flex-1 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download Result
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={loading}
              className="rounded-xl border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function PreviewCard({
  title,
  src,
  size,
}: {
  title: string;
  src: string;
  size?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">
          {title}
        </span>

        {size !== undefined && (
          <span className="text-xs text-muted-foreground">
            {formatBytes(size)}
          </span>
        )}
      </div>

      <div className="flex min-h-[260px] items-center justify-center overflow-hidden bg-muted/20 p-4 sm:min-h-[320px]">
        <img
          src={src}
          alt={`${title} image preview`}
          className="max-h-[500px] max-w-full object-contain"
        />
      </div>
    </div>
  );
}