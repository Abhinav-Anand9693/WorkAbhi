"use client";

import { useEffect, useState } from "react";

import type { ImageOutput } from "@/engine/video/videoEngine";

interface VideoImageResultsProps {
  images: ImageOutput[];
}

interface PreviewImage {
  filename: string;
  url: string;
}

export default function VideoImageResults({
  images,
}: VideoImageResultsProps) {
  const [previews, setPreviews] = useState<PreviewImage[]>([]);

  useEffect(() => {
    const next = images.map((image) => ({
      filename: image.filename,
      url: URL.createObjectURL(image.blob),
    }));

    setPreviews(next);

    return () => {
      for (const preview of next) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [images]);

  if (previews.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border bg-background p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Extracted Images</h3>
          <p className="text-sm text-muted-foreground">
            {previews.length} frame{previews.length === 1 ? "" : "s"} generated locally.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {previews.map((preview) => (
          <div
            key={preview.filename}
            className="overflow-hidden rounded-xl border bg-muted/20"
          >
            <img
              src={preview.url}
              alt={preview.filename}
              loading="lazy"
              decoding="async"
              className="aspect-video w-full object-contain bg-black"
            />
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="truncate text-xs text-muted-foreground">
                {preview.filename}
              </span>
              <a
                href={preview.url}
                download={preview.filename}
                className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
