"use client";

import { useMemo, useState } from "react";
import {
  createBitcoinQR,
  createCalendarQR,
  createEmailQR,
  createEthereumQR,
  createEventQR,
  createLocationQR,
  createPhoneQR,
  createSMSQR,
  createUPIQR,
  createURLQR,
  createVCardQR,
  createWhatsAppQR,
  createWiFiQR,
  generateQRCode,
} from "@/engine/qr/qrGeneratorEngine";
import { scanQRCode } from "@/engine/qr/qrScannerEngine";
import {
  generateBarcode,
  type BarcodeFormat,
} from "@/engine/qr/barcodeEngine";

interface QRToolProps {
  toolId: string;
}

export default function QRTool({
  toolId,
}: QRToolProps) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [secondary, setSecondary] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [upiAmount, setUpiAmount] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [ssid, setSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  const isScanner = toolId === "qr-code-scanner";

  const barcodeFormat = useMemo<BarcodeFormat | null>(() => {
    if (toolId === "barcode-generator") return "CODE128";
    if (toolId === "ean-13-generator") return "EAN13";
    if (toolId === "code-128-generator") return "CODE128";
    if (toolId === "upc-generator") return "UPC";

    return null;
  }, [toolId]);

  async function processQR() {
    setError("");
    setLoading(true);

    try {
      let content = value.trim();

      if (toolId === "url-qr-generator") {
        content = createURLQR(value);
      }

      if (toolId === "text-qr-generator") {
        if (!content) {
          throw new Error("Please enter text.");
        }
      }

      if (toolId === "wifi-qr-generator") {
        content = createWiFiQR(
          ssid,
          secondary || "WPA",
          "WPA"
        );
      }

      if (toolId === "email-qr-generator") {
        content = createEmailQR(
          value,
          secondary
        );
      }

      if (toolId === "phone-qr-generator") {
        content = createPhoneQR(value);
      }

      if (toolId === "sms-qr-generator") {
        content = createSMSQR(
          value,
          secondary
        );
      }

      if (toolId === "vcard-qr-generator") {
        content = createVCardQR({
          firstName,
          lastName,
          phone: value,
          email: secondary,
        });
      }

      if (toolId === "location-qr-generator") {
        content = createLocationQR(
          Number(latitude),
          Number(longitude)
        );
      }

      if (toolId === "whatsapp-qr-generator") {
        content = createWhatsAppQR(
          value,
          secondary
        );
      }

      if (toolId === "bitcoin-qr-generator") {
        content = createBitcoinQR(
          value,
          secondary ? Number(secondary) : undefined
        );
      }

      if (toolId === "ethereum-qr-generator") {
        content = createEthereumQR(
          value,
          secondary
        );
      }

      if (toolId === "upi-qr-generator") {
        content = createUPIQR({
          upiId,
          name: upiName,
          amount: upiAmount
            ? Number(upiAmount)
            : undefined,
        });
      }

      if (toolId === "event-qr-generator") {
        content = createEventQR({
          title: value,
          start: secondary,
          end: secondary,
        });
      }

      if (toolId === "calendar-qr-generator") {
        content = createCalendarQR({
          title: value,
          date: secondary,
          startTime: "09:00",
          endTime: "10:00",
        });
      }

      if (!content) {
        throw new Error("Please enter some content.");
      }

      const blob = await generateQRCode(content);

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }

      const url = URL.createObjectURL(blob);

      setResult(blob);
      setResultUrl(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function processBarcode() {
    if (!barcodeFormat) return;

    setError("");
    setLoading(true);

    try {
      const blob = await generateBarcode(
        value,
        barcodeFormat
      );

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
      }

      const url = URL.createObjectURL(blob);

      setResult(blob);
      setResultUrl(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate barcode."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleScanner(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setLoading(true);
    setScanResult("");

    try {
      const decoded = await scanQRCode(file);
      setScanResult(decoded);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to scan QR code."
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function downloadResult() {
    if (!result) return;

    const url = URL.createObjectURL(result);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${toolId}.png`;
    anchor.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function reset() {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    setValue("");
    setSecondary("");
    setResult(null);
    setResultUrl(null);
    setScanResult("");
    setError("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5 sm:p-6">
        {isScanner ? (
          <>
            <h2 className="text-lg font-semibold">
              Scan QR Code
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Upload an image containing a QR code.
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleScanner}
              disabled={loading}
              className="mt-5 block w-full rounded-lg border p-3"
            />
          </>
        ) : barcodeFormat ? (
          <>
            <h2 className="text-lg font-semibold">
              Generate Barcode
            </h2>

            <input
              value={value}
              onChange={(e) =>
                setValue(e.target.value)
              }
              placeholder={
                barcodeFormat === "EAN13"
                  ? "Enter 13 digit EAN"
                  : barcodeFormat === "UPC"
                    ? "Enter 12 digit UPC"
                    : "Enter barcode value"
              }
              className="mt-5 w-full rounded-lg border bg-background px-4 py-3 outline-none"
            />

            <button
              type="button"
              onClick={processBarcode}
              disabled={loading}
              className="mt-4 rounded-lg px-5 py-3 font-medium border hover:bg-muted disabled:opacity-50"
            >
              {loading
                ? "Generating..."
                : "Generate Barcode"}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">
              Generate QR Code
            </h2>

            {toolId === "location-qr-generator" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <input
                  value={latitude}
                  onChange={(e) =>
                    setLatitude(e.target.value)
                  }
                  placeholder="Latitude"
                  className="rounded-lg border px-4 py-3"
                />

                <input
                  value={longitude}
                  onChange={(e) =>
                    setLongitude(e.target.value)
                  }
                  placeholder="Longitude"
                  className="rounded-lg border px-4 py-3"
                />
              </div>
            ) : toolId === "wifi-qr-generator" ? (
              <div className="mt-5 space-y-3">
                <input
                  value={ssid}
                  onChange={(e) =>
                    setSsid(e.target.value)
                  }
                  placeholder="WiFi network name"
                  className="w-full rounded-lg border px-4 py-3"
                />

                <input
                  value={secondary}
                  onChange={(e) =>
                    setSecondary(e.target.value)
                  }
                  placeholder="Security: WPA"
                  className="w-full rounded-lg border px-4 py-3"
                />

                <input
                  value={wifiPassword}
                  onChange={(e) =>
                    setWifiPassword(e.target.value)
                  }
                  placeholder="WiFi password"
                  type="password"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>
            ) : toolId === "vcard-qr-generator" ? (
              <div className="mt-5 space-y-3">
                <input
                  value={firstName}
                  onChange={(e) =>
                    setFirstName(e.target.value)
                  }
                  placeholder="First name"
                  className="w-full rounded-lg border px-4 py-3"
                />

                <input
                  value={lastName}
                  onChange={(e) =>
                    setLastName(e.target.value)
                  }
                  placeholder="Last name"
                  className="w-full rounded-lg border px-4 py-3"
                />

                <input
                  value={value}
                  onChange={(e) =>
                    setValue(e.target.value)
                  }
                  placeholder="Phone"
                  className="w-full rounded-lg border px-4 py-3"
                />

                <input
                  value={secondary}
                  onChange={(e) =>
                    setSecondary(e.target.value)
                  }
                  placeholder="Email"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>
            ) : toolId === "upi-qr-generator" ? (
              <div className="mt-5 space-y-3">
                <input
                  value={upiId}
                  onChange={(e) =>
                    setUpiId(e.target.value)
                  }
                  placeholder="example@upi"
                  className="w-full rounded-lg border px-4 py-3"
                />

                <input
                  value={upiName}
                  onChange={(e) =>
                    setUpiName(e.target.value)
                  }
                  placeholder="Payee name"
                  className="w-full rounded-lg border px-4 py-3"
                />

                <input
                  value={upiAmount}
                  onChange={(e) =>
                    setUpiAmount(e.target.value)
                  }
                  placeholder="Amount in INR"
                  type="number"
                  className="w-full rounded-lg border px-4 py-3"
                />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <textarea
                  value={value}
                  onChange={(e) =>
                    setValue(e.target.value)
                  }
                  placeholder="Enter content..."
                  rows={5}
                  className="w-full resize-y rounded-lg border bg-background px-4 py-3 outline-none"
                />

                {[
                  "email-qr-generator",
                  "sms-qr-generator",
                  "whatsapp-qr-generator",
                  "bitcoin-qr-generator",
                  "ethereum-qr-generator",
                ].includes(toolId) && (
                  <input
                    value={secondary}
                    onChange={(e) =>
                      setSecondary(e.target.value)
                    }
                    placeholder="Optional additional information"
                    className="w-full rounded-lg border px-4 py-3"
                  />
                )}
              </div>
            )}

            <button
              type="button"
              onClick={processQR}
              disabled={loading}
              className="mt-4 rounded-lg border px-5 py-3 font-medium hover:bg-muted disabled:opacity-50"
            >
              {loading
                ? "Generating..."
                : "Generate QR Code"}
            </button>
          </>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </section>

      {resultUrl && (
        <section className="rounded-2xl border bg-background p-6 text-center">
          <h3 className="font-semibold">
            Generated Result
          </h3>

          <div className="mx-auto mt-5 flex max-w-md items-center justify-center rounded-xl border bg-white p-5">
            <img
              src={resultUrl}
              alt="Generated QR code or barcode"
              className="max-h-[420px] w-auto object-contain"
            />
          </div>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={downloadResult}
              className="rounded-lg border px-5 py-3 font-medium hover:bg-muted"
            >
              Download PNG
            </button>

            <button
              type="button"
              onClick={reset}
              className="rounded-lg border px-5 py-3 font-medium hover:bg-muted"
            >
              Start Over
            </button>
          </div>
        </section>
      )}

      {scanResult && (
        <section className="rounded-2xl border bg-background p-6">
          <h3 className="font-semibold">
            QR Code Result
          </h3>

          <textarea
            readOnly
            value={scanResult}
            rows={6}
            className="mt-4 w-full rounded-lg border bg-muted/20 p-4"
          />

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(scanResult)
            }
            className="mt-3 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            Copy Result
          </button>
        </section>
      )}
    </div>
  );
}