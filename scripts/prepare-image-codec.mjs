import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

// @standardagents/sip ships browser runtime files inside /dist
const sourceRoot = path.join(
  projectRoot,
  "node_modules",
  "@standardagents",
  "sip",
  "dist"
);

// Worker loads:
// /workabhi-codecs/sip/index.js
const outputRoot = path.join(
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

function fail(message) {
  console.error(`\n[WorkAbhi SIP] ERROR: ${message}\n`);
  process.exit(1);
}

console.log("[WorkAbhi SIP] Preparing browser codec assets...");

// Make sure SIP package exists
if (!fs.existsSync(sourceRoot)) {
  fail(
    `SIP dist directory was not found:\n${sourceRoot}\n\n` +
    `Run "npm ci" before building the project.`
  );
}

// Validate every required file BEFORE copying anything
for (const fileName of requiredFiles) {
  const source = path.join(sourceRoot, fileName);

  if (!fs.existsSync(source)) {
    fail(
      `Required SIP runtime file is missing:\n${source}`
    );
  }
}

// Create public runtime directory
fs.mkdirSync(outputRoot, {
  recursive: true,
});

// Copy browser runtime files
for (const fileName of requiredFiles) {
  const source = path.join(
    sourceRoot,
    fileName
  );

  const destination = path.join(
    outputRoot,
    fileName
  );

  fs.copyFileSync(
    source,
    destination
  );

  console.log(
    `[WorkAbhi SIP] copied ${fileName}`
  );
}

console.log(
  `[WorkAbhi SIP] Browser codec assets ready at:\n${outputRoot}`
);