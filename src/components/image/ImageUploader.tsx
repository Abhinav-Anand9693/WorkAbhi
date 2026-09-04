"use client";

interface ImageUploaderProps {
  multiple?: boolean;
  onFilesSelected: (
    files: File[]
  ) => void;
  disabled?: boolean;
}

export default function ImageUploader({
  multiple = false,
  onFilesSelected,
  disabled = false,
}: ImageUploaderProps) {
  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files;

    if (!files) {
      return;
    }

    const selectedFiles =
      Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

    onFilesSelected(selectedFiles);

    event.target.value = "";
  }

  return (
    <section className="rounded-2xl border bg-background p-6">
      <label
        htmlFor="image-upload"
        className={[
          "flex min-h-[240px] cursor-pointer",
          "flex-col items-center justify-center",
          "rounded-xl border-2 border-dashed",
          "px-6 py-10 text-center",
          "transition-colors",
          "hover:bg-muted/40",
          disabled
            ? "pointer-events-none opacity-50"
            : "",
        ].join(" ")}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold">
          Upload Image
        </h3>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {multiple
            ? "Select one or more images from your device."
            : "Select an image from your device."}
        </p>

        <span className="mt-5 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background">
          Choose {multiple ? "Images" : "Image"}
        </span>

        <p className="mt-4 text-xs text-muted-foreground">
          JPG, PNG, WEBP, GIF and other browser-supported
          image formats
        </p>

        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
        />
      </label>
    </section>
  );
}