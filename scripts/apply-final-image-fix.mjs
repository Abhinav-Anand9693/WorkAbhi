import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const pkgPath = path.join(
  root,
  "package.json"
);

const utilityPath = path.join(
  root,
  "src",
  "engine",
  "image",
  "imageUtilityEngine.ts"
);

// --------------------------------------------------
// Update package.json
// --------------------------------------------------

const pkg = JSON.parse(
  fs.readFileSync(pkgPath, "utf8")
);

pkg.scripts ??= {};

pkg.scripts["prepare:image-codec"] =
  "node scripts/prepare-image-codec.mjs";

pkg.scripts.dev =
  "npm run prepare:image-codec && next dev";

pkg.scripts.build =
  "npm run prepare:image-codec && next build";

fs.writeFileSync(
  pkgPath,
  JSON.stringify(pkg, null, 2) + "\n"
);

console.log(
  "[WorkAbhi] package.json updated."
);

// --------------------------------------------------
// Fix JPEG EXIF remover
// --------------------------------------------------

let source = fs.readFileSync(
  utilityPath,
  "utf8"
);

const broken = `    const stripped = stripJpegMetadata(bytes);
    const blobBytes = new Uint8Array(bytes.byteLength);
blobBytes.set(bytes);

return new Blob([blobBytes.buffer], {
  type: "image/jpeg",
});`;

const fixed = `    const stripped = stripJpegMetadata(bytes);
    const blobBytes = new Uint8Array(stripped.byteLength);
    blobBytes.set(stripped);

    return new Blob([blobBytes.buffer], {
      type: "image/jpeg",
    });`;

if (!source.includes(broken)) {
  if (
    source.includes(
      "const stripped = stripJpegMetadata(bytes);"
    ) &&
    source.includes(
      "blobBytes.set(stripped);"
    )
  ) {
    console.log(
      "[WorkAbhi] EXIF remover already fixed."
    );
  } else {
    throw new Error(
      "Could not find the expected JPEG EXIF-remover block. " +
      "No image source was changed."
    );
  }
} else {
  source = source.replace(
    broken,
    fixed
  );

  fs.writeFileSync(
    utilityPath,
    source
  );

  console.log(
    "[WorkAbhi] JPEG EXIF remover fixed."
  );
}

console.log(
  "[WorkAbhi] Final image fix applied. " +
  "No Git commit was created."
);