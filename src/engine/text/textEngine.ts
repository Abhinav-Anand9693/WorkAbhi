export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
}

export function countWords(text: string): number {
  const value = text.trim();

  if (!value) return 0;

  return value.split(/\s+/).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function countCharactersNoSpaces(
  text: string
): number {
  return text.replace(/\s/g, "").length;
}

export function countSentences(text: string): number {
  const value = text.trim();

  if (!value) return 0;

  const matches = value.match(
    /[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g
  );

  return matches?.filter(
    (sentence) => sentence.trim().length > 0
  ).length ?? 0;
}

export function countParagraphs(text: string): number {
  const value = text.trim();

  if (!value) return 0;

  return value
    .split(/\n\s*\n+/)
    .filter((paragraph) => paragraph.trim())
    .length;
}

export function countLines(text: string): number {
  if (!text) return 0;

  return text.split(/\r?\n/).length;
}

export function calculateReadingTime(
  text: string,
  wordsPerMinute = 200
): number {
  const words = countWords(text);

  if (!words) return 0;

  return Math.max(
    1,
    Math.ceil(words / wordsPerMinute)
  );
}

export function getTextStats(
  text: string
): TextStats {
  return {
    characters: countCharacters(text),
    charactersNoSpaces:
      countCharactersNoSpaces(text),
    words: countWords(text),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    lines: countLines(text),
    readingTimeMinutes:
      calculateReadingTime(text),
  };
}

export function toUpperCase(
  text: string
): string {
  return text.toUpperCase();
}

export function toLowerCase(
  text: string
): string {
  return text.toLowerCase();
}

export function toTitleCase(
  text: string
): string {
  return text
    .toLowerCase()
    .replace(
      /\b([a-z\u00C0-\u024F])/gi,
      (match) => match.toUpperCase()
    );
}

export function toSentenceCase(
  text: string
): string {
  const value = text.toLowerCase();

  return value.replace(
    /(^\s*[a-z])|([.!?]\s+[a-z])/g,
    (match) => match.toUpperCase()
  );
}

export function toggleCase(
  text: string
): string {
  return [...text]
    .map((char) => {
      if (char === char.toUpperCase()) {
        return char.toLowerCase();
      }

      return char.toUpperCase();
    })
    .join("");
}

export function removeExtraSpaces(
  text: string
): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\r?\n */g, "\n")
    .trim();
}

export function removeDuplicateLines(
  text: string
): string {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    const key = line.trim();

    if (!seen.has(key)) {
      seen.add(key);
      result.push(line);
    }
  }

  return result.join("\n");
}

export function sortLinesAlphabetically(
  text: string
): string {
  return text
    .split(/\r?\n/)
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base",
        numeric: true,
      })
    )
    .join("\n");
}

export function reverseText(
  text: string
): string {
  return [...text].reverse().join("");
}

export function reverseWords(
  text: string
): string {
  return text
    .trim()
    .split(/\s+/)
    .reverse()
    .join(" ");
}

export function removeLineBreaks(
  text: string
): string {
  return text
    .replace(/\r?\n+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function addLineBreaks(
  text: string
): string {
  return text
    .replace(
      /([.!?])\s+(?=[A-Z0-9])/g,
      "$1\n"
    )
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function repeatText(
  text: string,
  count: number,
  separator = "\n"
): string {
  if (!text) {
    throw new Error("Please enter some text.");
  }

  const safeCount = Math.min(
    1000,
    Math.max(1, Math.floor(count))
  );

  return Array(safeCount)
    .fill(text)
    .join(separator);
}

export function cleanText(
  text: string
): string {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function findAndReplace(
  text: string,
  find: string,
  replacement: string,
  replaceAll = true
): string {
  if (!find) {
    throw new Error("Please enter text to find.");
  }

  if (!replaceAll) {
    return text.replace(find, replacement);
  }

  return text.split(find).join(replacement);
}

export interface DifferenceResult {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export function compareText(
  first: string,
  second: string
): DifferenceResult {
  const firstLines = first.split(/\r?\n/);
  const secondLines = second.split(/\r?\n/);

  const secondSet = new Set(secondLines);
  const firstSet = new Set(firstLines);

  return {
    added: secondLines.filter(
      (line) => !firstSet.has(line)
    ),
    removed: firstLines.filter(
      (line) => !secondSet.has(line)
    ),
    unchanged: firstLines.filter(
      (line) => secondSet.has(line)
    ),
  };
}

export function getTextLength(
  text: string
): {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
} {
  return {
    characters: countCharacters(text),
    charactersNoSpaces:
      countCharactersNoSpaces(text),
    words: countWords(text),
    lines: countLines(text),
  };
}

const LOREM_WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
];

export function generateLoremIpsum(
  words = 100
): string {
  const count = Math.min(
    5000,
    Math.max(1, Math.floor(words))
  );

  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    result.push(
      LOREM_WORDS[i % LOREM_WORDS.length]
    );
  }

  return result.join(" ");
}

const RANDOM_WORDS = [
  "creative",
  "digital",
  "future",
  "technology",
  "design",
  "development",
  "software",
  "browser",
  "internet",
  "workspace",
  "developer",
  "project",
  "system",
  "platform",
  "business",
  "learning",
  "career",
  "innovation",
  "product",
  "solution",
];

export function generateRandomText(
  words = 50
): string {
  const count = Math.min(
    5000,
    Math.max(1, Math.floor(words))
  );

  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(
      Math.random() * RANDOM_WORDS.length
    );

    result.push(RANDOM_WORDS[index]);
  }

  return result.join(" ");
}

export function textToBinary(
  text: string
): string {
  const bytes = new TextEncoder().encode(text);

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(2).padStart(8, "0")
    )
    .join(" ");
}

export function binaryToText(
  binary: string
): string {
  const value = binary.trim();

  if (!value) {
    throw new Error("Please enter binary data.");
  }

  const groups = value.split(/\s+/);

  if (
    groups.some(
      (group) =>
        !/^[01]{8}$/.test(group)
    )
  ) {
    throw new Error(
      "Binary must contain 8-bit groups separated by spaces."
    );
  }

  const bytes = new Uint8Array(
    groups.map((group) =>
      parseInt(group, 2)
    )
  );

  return new TextDecoder().decode(bytes);
}

export function textToASCII(
  text: string
): string {
  if (!text) return "";

  const result: string[] = [];

  for (const char of text) {
    const code = char.codePointAt(0);

    if (
      code === undefined ||
      code > 127
    ) {
      throw new Error(
        "ASCII conversion supports standard ASCII characters only."
      );
    }

    result.push(String(code));
  }

  return result.join(" ");
}

export function asciiToText(
  ascii: string
): string {
  const value = ascii.trim();

  if (!value) {
    throw new Error("Please enter ASCII codes.");
  }

  const codes = value.split(/\s+/);

  return codes
    .map((code) => {
      const number = Number(code);

      if (
        !Number.isInteger(number) ||
        number < 0 ||
        number > 127
      ) {
        throw new Error(
          "ASCII codes must be integers from 0 to 127."
        );
      }

      return String.fromCharCode(number);
    })
    .join("");
  }

const MORSE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",

  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",

  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  "_": "..--.-",
  '"': ".-..-.",
  "$": "...-..-",
  "@": ".--.-.",
};

export function textToMorse(
  text: string
): string {
  return [...text.toUpperCase()]
    .map((char) => {
      if (char === " ") return "/";

      return MORSE[char] ?? char;
    })
    .join(" ");
}