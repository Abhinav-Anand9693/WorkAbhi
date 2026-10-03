import fs from "node:fs";
import path from "node:path";

export type ToolRoute = {
  id: string;
  name: string;
  category?: string;
};

const TOOL_HELPERS = [
  "imageTool",
  "videoTool",
  "calculatorTool",
  "colorTool",
  "developerTool",
  "qrTool",
  "textTool",
  "audioTool",
  "DataTool",
  "pdfTool",
  "securityTool",
  "dateTimeTool",
];

const CATEGORY_BY_HELPER: Record<string, string> = {
  imageTool: "image",
  videoTool: "video",
  calculatorTool: "calculator",
  colorTool: "color",
  developerTool: "developer",
  qrTool: "qr",
  textTool: "text",
  audioTool: "audio",
  DataTool: "file-data",
  pdfTool: "pdf",
  securityTool: "security",
  dateTimeTool: "date-time",
};

export function readToolInventory(): ToolRoute[] {
  const file = path.resolve(process.cwd(), "src/config/tools.ts");

  if (!fs.existsSync(file)) {
    throw new Error(`Tool registry not found: ${file}`);
  }

  const source = fs.readFileSync(file, "utf8");

  const helperPattern = new RegExp(
    `\\b(${TOOL_HELPERS.join(
      "|"
    )})\\s*\\(\\s*["']([^"']+)["']\\s*,\\s*["']([^"']+)["']`,
    "g"
  );

  const tools: ToolRoute[] = [];

  for (const match of source.matchAll(helperPattern)) {
    const [, helper, id, name] = match;

    if (!helper || !id || !name) {
      continue;
    }

    tools.push({
      id,
      name,
      category: CATEGORY_BY_HELPER[helper],
    });
  }

  return tools;
}

export function toolPath(id: string): string {
  return `/tool/${encodeURIComponent(id)}`;
}