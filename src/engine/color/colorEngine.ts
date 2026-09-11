export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeHex(hex: string): string {
  let value = hex.trim().replace(/^#/, "");

  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error("Please enter a valid 6-digit HEX color.");
  }

  return `#${value.toUpperCase()}`;
}

export function hexToRGB(hex: string): RGB {
  const normalized = normalizeHex(hex);

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const values = [r, g, b].map((value) => {
    if (!Number.isFinite(value)) {
      throw new Error("RGB values must be valid numbers.");
    }

    return Math.round(clamp(value));
  });

  return (
    "#" +
    values
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function rgbToHSL(r: number, g: number, b: number): HSL {
  r = clamp(r) / 255;
  g = clamp(g) / 255;
  b = clamp(b) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;

  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;

    s =
      l > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min);

    switch (max) {
      case r:
        h =
          (g - b) / delta +
          (g < b ? 6 : 0);
        break;

      case g:
        h = (b - r) / delta + 2;
        break;

      case b:
        h = (r - g) / delta + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: round(h * 360, 1),
    s: round(s * 100, 1),
    l: round(l * 100, 1),
  };
}

function hueToRGB(
  p: number,
  q: number,
  t: number
): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;

  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }

  if (t < 1 / 2) {
    return q;
  }

  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }

  return p;
}

export function hslToRGB(
  h: number,
  s: number,
  l: number
): RGB {
  if (
    !Number.isFinite(h) ||
    !Number.isFinite(s) ||
    !Number.isFinite(l)
  ) {
    throw new Error("HSL values must be valid numbers.");
  }

  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;

  if (s === 0) {
    const value = Math.round(l * 255);

    return {
      r: value,
      g: value,
      b: value,
    };
  }

  const hue = h / 360;

  const q =
    l < 0.5
      ? l * (1 + s)
      : l + s - l * s;

  const p = 2 * l - q;

  return {
    r: Math.round(
      hueToRGB(p, q, hue + 1 / 3) * 255
    ),
    g: Math.round(
      hueToRGB(p, q, hue) * 255
    ),
    b: Math.round(
      hueToRGB(p, q, hue - 1 / 3) * 255
    ),
  };
}

export function hexToHSL(hex: string): HSL {
  const rgb = hexToRGB(hex);

  return rgbToHSL(
    rgb.r,
    rgb.g,
    rgb.b
  );
}

export function hslToHex(
  h: number,
  s: number,
  l: number
): string {
  const rgb = hslToRGB(h, s, l);

  return rgbToHex(
    rgb.r,
    rgb.g,
    rgb.b
  );
}

export function rgbToCMYK(
  r: number,
  g: number,
  b: number
): CMYK {
  r = clamp(r) / 255;
  g = clamp(g) / 255;
  b = clamp(b) / 255;

  const k = 1 - Math.max(r, g, b);

  if (k >= 1) {
    return {
      c: 0,
      m: 0,
      y: 0,
      k: 100,
    };
  }

  return {
    c: round(((1 - r - k) / (1 - k)) * 100, 1),
    m: round(((1 - g - k) / (1 - k)) * 100, 1),
    y: round(((1 - b - k) / (1 - k)) * 100, 1),
    k: round(k * 100, 1),
  };
}

export function cmykToRGB(
  c: number,
  m: number,
  y: number,
  k: number
): RGB {
  c = Math.min(100, Math.max(0, c)) / 100;
  m = Math.min(100, Math.max(0, m)) / 100;
  y = Math.min(100, Math.max(0, y)) / 100;
  k = Math.min(100, Math.max(0, k)) / 100;

  return {
    r: Math.round(
      255 * (1 - c) * (1 - k)
    ),
    g: Math.round(
      255 * (1 - m) * (1 - k)
    ),
    b: Math.round(
      255 * (1 - y) * (1 - k)
    ),
  };
}

export function hexToCMYK(hex: string): CMYK {
  const rgb = hexToRGB(hex);

  return rgbToCMYK(
    rgb.r,
    rgb.g,
    rgb.b
  );
}

export function cmykToHex(
  c: number,
  m: number,
  y: number,
  k: number
): string {
  const rgb = cmykToRGB(
    c,
    m,
    y,
    k
  );

  return rgbToHex(
    rgb.r,
    rgb.g,
    rgb.b
  );
}

export function relativeLuminance(
  r: number,
  g: number,
  b: number
): number {
  const values = [r, g, b].map(
    (value) => {
      const normalized = value / 255;

      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) **
            2.4;
    }
  );

  return (
    0.2126 * values[0] +
    0.7152 * values[1] +
    0.0722 * values[2]
  );
}

export function contrastRatio(
  foreground: RGB,
  background: RGB
): number {
  const l1 = relativeLuminance(
    foreground.r,
    foreground.g,
    foreground.b
  );

  const l2 = relativeLuminance(
    background.r,
    background.g,
    background.b
  );

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return round(
    (lighter + 0.05) /
      (darker + 0.05),
    2
  );
}

export function mixColors(
  color1: string,
  color2: string,
  amount = 50
): string {
  const rgb1 = hexToRGB(color1);
  const rgb2 = hexToRGB(color2);

  const ratio = Math.min(
    100,
    Math.max(0, amount)
  ) / 100;

  return rgbToHex(
    rgb1.r + (rgb2.r - rgb1.r) * ratio,
    rgb1.g + (rgb2.g - rgb1.g) * ratio,
    rgb1.b + (rgb2.b - rgb1.b) * ratio
  );
}

export function generateShades(
  hex: string,
  count = 10
): string[] {
  const rgb = hexToRGB(hex);
  const safeCount = Math.max(
    2,
    Math.min(count, 20)
  );

  return Array.from(
    { length: safeCount },
    (_, index) => {
      const factor =
        index / (safeCount - 1);

      return rgbToHex(
        rgb.r * (1 - factor),
        rgb.g * (1 - factor),
        rgb.b * (1 - factor)
      );
    }
  );
}

export function generateTints(
  hex: string,
  count = 10
): string[] {
  const rgb = hexToRGB(hex);
  const safeCount = Math.max(
    2,
    Math.min(count, 20)
  );

  return Array.from(
    { length: safeCount },
    (_, index) => {
      const factor =
        index / (safeCount - 1);

      return rgbToHex(
        rgb.r +
          (255 - rgb.r) * factor,
        rgb.g +
          (255 - rgb.g) * factor,
        rgb.b +
          (255 - rgb.b) * factor
      );
    }
  );
}