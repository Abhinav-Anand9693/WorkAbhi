export interface RegexTestResult {
  matches: string[];
  count: number;
  passed: boolean;
}

export function encodeURL(
  input: string
): string {
  return encodeURIComponent(
    input
  );
}

export function decodeURL(
  input: string
): string {
  return decodeURIComponent(
    input
  );
}

export function encodeBase64(
  input: string
): string {
  const bytes =
    new TextEncoder().encode(
      input
    );

  let binary = "";

  bytes.forEach(
    (byte) => {
      binary += String.fromCharCode(
        byte
      );
    }
  );

  return btoa(binary);
}

export function decodeBase64(
  input: string
): string {
  const binary =
    atob(input.trim());

  const bytes =
    Uint8Array.from(
      binary,
      (char) =>
        char.charCodeAt(0)
    );

  return new TextDecoder().decode(
    bytes
  );
}

function base64UrlDecode(
  input: string
): string {
  const normalized =
    input
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const padding =
    "=".repeat(
      (4 -
        (normalized.length %
          4)) %
        4
    );

  return atob(
    normalized + padding
  );
}

export interface JWTDecoded {
  header: unknown;
  payload: unknown;
  signature: string;
}

export function decodeJWT(
  token: string
): JWTDecoded {
  const parts =
    token.trim().split(".");

  if (parts.length !== 3) {
    throw new Error(
      "A JWT must contain three parts."
    );
  }

  let header: unknown;
  let payload: unknown;

  try {
    header = JSON.parse(
      base64UrlDecode(
        parts[0]
      )
    );

    payload = JSON.parse(
      base64UrlDecode(
        parts[1]
      )
    );
  } catch {
    throw new Error(
      "Invalid JWT encoding or JSON payload."
    );
  }

  return {
    header,
    payload,
    signature: parts[2],
  };
}

function bytesToBase64Url(
  bytes: Uint8Array
): string {
  let binary = "";

  bytes.forEach(
    (byte) => {
      binary += String.fromCharCode(
        byte
      );
    }
  );

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function stringToBase64Url(
  value: string
): string {
  return bytesToBase64Url(
    new TextEncoder().encode(
      value
    )
  );
}

export async function generateJWT(
  payloadInput: string,
  secret: string
): Promise<string> {
  if (!secret.trim()) {
    throw new Error(
      "Secret key is required."
    );
  }

  const payload =
    JSON.parse(
      payloadInput
    );

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader =
    stringToBase64Url(
      JSON.stringify(header)
    );

  const encodedPayload =
    stringToBase64Url(
      JSON.stringify(payload)
    );

  const unsignedToken =
    `${encodedHeader}.${encodedPayload}`;

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(
        secret
      ),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(
        unsignedToken
      )
    );

  return `${unsignedToken}.${bytesToBase64Url(
    new Uint8Array(
      signature
    )
  )}`;
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function validateUUID(
  input: string
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    input.trim()
  );
}

export function testRegex(
  pattern: string,
  flags: string,
  input: string
): RegexTestResult {
  if (!pattern) {
    throw new Error(
      "Regex pattern is required."
    );
  }

  let regex: RegExp;

  try {
    regex = new RegExp(
      pattern,
      flags
    );
  } catch {
    throw new Error(
      "Invalid regular expression or flags."
    );
  }

  const matches =
    Array.from(
      input.matchAll(regex)
    ).map(
      (match) =>
        match[0]
    );

  return {
    matches,
    count: matches.length,
    passed:
      matches.length > 0,
  };
}

export function generateRegex(
  type: string
): string {
  switch (type) {
    case "email":
      return "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    case "phone":
      return "^\\+?[1-9]\\d{7,14}$";

    case "url":
      return "^(https?:\\/\\/)?([\\w-]+\\.)+[\\w-]+(?:\\/[^\\s]*)?$";

    case "ipv4":
      return "^(?:\\d{1,3}\\.){3}\\d{1,3}$";

    case "digits":
      return "^\\d+$";

    case "letters":
      return "^[A-Za-z]+$";

    case "alphanumeric":
      return "^[A-Za-z0-9]+$";

    case "date":
      return "^\\d{4}-\\d{2}-\\d{2}$";

    case "strong-password":
      return "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$";

    default:
      return "^.+$";
  }
}

export function timestampToDate(
  timestamp: number
): string {
  const milliseconds =
    Math.abs(timestamp) <
    100000000000
      ? timestamp * 1000
      : timestamp;

  const date =
    new Date(milliseconds);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid timestamp."
    );
  }

  return date.toISOString();
}

export function dateToTimestamp(
  input: string
): number {
  const date =
    new Date(input);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid date or time."
    );
  }

  return Math.floor(
    date.getTime() / 1000
  );
}

export function getUnixTimestamp(): number {
  return Math.floor(
    Date.now() / 1000
  );
}