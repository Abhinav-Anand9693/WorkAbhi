export interface GradientOptions {
  type: "linear" | "radial";
  angle: number;
  color1: string;
  color2: string;
}

export function createGradientCSS(
  options: GradientOptions
): string {
  const {
    type,
    angle,
    color1,
    color2,
  } = options;

  if (type === "radial") {
    return `background: radial-gradient(circle, ${color1}, ${color2});`;
  }

  return `background: linear-gradient(${angle}deg, ${color1}, ${color2});`;
}

export function createBorderRadiusCSS(
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number
): string {
  return `border-radius: ${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px;`;
}

export function createBoxShadowCSS(
  x: number,
  y: number,
  blur: number,
  spread: number,
  color: string,
  inset = false
): string {
  return `box-shadow: ${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px ${color};`;
}

export function createButtonCSS(
  background: string,
  textColor: string,
  borderColor: string,
  radius: number,
  paddingX: number,
  paddingY: number
): string {
  return `.button {
  display: inline-block;
  padding: ${paddingY}px ${paddingX}px;
  background: ${background};
  color: ${textColor};
  border: 1px solid ${borderColor};
  border-radius: ${radius}px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.button:hover {
  opacity: 0.9;
}`;
}

export function createTextShadowCSS(
  x: number,
  y: number,
  blur: number,
  color: string
): string {
  return `text-shadow: ${x}px ${y}px ${blur}px ${color};`;
}