"use client";

import { useEffect, useState } from "react";

import type { ImageOutput } from "@/engine/video/videoEngine";

interface VideoImageResultsProps {
  images: ImageOutput[];
}

export default function VideoImageResults({
  images,
}: VideoImageResultsProps) {
  /*
   * We initialize URLs when the component mounts.
   * The parent gives this component a new key whenever
   * a new extraction result is produced, so we don't
   * need a setState inside an effect.
   */
  const [urls] = useState<string[]>(() =>
    images.map((image) => URL.createObjectURL(image.blob))
  );

  /*
   * Revoke object URLs when this component unmounts.
   */
  useEffect(() => {
    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [urls]);

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border bg-background p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">
          Extracted Images
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {images.length} image
          {images.length !== 1 ? "s" : ""} extracted from
          your video.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => {
          const url = urls[index];

          return (
            <div
              key={`${image.filename}-${index}`}
              className="overflow-hidden rounded-xl border bg-background"
            >
              <div className="aspect-video bg-black">
                {url && (
                  <img
                    src={url}
                    alt={`Extracted frame ${index + 1}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Frame {index + 1}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {image.filename}
                  </p>
                </div>

                {url && (
                  <a
                    href={url}
                    download={image.filename}
                    className="shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}