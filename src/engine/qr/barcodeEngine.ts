import JsBarcode from "jsbarcode";

export type BarcodeFormat =
  | "CODE128"
  | "EAN13"
  | "UPC";

export interface BarcodeOptions {
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  lineColor?: string;
  background?: string;
}

const DEFAULT_OPTIONS: Required<BarcodeOptions> = {
  width: 2,
  height: 120,
  displayValue: true,
  fontSize: 18,
  margin: 20,
  lineColor: "#000000",
  background: "#ffffff",
};

function validateEAN13(value: string): boolean {
  return /^\d{13}$/.test(value);
}

function validateUPC(value: string): boolean {
  return /^\d{12}$/.test(value);
}

function validateCode128(value: string): boolean {
  return value.length > 0;
}

export async function generateBarcode(
  value: string,
  format: BarcodeFormat,
  options: BarcodeOptions = {}
): Promise<Blob> {
  const input = value.trim();

  if (!input) {
    throw new Error("Please enter a barcode value.");
  }

  if (format === "EAN13" && !validateEAN13(input)) {
    throw new Error("EAN-13 requires exactly 13 digits.");
  }

  if (format === "UPC" && !validateUPC(input)) {
    throw new Error("UPC requires exactly 12 digits.");
  }

  if (format === "CODE128" && !validateCode128(input)) {
    throw new Error("Please enter a valid Code 128 value.");
  }

  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const canvas = document.createElement("canvas");

  const formatMap: Record<BarcodeFormat, string> = {
    CODE128: "CODE128",
    EAN13: "EAN13",
    UPC: "UPC",
  };

  JsBarcode(canvas, input, {
    format: formatMap[format],
    width: settings.width,
    height: settings.height,
    displayValue: settings.displayValue,
    fontSize: settings.fontSize,
    margin: settings.margin,
    lineColor: settings.lineColor,
    background: settings.background,
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Unable to create barcode."));
          return;
        }

        resolve(result);
      },
      "image/png"
    );
  });

  canvas.width = 1;
  canvas.height = 1;

  return blob;
}

export function generateEAN13(value: string): Promise<Blob> {
  return generateBarcode(value, "EAN13");
}

export function generateCode128(value: string): Promise<Blob> {
  return generateBarcode(value, "CODE128");
}

export function generateUPC(value: string): Promise<Blob> {
  return generateBarcode(value, "UPC");
}