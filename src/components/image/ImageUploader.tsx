"use client";

interface ImageUploaderProps {
  multiple?: boolean;
  selectedCount?: number;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function ImageUploader({
  multiple = false,
  selectedCount = 0,
  maxFiles = 1,
  onFilesSelected,
  disabled = false,
}: ImageUploaderProps) {
  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files =
      event.target.files;

    if (!files) {
      return;
    }

    const selectedFiles =
      Array.from(files).filter(
        (file) =>
          file.type.startsWith(
            "image/"
          )
      );

    if (!selectedFiles.length) {
      event.target.value = "";
      return;
    }

    const availableSlots =
      multiple
        ? Math.max(
            0,
            maxFiles - selectedCount
          )
        : 1;

    const filesToAdd =
      selectedFiles.slice(
        0,
        availableSlots
      );

    if (filesToAdd.length > 0) {
      onFilesSelected(
        filesToAdd
      );
    }

    event.target.value = "";
  }

  const canAddMore =
    !multiple ||
    selectedCount < maxFiles;

  return (
    <section className="rounded-2xl border bg-background p-6">
      <label
        htmlFor="image-upload"
        className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
          disabled || !canAddMore
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-muted/40"
        }`}
      >
        <div className="mb-4 text-4xl">
          🖼️
        </div>

        <h3 className="text-lg font-semibold">
          {multiple &&
          selectedCount > 0
            ? "Add More Images"
            : "Upload Image"}
        </h3>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {multiple
            ? `Select up to ${
                maxFiles -
                selectedCount
              } more image${
                maxFiles -
                  selectedCount ===
                1
                  ? ""
                  : "s"
              }.`
            : "Choose an image from your device."}
        </p>

        {multiple &&
          selectedCount > 0 && (
            <p className="mt-3 text-sm font-medium">
              {selectedCount} /{" "}
              {maxFiles} selected
            </p>
          )}

        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple={multiple}
          disabled={
            disabled ||
            !canAddMore
          }
          onChange={
            handleChange
          }
          className="sr-only"
        />
      </label>
    </section>
  );
}