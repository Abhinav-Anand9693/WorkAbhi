const PASSWORD_SYMBOLS = "!@#$%^&*()-_=+[]{}:,.?";

const PASSPHRASE_WORDS = [
  "amber","anchor","apple","arrow","atlas","autumn","bamboo","beacon",
  "berry","birch","blaze","bloom","blue","brave","bridge","cactus",
  "canyon","cedar","circle","cloud","cobalt","comet","coral","cosmic",
  "crystal","dawn","delta","desert","diamond","drift","eagle","ember",
  "falcon","fern","forest","frost","galaxy","garden","glacier","gold",
  "harbor","hazel","horizon","island","ivory","jasmine","jungle","lantern",
  "lemon","light","lunar","maple","meadow","meteor","mint","moon",
  "mountain","nebula","ocean","olive","orbit","orchid","otter","pebble",
  "pine","planet","plum","polar","quartz","rain","raven","river",
  "rocket","rose","saffron","sage","shadow","silver","sky","solar",
  "spark","spring","stone","storm","summit","sunset","thunder","tiger",
  "trail","valley","violet","wave","willow","winter","wolf","zenith",
];

const USERNAME_ADJECTIVES = [
  "brave","bright","calm","clever","cosmic","crystal","digital","eager",
  "frosty","gentle","golden","lunar","mighty","modern","neon","rapid",
  "silent","smart","solar","swift","urban","vivid","wild","wise",
];

const USERNAME_NOUNS = [
  "arrow","atlas","beacon","bird","cloud","comet","eagle","falcon",
  "fox","galaxy","hawk","lion","meteor","moon","orbit","owl",
  "panda","pixel","rocket","river","tiger","wolf","zenith",
];

function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("Invalid random range.");
  }

  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % maxExclusive;
}

function secureChoice<T>(items: readonly T[]): T {
  return items[secureRandomInt(items.length)];
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function generateStrongPassword(options: PasswordOptions): string {
  const length = clampInteger(options.length, 8, 256);
  const groups: string[] = [];

  if (options.uppercase) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (options.lowercase) groups.push("abcdefghijklmnopqrstuvwxyz");
  if (options.numbers) groups.push("0123456789");
  if (options.symbols) groups.push(PASSWORD_SYMBOLS);

  if (groups.length === 0) {
    throw new Error("Select at least one character type.");
  }

  if (length < groups.length) {
    throw new Error(`Password length must be at least ${groups.length}.`);
  }

  const characters = groups.map((group) => secureChoice(group.split("")));
  const allCharacters = groups.join("");

  while (characters.length < length) {
    characters.push(secureChoice(allCharacters.split("")));
  }

  // Fisher-Yates shuffle using cryptographically secure randomness.
  for (let i = characters.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }

  return characters.join("");
}

export function generatePassphrase(
  wordCount = 6,
  separator = "-"
): string {
  const count = clampInteger(wordCount, 3, 20);
  const words = Array.from({ length: count }, () =>
    secureChoice(PASSPHRASE_WORDS)
  );

  return words.join(separator || "-");
}

export function generatePIN(length = 6): string {
  const safeLength = clampInteger(length, 4, 32);
  let pin = "";

  for (let i = 0; i < safeLength; i += 1) {
    pin += String(secureRandomInt(10));
  }

  return pin;
}

export function generateUsername(): string {
  const adjective = secureChoice(USERNAME_ADJECTIVES);
  const noun = secureChoice(USERNAME_NOUNS);
  const suffix = secureRandomInt(10000).toString().padStart(4, "0");

  return `${adjective}${noun}${suffix}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashText(
  text: string,
  algorithm: "SHA-1" | "SHA-256" | "SHA-512"
): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algorithm, data);
  return bytesToHex(new Uint8Array(digest));
}

function leftRotate(value: number, amount: number): number {
  return (value << amount) | (value >>> (32 - amount));
}

// MD5 is not provided by Web Crypto. This implementation is local-only
// and is intended for compatibility/tooling, not password storage.
export function md5(text: string): string {
  const input = new TextEncoder().encode(text);
  const bitLength = input.length * 8;
  const totalLength = (((input.length + 8) >> 6) + 1) * 64;
  const buffer = new Uint8Array(totalLength);
  buffer.set(input);
  buffer[input.length] = 0x80;

  const view = new DataView(buffer.buffer);
  view.setUint32(totalLength - 8, bitLength >>> 0, true);
  view.setUint32(
    totalLength - 4,
    Math.floor(bitLength / 0x100000000) >>> 0,
    true
  );

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const k = Array.from({ length: 64 }, (_, i) =>
    Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0
  );

  for (let offset = 0; offset < buffer.length; offset += 64) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    const words = new Uint32Array(16);
    for (let i = 0; i < 16; i += 1) {
      words[i] = view.getUint32(offset + i * 4, true);
    }

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const next = d;
      const sum = (a + f + k[i] + words[g]) >>> 0;
      d = c;
      c = b;
      b = (b + leftRotate(sum, s[i])) >>> 0;
      a = next;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const output = new Uint8Array(16);
  const outputView = new DataView(output.buffer);
  outputView.setUint32(0, a0, true);
  outputView.setUint32(4, b0, true);
  outputView.setUint32(8, c0, true);
  outputView.setUint32(12, d0, true);

  return bytesToHex(output);
}

export function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function decodeBase64(value: string): string {
  const binary = atob(value.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export function encodeURL(value: string): string {
  return encodeURIComponent(value);
}

export function decodeURL(value: string): string {
  return decodeURIComponent(value);
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function encodeHTML(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

export function decodeHTML(value: string): string {
  const document = new DOMParser().parseFromString(
    `<body>${value}</body>`,
    "text/html"
  );

  return document.body.textContent ?? "";
}

export function rot13(value: string): string {
  return value.replace(/[A-Za-z]/g, (character) => {
    const code = character.charCodeAt(0);
    const base = code <= 90 ? 65 : 97;

    return String.fromCharCode(
      ((code - base + 13) % 26) + base
    );
  });
}

export function caesarCipher(
  value: string,
  shift: number
): string {
  const normalizedShift = ((Math.floor(shift) % 26) + 26) % 26;

  return value.replace(/[A-Za-z]/g, (character) => {
    const code = character.charCodeAt(0);
    const base = code <= 90 ? 65 : 97;

    return String.fromCharCode(
      ((code - base + normalizedShift) % 26) + base
    );
  });
}
