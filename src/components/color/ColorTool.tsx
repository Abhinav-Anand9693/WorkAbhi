"use client";

import { useMemo, useState } from "react";

import {
  cmykToHex,
  cmykToRGB,
  contrastRatio,
  generateShades,
  generateTints,
  hexToCMYK,
  hexToHSL,
  hexToRGB,
  hslToHex,
  hslToRGB,
  mixColors,
  rgbToCMYK,
  rgbToHex,
  rgbToHSL,
} from "@/engine/color/colorEngine";

import {
  createBorderRadiusCSS,
  createBoxShadowCSS,
  createButtonCSS,
  createGradientCSS,
} from "@/engine/color/designEngine";

interface ColorToolProps {
  toolId: string;
}

function ColorPreview({
  color,
}: {
  color: string;
}) {
  return (
    <div
      className="h-32 w-full rounded-2xl border"
      style={{
        backgroundColor: color,
      }}
    />
  );
}

function ResultBox({
  value,
}: {
  value: string;
}) {
  function copy() {
    navigator.clipboard.writeText(value);
  }

  return (
    <div className="mt-5 rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <code className="break-all text-sm">
          {value}
        </code>

        <button
          type="button"
          onClick={copy}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

export default function ColorTool({
  toolId,
}: ColorToolProps) {
  const [hex, setHex] = useState("#6366F1");

  const [r, setR] = useState("99");
  const [g, setG] = useState("102");
  const [b, setB] = useState("241");

  const [h, setH] = useState("239");
  const [s, setS] = useState("84");
  const [l, setL] = useState("67");

  const [c, setC] = useState("59");
  const [m, setM] = useState("58");
  const [y, setY] = useState("0");
  const [k, setK] = useState("5");

  const [color1, setColor1] = useState("#6366F1");
  const [color2, setColor2] = useState("#EC4899");

  const [angle, setAngle] = useState("135");

  const [radius, setRadius] = useState("16");
  const [topLeft, setTopLeft] = useState("16");
  const [topRight, setTopRight] = useState("16");
  const [bottomRight, setBottomRight] = useState("16");
  const [bottomLeft, setBottomLeft] = useState("16");

  const [shadowX, setShadowX] = useState("0");
  const [shadowY, setShadowY] = useState("8");
  const [shadowBlur, setShadowBlur] = useState("24");
  const [shadowSpread, setShadowSpread] = useState("0");
  const [shadowColor, setShadowColor] =
    useState("rgba(0,0,0,0.18)");

  const [textColor, setTextColor] =
    useState("#FFFFFF");

  const [count, setCount] = useState("8");

  const [foreground, setForeground] =
    useState("#000000");

  const [background, setBackground] =
    useState("#FFFFFF");

  const [result, setResult] = useState("");

  const isConversionTool =
    [
      "hex-to-rgb",
      "rgb-to-hex",
      "rgb-to-hsl",
      "hsl-to-rgb",
      "hex-to-hsl",
      "hsl-to-hex",
      "rgb-to-cmyk",
      "cmyk-to-rgb",
      "hex-to-cmyk",
      "cmyk-to-hex",
    ].includes(toolId);

  function processConversion() {
    try {
      let output = "";

      if (toolId === "hex-to-rgb") {
        const value = hexToRGB(hex);

        output = `rgb(${value.r}, ${value.g}, ${value.b})`;
      }

      if (toolId === "rgb-to-hex") {
        output = rgbToHex(
          Number(r),
          Number(g),
          Number(b)
        );
      }

      if (toolId === "rgb-to-hsl") {
        const value = rgbToHSL(
          Number(r),
          Number(g),
          Number(b)
        );

        output = `hsl(${value.h}, ${value.s}%, ${value.l}%)`;
      }

      if (toolId === "hsl-to-rgb") {
        const value = hslToRGB(
          Number(h),
          Number(s),
          Number(l)
        );

        output = `rgb(${value.r}, ${value.g}, ${value.b})`;
      }

      if (toolId === "hex-to-hsl") {
        const value = hexToHSL(hex);

        output = `hsl(${value.h}, ${value.s}%, ${value.l}%)`;
      }

      if (toolId === "hsl-to-hex") {
        output = hslToHex(
          Number(h),
          Number(s),
          Number(l)
        );
      }

      if (toolId === "rgb-to-cmyk") {
        const value = rgbToCMYK(
          Number(r),
          Number(g),
          Number(b)
        );

        output = `cmyk(${value.c}%, ${value.m}%, ${value.y}%, ${value.k}%)`;
      }

      if (toolId === "cmyk-to-rgb") {
        const value = cmykToRGB(
          Number(c),
          Number(m),
          Number(y),
          Number(k)
        );

        output = `rgb(${value.r}, ${value.g}, ${value.b})`;
      }

      if (toolId === "hex-to-cmyk") {
        const value = hexToCMYK(hex);

        output = `cmyk(${value.c}%, ${value.m}%, ${value.y}%, ${value.k}%)`;
      }

      if (toolId === "cmyk-to-hex") {
        output = cmykToHex(
          Number(c),
          Number(m),
          Number(y),
          Number(k)
        );
      }

      setResult(output);
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Unable to convert color."
      );
    }
  }

  const generatedGradient = useMemo(
    () =>
      createGradientCSS({
        type: "linear",
        angle: Number(angle),
        color1,
        color2,
      }),
    [angle, color1, color2]
  );

  if (toolId === "color-picker") {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">
            Color Picker
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pick a color and get its HEX value.
          </p>

          <input
            type="color"
            value={hex}
            onChange={(e) =>
              setHex(e.target.value.toUpperCase())
            }
            className="mt-6 h-32 w-full cursor-pointer rounded-xl border p-2"
          />

          <ColorPreview color={hex} />

          <ResultBox value={hex} />
        </section>
      </div>
    );
  }

  if (isConversionTool) {
    const rgbTools = [
      "rgb-to-hex",
      "rgb-to-hsl",
      "rgb-to-cmyk",
    ];

    const hslTools = [
      "hsl-to-rgb",
      "hsl-to-hex",
    ];

    const cmykTools = [
      "cmyk-to-rgb",
      "cmyk-to-hex",
    ];

    return (
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          Color Conversion
        </h2>

        <div className="mt-6 space-y-4">
          {[
            "hex-to-rgb",
            "hex-to-hsl",
            "hex-to-cmyk",
          ].includes(toolId) && (
            <input
              value={hex}
              onChange={(e) =>
                setHex(e.target.value)
              }
              placeholder="#6366FF"
              className="w-full rounded-lg border px-4 py-3"
            />
          )}

          {rgbTools.includes(toolId) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["R", r, setR],
                ["G", g, setG],
                ["B", b, setB],
              ].map(
                ([label, value, setter]) => (
                  <input
                    key={String(label)}
                    value={String(value)}
                    onChange={(e) =>
                      (setter as React.Dispatch<
                        React.SetStateAction<string>
                      >)(e.target.value)
                    }
                    type="number"
                    min="0"
                    max="255"
                    placeholder={String(label)}
                    className="rounded-lg border px-4 py-3"
                  />
                )
              )}
            </div>
          )}

          {hslTools.includes(toolId) && (
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={h}
                onChange={(e) => setH(e.target.value)}
                type="number"
                placeholder="Hue"
                className="rounded-lg border px-4 py-3"
              />

              <input
                value={s}
                onChange={(e) => setS(e.target.value)}
                type="number"
                placeholder="Saturation %"
                className="rounded-lg border px-4 py-3"
              />

              <input
                value={l}
                onChange={(e) => setL(e.target.value)}
                type="number"
                placeholder="Lightness %"
                className="rounded-lg border px-4 py-3"
              />
            </div>
          )}

          {cmykTools.includes(toolId) && (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["C", c, setC],
                ["M", m, setM],
                ["Y", y, setY],
                ["K", k, setK],
              ].map(
                ([label, value, setter]) => (
                  <input
                    key={String(label)}
                    value={String(value)}
                    onChange={(e) =>
                      (setter as React.Dispatch<
                        React.SetStateAction<string>
                      >)(e.target.value)
                    }
                    type="number"
                    min="0"
                    max="100"
                    placeholder={`${label} %`}
                    className="rounded-lg border px-4 py-3"
                  />
                )
              )}
            </div>
          )}

          <button
            type="button"
            onClick={processConversion}
            className="rounded-lg border px-5 py-3 font-medium hover:bg-muted"
          >
            Convert
          </button>

          {result && <ResultBox value={result} />}
        </div>
      </section>
    );
  }

  if (
    toolId === "css-border-radius-generator"
  ) {
    const css = createBorderRadiusCSS(
      Number(topLeft),
      Number(topRight),
      Number(bottomRight),
      Number(bottomLeft)
    );

    return (
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          CSS Border Radius Generator
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {[
            ["Top Left", topLeft, setTopLeft],
            ["Top Right", topRight, setTopRight],
            ["Bottom Right", bottomRight, setBottomRight],
            ["Bottom Left", bottomLeft, setBottomLeft],
          ].map(([label, value, setter]) => (
            <input
              key={String(label)}
              type="number"
              value={String(value)}
              onChange={(e) =>
                (setter as React.Dispatch<
                  React.SetStateAction<string>
                >)(e.target.value)
              }
              placeholder={String(label)}
              className="rounded-lg border px-4 py-3"
            />
          ))}
        </div>

        <div
          className="mx-auto mt-8 h-48 max-w-md border bg-muted/20"
          style={{
            borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`,
          }}
        />

        <ResultBox value={css} />
      </section>
    );
  }

  if (
    toolId === "css-gradient-generator" ||
    toolId === "gradient-generator"
  ) {
    return (
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          Gradient Generator
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm">
              Color 1
            </span>

            <input
              type="color"
              value={color1}
              onChange={(e) =>
                setColor1(e.target.value)
              }
              className="h-12 w-full"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm">
              Color 2
            </span>

            <input
              type="color"
              value={color2}
              onChange={(e) =>
                setColor2(e.target.value)
              }
              className="h-12 w-full"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm">
              Angle
            </span>

            <input
              type="number"
              value={angle}
              onChange={(e) =>
                setAngle(e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </label>
        </div>

        <div
          className="mt-6 h-56 rounded-2xl border"
          style={{
            background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
          }}
        />

        <ResultBox value={generatedGradient} />
      </section>
    );
  }

  if (
    toolId === "css-box-shadow-generator"
  ) {
    const css = createBoxShadowCSS(
      Number(shadowX),
      Number(shadowY),
      Number(shadowBlur),
      Number(shadowSpread),
      shadowColor
    );

    return (
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          CSS Box Shadow Generator
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            value={shadowX}
            onChange={(e) =>
              setShadowX(e.target.value)
            }
            placeholder="X"
            className="rounded-lg border px-4 py-3"
          />

          <input
            type="number"
            value={shadowY}
            onChange={(e) =>
              setShadowY(e.target.value)
            }
            placeholder="Y"
            className="rounded-lg border px-4 py-3"
          />

          <input
            type="number"
            value={shadowBlur}
            onChange={(e) =>
              setShadowBlur(e.target.value)
            }
            placeholder="Blur"
            className="rounded-lg border px-4 py-3"
          />

          <input
            type="number"
            value={shadowSpread}
            onChange={(e) =>
              setShadowSpread(e.target.value)
            }
            placeholder="Spread"
            className="rounded-lg border px-4 py-3"
          />

          <input
            value={shadowColor}
            onChange={(e) =>
              setShadowColor(e.target.value)
            }
            placeholder="Shadow color"
            className="sm:col-span-2 rounded-lg border px-4 py-3"
          />
        </div>

        <div className="mt-10 flex justify-center p-10">
          <div
            className="h-32 w-64 rounded-2xl bg-background"
            style={{
              boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`,
            }}
          />
        </div>

        <ResultBox value={css} />
      </section>
    );
  }

  if (
    toolId === "css-button-generator"
  ) {
    const css = createButtonCSS(
      color1,
      textColor,
      color1,
      Number(radius),
      24,
      12
    );

    return (
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          CSS Button Generator
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm">
              Background
            </span>

            <input
              type="color"
              value={color1}
              onChange={(e) =>
                setColor1(e.target.value)
              }
              className="mt-2 h-12 w-full"
            />
          </label>

          <label>
            <span className="text-sm">
              Text Color
            </span>

            <input
              type="color"
              value={textColor}
              onChange={(e) =>
                setTextColor(e.target.value)
              }
              className="mt-2 h-12 w-full"
            />
          </label>

          <label>
            <span className="text-sm">
              Border Radius
            </span>

            <input
              type="number"
              value={radius}
              onChange={(e) =>
                setRadius(e.target.value)
              }
              className="mt-2 w-full rounded-lg border px-4 py-3"
            />
          </label>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            style={{
              background: color1,
              color: textColor,
              borderRadius: `${radius}px`,
              padding: "12px 24px",
              fontWeight: 600,
            }}
          >
            Preview Button
          </button>
        </div>

        <ResultBox value={css} />
      </section>
    );
  }

  if (
    toolId === "color-palette-generator"
  ) {
    const palette = [
      color1,
      ...Array.from(
        { length: 5 },
        (_, index) =>
          mixColors(
            color1,
            color2,
            index * 20
          )
      ),
    ];

    return (
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          Color Palette Generator
        </h2>

        <input
          type="color"
          value={color1}
          onChange={(e) =>
            setColor1(e.target.value)
          }
          className="mt-6 h-14 w-full"
        />

        <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl sm:grid-cols-6">
          {palette.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className="flex h-32 items-end p-3 text-xs font-medium"
              style={{
                backgroundColor: color,
              }}
            >
              {color}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (
    toolId === "contrast-checker"
  ) {
    let ratio = 0;

    try {
      ratio = contrastRatio(
        hexToRGB(foreground),
        hexToRGB(background)
      );
    } catch {
      ratio = 0;
    }

    const normalAA = ratio >= 4.5;
    const largeAA = ratio >= 3;
    const normalAAA = ratio >= 7;

    return (
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          WCAG Contrast Checker
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm">
              Foreground
            </span>

            <input
              type="color"
              value={foreground}
              onChange={(e) =>
                setForeground(e.target.value)
              }
              className="mt-2 h-12 w-full"
            />
          </label>

          <label>
            <span className="text-sm">
              Background
            </span>

            <input
              type="color"
              value={background}
              onChange={(e) =>
                setBackground(e.target.value)
              }
              className="mt-2 h-12 w-full"
            />
          </label>
        </div>

        <div
          className="mt-8 rounded-2xl p-10 text-center text-xl font-bold"
          style={{
            color: foreground,
            backgroundColor: background,
          }}
        >
          Contrast Preview
        </div>

        <div className="mt-6 rounded-xl border p-5">
          <p className="text-3xl font-bold">
            {ratio}:1
          </p>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              Normal AA:{" "}
              {normalAA ? "Pass ✓" : "Fail ✕"}
            </p>

            <p>
              Large Text AA:{" "}
              {largeAA ? "Pass ✓" : "Fail ✕"}
            </p>

            <p>
              Normal AAA:{" "}
              {normalAAA ? "Pass ✓" : "Fail ✕"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (
    toolId === "color-shades-generator" ||
    toolId === "color-tints-generator"
  ) {
    const colors =
      toolId === "color-shades-generator"
        ? generateShades(
            color1,
            Number(count)
          )
        : generateTints(
            color1,
            Number(count)
          );

    return (
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          {toolId === "color-shades-generator"
            ? "Color Shades Generator"
            : "Color Tints Generator"}
        </h2>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <input
            type="color"
            value={color1}
            onChange={(e) =>
              setColor1(e.target.value)
            }
            className="h-14 w-full sm:w-40"
          />

          <input
            type="number"
            min="2"
            max="20"
            value={count}
            onChange={(e) =>
              setCount(e.target.value)
            }
            className="rounded-lg border px-4 py-3"
          />
        </div>

        <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl sm:grid-cols-5">
          {colors.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className="flex h-28 items-end p-3 text-xs"
              style={{
                backgroundColor: color,
              }}
            >
              {color}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border p-6">
      <h2 className="text-xl font-semibold">
        Color & Design Tool
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Select a supported color or design tool.
      </p>
    </section>
  );
}