"use client";

import {
  useEffect,
  useMemo,
} from "react";

interface SplitResultsProps {
  files: Blob[];
  onDownload: (
    blob: Blob,
    index: number
  ) => void;
  onDownloadAll: () => void;
}

function getExtension(
  type: string
): string {
  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export default function SplitResults({
  files,
  onDownload,
  onDownloadAll,
}: SplitResultsProps) {
  const urls = useMemo(
    () =>
      files.map((file) =>
        URL.createObjectURL(file)
      ),
    [files]
  );

  useEffect(() => {
    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [urls]);

  if (!files.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border bg-background p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">
            Split Images
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {files.length} images generated
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadAll}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Download All
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {files.map(
          (blob, index) => (
            <div
              key={`${blob.size}-${index}`}
              className="overflow-hidden rounded-xl border"
            >
              <img
                src={urls[index]}
                alt={`Split image ${index + 1}`}
                className="aspect-square w-full bg-muted/20 object-contain"
              />

              <div className="p-3">
                <button
                  type="button"
                  onClick={() =>
                    onDownload(
                      blob,
                      index
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Download
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export { getExtension };