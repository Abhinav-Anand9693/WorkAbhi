import { createRequire } from "node:module";
import { mkdir, copyFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const entry = require.resolve("@standardagents/sip");
const distDir = dirname(entry);

const projectRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  ".."
);

const publicDir = join(
  projectRoot,
  "public",
  "workabhi-codecs",
  "sip"
);

const required = [
  "index.js",
  "sip.js",
  "sip.wasm",
];

await mkdir(publicDir, { recursive: true });

for (const file of required) {
  const source = join(distDir, file);
  const target = join(publicDir, file);

  try {
    await access(source);
  } catch {
    throw new Error(
      `@standardagents/sip is missing ${file} at ${source}. ` +
      `Install @standardagents/sip@1.0.1 before building WorkAbhi.`
    );
  }

  await copyFile(source, target);

  console.log(
    `[WorkAbhi] prepared SIP asset: ${file}`
  );
}

console.log(
  "[WorkAbhi] SIP browser codec assets are ready."
);