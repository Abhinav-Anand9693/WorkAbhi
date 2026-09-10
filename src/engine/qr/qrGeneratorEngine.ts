import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  darkColor?: string;
  lightColor?: string;
}

const DEFAULT_OPTIONS: Required<QRCodeOptions> = {
  width: 400,
  margin: 2,
  errorCorrectionLevel: "M",
  darkColor: "#000000",
  lightColor: "#ffffff",
};

function dataURLToBlob(dataURL: string): Blob {
  const [header, base64] = dataURL.split(",");

  if (!header || !base64) {
    throw new Error("Invalid QR image data.");
  }

  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || "image/png";

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], {
    type: mimeType,
  });
}

export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<Blob> {
  const value = text.trim();

  if (!value) {
    throw new Error("Please enter some content.");
  }

  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const dataURL = await QRCode.toDataURL(value, {
    width: settings.width,
    margin: settings.margin,
    errorCorrectionLevel: settings.errorCorrectionLevel,
    color: {
      dark: settings.darkColor,
      light: settings.lightColor,
    },
  });

  return dataURLToBlob(dataURL);
}

export function createURLQR(url: string): string {
  const value = url.trim();

  if (!value) {
    throw new Error("Please enter a URL.");
  }

  try {
    return new URL(value).toString();
  } catch {
    throw new Error("Please enter a valid URL.");
  }
}

export function createWiFiQR(
  ssid: string,
  password: string,
  security: "WPA" | "WEP" | "nopass",
  hidden = false
): string {
  if (!ssid.trim()) {
    throw new Error("WiFi name is required.");
  }

  if (security !== "nopass" && !password) {
    throw new Error("WiFi password is required.");
  }

  const escapeWifi = (value: string) =>
    value
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/:/g, "\\:");

  return `WIFI:T:${security};S:${escapeWifi(
    ssid
  )};P:${escapeWifi(password)};H:${hidden ? "true" : "false"};;`;
}

export function createEmailQR(
  email: string,
  subject = "",
  body = ""
): string {
  const value = email.trim();

  if (!value) {
    throw new Error("Email address is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Please enter a valid email address.");
  }

  const params = new URLSearchParams();

  if (subject.trim()) {
    params.set("subject", subject);
  }

  if (body.trim()) {
    params.set("body", body);
  }

  const query = params.toString();

  return `mailto:${value}${query ? `?${query}` : ""}`;
}

export function createPhoneQR(phone: string): string {
  const value = phone.trim();

  if (!value) {
    throw new Error("Phone number is required.");
  }

  return `tel:${value}`;
}

export function createSMSQR(
  phone: string,
  message = ""
): string {
  const value = phone.trim();

  if (!value) {
    throw new Error("Phone number is required.");
  }

  return `SMSTO:${value}:${message}`;
}

export function createVCardQR(data: {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  organization?: string;
  title?: string;
  website?: string;
  address?: string;
}): string {
  if (!data.firstName.trim()) {
    throw new Error("First name is required.");
  }

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${data.lastName ?? ""};${data.firstName};;;`,
    `FN:${[data.firstName, data.lastName]
      .filter(Boolean)
      .join(" ")}`,
  ];

  if (data.phone?.trim()) {
    lines.push(`TEL:${data.phone.trim()}`);
  }

  if (data.email?.trim()) {
    lines.push(`EMAIL:${data.email.trim()}`);
  }

  if (data.organization?.trim()) {
    lines.push(`ORG:${data.organization.trim()}`);
  }

  if (data.title?.trim()) {
    lines.push(`TITLE:${data.title.trim()}`);
  }

  if (data.website?.trim()) {
    lines.push(`URL:${data.website.trim()}`);
  }

  if (data.address?.trim()) {
    lines.push(`ADR:;;${data.address.trim()};;;;`);
  }

  lines.push("END:VCARD");

  return lines.join("\n");
}

export function createLocationQR(
  latitude: number,
  longitude: number
): string {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Valid latitude and longitude are required.");
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }

  return `geo:${latitude},${longitude}`;
}

export function createWhatsAppQR(
  phone: string,
  message = ""
): string {
  const value = phone.trim();

  if (!value) {
    throw new Error("Phone number is required.");
  }

  const digits = value.replace(/[^\d+]/g, "");

  if (!digits) {
    throw new Error("Please enter a valid phone number.");
  }

  const query = message.trim()
    ? `?text=${encodeURIComponent(message)}`
    : "";

  return `https://wa.me/${digits.replace("+", "")}${query}`;
}

export function createBitcoinQR(
  address: string,
  amount?: number,
  label?: string
): string {
  const value = address.trim();

  if (!value) {
    throw new Error("Bitcoin address is required.");
  }

  const params = new URLSearchParams();

  if (amount !== undefined && Number.isFinite(amount) && amount > 0) {
    params.set("amount", amount.toString());
  }

  if (label?.trim()) {
    params.set("label", label.trim());
  }

  const query = params.toString();

  return `bitcoin:${value}${query ? `?${query}` : ""}`;
}

export function createEthereumQR(
  address: string,
  amount?: string
): string {
  const value = address.trim();

  if (!value) {
    throw new Error("Ethereum address is required.");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("Please enter a valid Ethereum address.");
  }

  if (amount?.trim()) {
    return `ethereum:${value}?value=${amount.trim()}`;
  }

  return `ethereum:${value}`;
}

export function createUPIQR(data: {
  upiId: string;
  name?: string;
  amount?: number;
  note?: string;
}): string {
  const upiId = data.upiId.trim();

  if (!upiId) {
    throw new Error("UPI ID is required.");
  }

  if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
    throw new Error("Please enter a valid UPI ID.");
  }

  const params = new URLSearchParams();

  params.set("pa", upiId);

  if (data.name?.trim()) {
    params.set("pn", data.name.trim());
  }

  if (
    data.amount !== undefined &&
    Number.isFinite(data.amount) &&
    data.amount > 0
  ) {
    params.set("am", data.amount.toFixed(2));
  }

  if (data.note?.trim()) {
    params.set("tn", data.note.trim());
  }

  params.set("cu", "INR");

  return `upi://pay?${params.toString()}`;
}

export function createEventQR(data: {
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}): string {
  if (!data.title.trim()) {
    throw new Error("Event title is required.");
  }

  if (!data.start || !data.end) {
    throw new Error("Event start and end times are required.");
  }

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid event date.");
    }

    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  };

  return [
    "BEGIN:VEVENT",
    `SUMMARY:${data.title.trim()}`,
    `DTSTART:${formatDate(data.start)}`,
    `DTEND:${formatDate(data.end)}`,
    data.location?.trim()
      ? `LOCATION:${data.location.trim()}`
      : "",
    data.description?.trim()
      ? `DESCRIPTION:${data.description.trim()}`
      : "",
    "END:VEVENT",
  ]
    .filter(Boolean)
    .join("\n");
}

export function createCalendarQR(data: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
}): string {
  if (!data.title.trim()) {
    throw new Error("Calendar title is required.");
  }

  if (!data.date || !data.startTime || !data.endTime) {
    throw new Error("Date and time are required.");
  }

  const start = `${data.date}T${data.startTime}`;
  const end = `${data.date}T${data.endTime}`;

  return createEventQR({
    title: data.title,
    start,
    end,
    location: data.location,
    description: data.description,
  });
}