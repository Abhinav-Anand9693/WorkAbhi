"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  createBitcoinQR, createCalendarQR, createEmailQR, createEthereumQR,
  createEventQR, createLocationQR, createPhoneQR, createSMSQR,
  createUPIQR, createURLQR, createVCardQR, createWhatsAppQR,
  createWiFiQR, generateQRCode,
} from "@/engine/qr/qrGeneratorEngine";
import { scanQRCode, scanQRCodeFrame } from "@/engine/qr/qrScannerEngine";
import { generateBarcode, type BarcodeFormat } from "@/engine/qr/barcodeEngine";

interface QRToolProps { toolId: string; }

export default function QRTool({ toolId }: QRToolProps) {
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
  const [wifiSecurity, setWifiSecurity] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [calendarDate, setCalendarDate] = useState("");
  const [calendarStartTime, setCalendarStartTime] = useState("09:00");
  const [calendarEndTime, setCalendarEndTime] = useState("10:00");
  const [calendarLocation, setCalendarLocation] = useState("");
  const [calendarDescription, setCalendarDescription] = useState("");
  const [qrWidth, setQrWidth] = useState(400);
  const [qrMargin, setQrMargin] = useState(2);
  const [qrErrorCorrection, setQrErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [qrDarkColor, setQrDarkColor] = useState("#000000");
  const [qrLightColor, setQrLightColor] = useState("#ffffff");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraFrameRef = useRef<number | null>(null);

  const isScanner = toolId === "qr-code-scanner";
  const barcodeFormat = useMemo<BarcodeFormat | null>(() => {
    if (toolId === "barcode-generator") return "CODE128";
    if (toolId === "ean-13-generator") return "EAN13";
    if (toolId === "code-128-generator") return "CODE128";
    if (toolId === "upc-generator") return "UPC";
    return null;
  }, [toolId]);

  async function processQR() {
    setError(""); setLoading(true);
    try {
      let content = value.trim();
      if (toolId === "url-qr-generator") content = createURLQR(value);
      if (toolId === "text-qr-generator" && !content) throw new Error("Please enter text.");
      if (toolId === "wifi-qr-generator") content = createWiFiQR(ssid, wifiPassword, wifiSecurity);
      if (toolId === "email-qr-generator") content = createEmailQR(value, secondary);
      if (toolId === "phone-qr-generator") content = createPhoneQR(value);
      if (toolId === "sms-qr-generator") content = createSMSQR(value, secondary);
      if (toolId === "vcard-qr-generator") content = createVCardQR({ firstName, lastName, phone: value, email: secondary });
      if (toolId === "location-qr-generator") content = createLocationQR(Number(latitude), Number(longitude));
      if (toolId === "whatsapp-qr-generator") content = createWhatsAppQR(value, secondary);
      if (toolId === "bitcoin-qr-generator") content = createBitcoinQR(value, secondary ? Number(secondary) : undefined);
      if (toolId === "ethereum-qr-generator") content = createEthereumQR(value, secondary);
      if (toolId === "upi-qr-generator") content = createUPIQR({ upiId, name: upiName, amount: upiAmount ? Number(upiAmount) : undefined });
      if (toolId === "event-qr-generator") content = createEventQR({ title: value, start: eventStart, end: eventEnd, location: eventLocation, description: eventDescription });
      if (toolId === "calendar-qr-generator") content = createCalendarQR({ title: value, date: calendarDate, startTime: calendarStartTime, endTime: calendarEndTime, location: calendarLocation, description: calendarDescription });
      if (!content) throw new Error("Please enter some content.");
      const blob = await generateQRCode(content, {
        width: qrWidth,
        margin: qrMargin,
        errorCorrectionLevel: qrErrorCorrection,
        darkColor: qrDarkColor,
        lightColor: qrLightColor,
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResult(blob); setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function processBarcode() {
    if (!barcodeFormat) return;
    setError(""); setLoading(true);
    try {
      const blob = await generateBarcode(value, barcodeFormat);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResult(blob); setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate barcode.");
    } finally { setLoading(false); }
  }

  async function handleScanner(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setLoading(true); setScanResult("");
    try { setScanResult(await scanQRCode(file)); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to scan QR code."); }
    finally { setLoading(false); event.target.value = ""; }
  }

  function downloadResult() {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${toolId}.png`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function scanCameraFrame() {
    if (!cameraOpen || !videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      const maxDimension = 1000;
      const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const decoded = scanQRCodeFrame(context, canvas.width, canvas.height);
        if (decoded) {
          setScanResult(decoded);
          stopCamera();
          return;
        }
      }
    }
    cameraFrameRef.current = requestAnimationFrame(scanCameraFrame);
  }

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera scanning is not supported in this browser. Please upload an image instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
          cameraFrameRef.current = requestAnimationFrame(scanCameraFrame);
        }
      });
    } catch {
      setCameraError("Unable to access the camera. Check browser permission or upload an image instead.");
    }
  }

  function stopCamera() {
    if (cameraFrameRef.current !== null) {
      cancelAnimationFrame(cameraFrameRef.current);
      cameraFrameRef.current = null;
    }
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  useEffect(() => () => {
    if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current);
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  function reset() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    stopCamera();
    setValue(""); setSecondary(""); setFirstName(""); setLastName(""); setUpiId(""); setUpiName(""); setUpiAmount(""); setLatitude(""); setLongitude(""); setSsid(""); setWifiPassword(""); setWifiSecurity("WPA"); setEventStart(""); setEventEnd(""); setEventLocation(""); setEventDescription(""); setCalendarDate(""); setCalendarStartTime("09:00"); setCalendarEndTime("10:00"); setCalendarLocation(""); setCalendarDescription(""); setResult(null); setResultUrl(null); setScanResult(""); setError("");
  }

  const field = "w-full rounded-lg border bg-background px-4 py-3 outline-none";
  const optionalTools = ["email-qr-generator", "sms-qr-generator", "whatsapp-qr-generator", "bitcoin-qr-generator", "ethereum-qr-generator"];

  return <div className="space-y-6">
    <section className="rounded-2xl border bg-background p-5 sm:p-6">
      {isScanner ? <>
        <h2 className="text-lg font-semibold">Scan QR Code</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upload an image or use your device camera to scan a QR code.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 cursor-pointer rounded-lg border p-3 text-center font-medium hover:bg-muted">
            Upload QR Image
            <input aria-label="Upload QR code image" type="file" accept="image/*" onChange={handleScanner} disabled={loading} className="sr-only" />
          </label>
          {!cameraOpen ? <button type="button" onClick={startCamera} disabled={loading} className="rounded-lg border px-5 py-3 font-medium hover:bg-muted disabled:opacity-50">Use Camera</button> : <button type="button" onClick={stopCamera} className="rounded-lg border px-5 py-3 font-medium hover:bg-muted">Stop Camera</button>}
        </div>
        {cameraOpen && <div className="mt-4 overflow-hidden rounded-xl border bg-black">
          <video ref={videoRef} muted playsInline aria-label="QR code camera preview" className="aspect-video w-full object-cover" />
          <p className="p-3 text-center text-sm text-white">Point the camera at a QR code. For best results, keep it centered and well lit.</p>
        </div>}
        {cameraError && <p role="alert" className="mt-3 text-sm text-destructive">{cameraError}</p>}
      </> : barcodeFormat ? <>
        <h2 className="text-lg font-semibold">Generate Barcode</h2>
        <input value={value} onChange={e => setValue(e.target.value)} placeholder={barcodeFormat === "EAN13" ? "Enter 13 digit EAN" : barcodeFormat === "UPC" ? "Enter 12 digit UPC" : "Enter barcode value"} className={`mt-5 ${field}`} />
        <button type="button" onClick={processBarcode} disabled={loading} className="mt-4 rounded-lg border px-5 py-3 font-medium hover:bg-muted disabled:opacity-50">{loading ? "Generating..." : "Generate Barcode"}</button>
      </> : <>
        <h2 className="text-lg font-semibold">Generate QR Code</h2>
        {toolId === "location-qr-generator" ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><input value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="Latitude" className={field} /><input value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="Longitude" className={field} /></div>
        : toolId === "wifi-qr-generator" ? <div className="mt-5 space-y-3"><input value={ssid} onChange={e => setSsid(e.target.value)} placeholder="WiFi network name" className={field} /><select value={wifiSecurity} onChange={e => setWifiSecurity(e.target.value as "WPA" | "WEP" | "nopass")} className={field}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">No password</option></select>{wifiSecurity !== "nopass" && <input value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} placeholder="WiFi password" type="password" className={field} />}</div>
        : toolId === "vcard-qr-generator" ? <div className="mt-5 space-y-3"><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className={field} /><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className={field} /><input value={value} onChange={e => setValue(e.target.value)} placeholder="Phone" className={field} /><input value={secondary} onChange={e => setSecondary(e.target.value)} placeholder="Email" className={field} /></div>
        : toolId === "upi-qr-generator" ? <div className="mt-5 space-y-3"><input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="example@upi" className={field} /><input value={upiName} onChange={e => setUpiName(e.target.value)} placeholder="Payee name" className={field} /><input value={upiAmount} onChange={e => setUpiAmount(e.target.value)} placeholder="Amount in INR" type="number" min="0" step="0.01" className={field} /></div>
        : toolId === "event-qr-generator" ? <div className="mt-5 space-y-3"><input value={value} onChange={e => setValue(e.target.value)} placeholder="Event title" className={field} /><input type="datetime-local" value={eventStart} onChange={e => setEventStart(e.target.value)} className={field} /><input type="datetime-local" value={eventEnd} onChange={e => setEventEnd(e.target.value)} className={field} /><input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Location (optional)" className={field} /><textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} placeholder="Description (optional)" rows={3} className={field} /></div>
        : toolId === "calendar-qr-generator" ? <div className="mt-5 space-y-3"><input value={value} onChange={e => setValue(e.target.value)} placeholder="Calendar title" className={field} /><input type="date" value={calendarDate} onChange={e => setCalendarDate(e.target.value)} className={field} /><div className="grid gap-3 sm:grid-cols-2"><input type="time" value={calendarStartTime} onChange={e => setCalendarStartTime(e.target.value)} className={field} /><input type="time" value={calendarEndTime} onChange={e => setCalendarEndTime(e.target.value)} className={field} /></div><input value={calendarLocation} onChange={e => setCalendarLocation(e.target.value)} placeholder="Location (optional)" className={field} /><textarea value={calendarDescription} onChange={e => setCalendarDescription(e.target.value)} placeholder="Description (optional)" rows={3} className={field} /></div>
        : <div className="mt-5 space-y-3"><textarea value={value} onChange={e => setValue(e.target.value)} placeholder="Enter content..." rows={5} className={`${field} resize-y`} />{optionalTools.includes(toolId) && <input value={secondary} onChange={e => setSecondary(e.target.value)} placeholder="Optional additional information" className={field} />}</div>}
        <details className="mt-5 rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">QR customization</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm"><span>Size: {qrWidth}px</span><input aria-label="QR size" type="range" min="200" max="1200" step="50" value={qrWidth} onChange={e => setQrWidth(Number(e.target.value))} className="w-full" /></label>
            <label className="space-y-2 text-sm"><span>Margin: {qrMargin}</span><input aria-label="QR margin" type="range" min="0" max="8" step="1" value={qrMargin} onChange={e => setQrMargin(Number(e.target.value))} className="w-full" /></label>
            <label className="space-y-2 text-sm"><span>Error correction</span><select aria-label="QR error correction" value={qrErrorCorrection} onChange={e => setQrErrorCorrection(e.target.value as "L" | "M" | "Q" | "H")} className={field}><option value="L">Low</option><option value="M">Medium</option><option value="Q">Quartile</option><option value="H">High</option></select></label>
            <label className="space-y-2 text-sm"><span>Foreground</span><input aria-label="QR foreground color" type="color" value={qrDarkColor} onChange={e => setQrDarkColor(e.target.value)} className="h-11 w-full rounded-lg border p-1" /></label>
            <label className="space-y-2 text-sm"><span>Background</span><input aria-label="QR background color" type="color" value={qrLightColor} onChange={e => setQrLightColor(e.target.value)} className="h-11 w-full rounded-lg border p-1" /></label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Keep strong contrast between foreground and background for reliable scanning.</p>
        </details>
        <button type="button" onClick={processQR} disabled={loading} className="mt-4 rounded-lg border px-5 py-3 font-medium hover:bg-muted disabled:opacity-50">{loading ? "Generating..." : "Generate QR Code"}</button>
      </>}
      {error && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
    </section>

    {resultUrl && <section aria-live="polite" className="rounded-2xl border bg-background p-6 text-center"><h3 className="font-semibold">Generated Result</h3><div className="mx-auto mt-5 flex max-w-md items-center justify-center rounded-xl border bg-white p-5"><Image src={resultUrl} alt="Generated QR code or barcode" width={600} height={600} unoptimized className="max-h-[420px] w-auto object-contain" /></div><div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={downloadResult} className="rounded-lg border px-5 py-3 font-medium hover:bg-muted">Download PNG</button><button type="button" onClick={reset} className="rounded-lg border px-5 py-3 font-medium hover:bg-muted">Start Over</button></div></section>}
    {scanResult && <section aria-live="polite" className="rounded-2xl border bg-background p-6"><h3 className="font-semibold">QR Code Result</h3><textarea readOnly value={scanResult} rows={6} className="mt-4 w-full rounded-lg border bg-muted/20 p-4" /><button type="button" onClick={() => navigator.clipboard.writeText(scanResult)} className="mt-3 rounded-lg border px-4 py-2 text-sm hover:bg-muted">Copy Result</button></section>}
  </div>;
}
