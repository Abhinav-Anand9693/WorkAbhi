import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

const sourceDir = path.join(
  projectRoot,
  "node_modules",
  "@standardagents",
  "sip",
  "dist"
);

const outputDir = path.join(
  projectRoot,
  "public",
  "workabhi-codecs",
  "sip"
);

const requiredFiles = [
  "index.js",
  "sip.js",
  "sip.wasm",
];

if (!fs.existsSync(sourceDir)) {
  throw new Error(
    `SIP package was not found at ${sourceDir}. Run npm install first.`
  );
}

fs.mkdirSync(outputDir, {
  recursive: true,
});

for (const file of requiredFiles) {
  const source = path.join(sourceDir, file);
  const destination = path.join(outputDir, file);

  if (!fs.existsSync(source)) {
    throw new Error(
      `Required SIP codec file is missing: ${source}`
    );
  }

  fs.copyFileSync(source, destination);

  console.log(
    `[WorkAbhi] Prepared SIP codec: ${file}`
  );
}

console.log(
  "[WorkAbhi] Image codec preparation complete."
);