import { cp, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "node_modules", "@standardagents", "sip", "dist");
const destination = path.join(root, "public", "workabhi-codecs", "sip");
const required = ["index.js", "sip.js", "sip.wasm"];

try {
  await Promise.all(required.map((name) => access(path.join(source, name))));
} catch {
  console.error("[WorkAbhi] @standardagents/sip is not installed.");
  console.error("[WorkAbhi] Run: npm install @standardagents/sip@1.0.1");
  process.exit(1);
}

await mkdir(destination, { recursive: true });
for (const name of required) {
  await cp(path.join(source, name), path.join(destination, name), { force: true });
}

console.log("[WorkAbhi] Image codec assets prepared in public/workabhi-codecs/sip/");
