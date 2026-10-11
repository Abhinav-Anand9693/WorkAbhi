# WorkAbhi image tools and low-memory audit

**Baseline:** `8710851de4f7b07d8c910906d346967809c0fc7a`  
**Scope:** static source audit of image tools, worker, SIP handoff, file processing, previews/downloads, and memory paths. This is not a device/runtime certification.

## Inventory (40 tools)

| Tool | Implementation |
|---|---|
| image-compressor | `compressImage` → worker → SIP/JPEG |
| compress-image-to-50kb | `compressToTargetSize` → worker/SIP |
| compress-image-to-100kb | `compressToTargetSize` → worker/SIP |
| compress-image-to-200kb | `compressToTargetSize` → worker/SIP |
| compress-image-to-500kb | `compressToTargetSize` → worker/SIP |
| compress-image-to-1mb | `compressToTargetSize` → worker/SIP |
| jpg-compressor | `compressImage` → worker/SIP/JPEG |
| png-compressor | `compressImage` → worker/OffscreenCanvas |
| webp-compressor | `compressImage` → worker/OffscreenCanvas |
| image-resizer | `compressImage` bounded by max dimensions |
| resize-image-by-width | `resizeByWidth` → `compressImage` |
| resize-image-by-height | `resizeByHeight` → `compressImage` |
| resize-image-by-percentage | `resizeByPercentage` → `compressImage` |
| image-cropper | `cropImage` |
| circular-image-cropper | `circularCrop` |
| image-rotator | `transformImage` |
| image-flipper | `transformImage` |
| image-sharpening | `sharpenCanvas` |
| image-blur | local `processCanvasImage` |
| pixelate-image | local `processCanvasImage` |
| grayscale-image | local `processCanvasImage` |
| black-and-white-image | local `processCanvasImage` |
| brightness-adjuster | local `processCanvasImage` |
| contrast-adjuster | local `processCanvasImage` |
| saturation-adjuster | local `processCanvasImage` |
| hue-adjuster | local `processCanvasImage` |
| exposure-adjuster | local `processCanvasImage` |
| opacity-adjuster | local `processCanvasImage` → PNG |
| image-border-generator | `addBorder` |
| rounded-corners | `roundedCorners` → PNG |
| image-watermark | `addWatermark` |
| add-text-to-image | `addTextToImage` |
| image-overlay | `overlayImages` |
| image-collage-maker | `createCollage` |
| image-splitter | `splitImage` |
| image-merger | `mergeImages` |
| image-color-picker | `pickColor` |
| image-metadata-viewer | `getImageMetadata` / EXIFR |
| exif-remover | controller uses `compressImage(... image/png)` |
| image-to-data-url | `imageToDataURL` |

Core files: `src/components/image/*`, `src/engine/image/*`, `src/workers/imageCompressionWorker.ts`, `src/types/image.ts`, `src/config/imageTools.ts`, `scripts/prepare-image-codec.mjs`, `package.json`, and `playwright.config.ts`.

## Confirmed/high-confidence findings

### P1 — JPEG resize dimension contract mismatch (fixed in this branch)

**File:** `src/workers/imageCompressionWorker.ts`, JPEG result validation.

The caller sets `expectedWidth/expectedHeight` to source dimensions while `resizeWidth/resizeHeight` carry the requested output. The old worker compared the codec result to source dimensions. Example: source 4000×3000, output 2000×1500. The correctly resized output could be rejected as inconsistent. This patch uses the explicit resize dimensions for output validation and the expected dimensions only when no resize was requested. A shared helper and regression tests cover selecting the expected output dimensions. **SIP runtime execution still needs to prove the end-to-end codec behavior.**

### P1 — Global pixel thresholds are not a device memory budget

**Files:** `src/engine/image/imageSafety.ts`, `ImageTool.tsx`, transform/composition/export engines.

The app defines 100M source-pixel and 40M canvas-pixel ceilings. One RGBA surface at 40M pixels is 160,000,000 bytes (~152.6 MiB). Sharpening additionally creates ImageData and a full-size copied `Uint8ClampedArray`; decoding, canvas backing stores, encoded output, and codec buffers add to the peak. Some local `processCanvasImage` paths create canvas/ImageData without consistently applying shared validators. An allowed image can therefore still exhaust low-RAM devices.

### P1 — Cancellation is not connected to many editing calls

**File:** `src/components/image/ImageTool.tsx`.

The compression worker path accepts an AbortSignal, but many crop, transform, pixel effect, composition and export calls do not pass the existing signal despite API support in several engines. The cancel handler can update UI state while the actual operation continues; unmount/reset does not consistently abort pending operations. Add abort wiring and a request-generation guard.

### P2 — MIME string used as the file validity test

**Files:** `ImageUploader.tsx`, `imageCompressionEngine.ts`.

`file.type.startsWith("image/")` does not establish that bytes actually encode that image format. Decoders usually reject invalid content, but malformed or spoofed MIME inputs aren't rejected by an application-level signature check before expensive work.

### P2 — WebP header parser only parses VP8X directly

**File:** `imageCompressionEngine.ts`.

Other valid WebP variants fall back to `createImageBitmap(file)` to discover dimensions. That may decode a full bitmap before the dimension safety check. Add VP8/VP8L fixtures or a safe metadata parser/decoder strategy.

### P2 — EXIF-remover route re-encodes everything to PNG

**File:** `ImageTool.tsx`.

The UI calls generic PNG compression instead of the dedicated `removeImageMetadata` utility. Metadata is generally removed by re-encoding, but JPEG/WebP become PNG and can become much larger. Orientation normalization and metadata removal should be asserted with real fixtures.

### P2 — Data URL conversion has a large-string peak

**File:** `imageUtilityEngine.ts`.

The source is streamed, but Base64 chunks are retained and joined into a complete string in UI state. Base64 alone adds roughly 33% over the source bytes, plus string/runtime overhead and the retained chunks. Use an explicit size guard or warning for large files.

### P2 — Preview URL lifecycle and async completion need a single owner

**File:** `ImageTool.tsx`.

Event handlers revoke URLs and a URL-dependent effect cleanup also revokes them; duplicate revocation itself is harmless. The more serious edge case is processing completing after reset/unmount and attempting to set state/create a new result URL. Abort on unmount/new upload and use refs/generation IDs to avoid stale results.

### P2 — Target-size mode can return non-JPEG source bytes unchanged

**File:** `imageCompressionEngine.ts`, `compressToTargetSize`.

For source files already smaller than the requested target, the function returns the original File before conversion. UI asks for JPEG output, but a small PNG/WebP can therefore remain PNG/WebP. Decide whether “target size” guarantees JPEG output or only a maximum byte count; test and message accordingly. Returning an already-small JPEG unchanged is a reasonable optimization.

### P2 — Partial batch success is presented as total success

**File:** `ImageTool.tsx`.

Per-file failures are retained while processing continues, but the surrounding success copy says all images were compressed successfully whenever results exist. Make mixed success explicit and test cancellation/re-upload/repeated batches.

### P3 — JPEG quality search wastes an initial search attempt

**File:** `imageCompressionWorker.ts`.

The first attempt measures max quality 0.95, but subsequent probes start at the midpoint of the entire configured range rather than narrowing the bracket using the first attempt. It keeps the smallest result found below target and errors if none exists, but uses fewer useful search probes than intended. Test output-size monotonicity and impossible targets with a corpus.

## Runtime checks still required

- SIP's actual resized output dimensions and returned metadata for JPEG variants / EXIF orientations.
- Binary-search and resolution-fallback behavior on noisy photographs; impossible target handling and subjective quality.
- iOS Safari / Android Chrome: worker dynamic import, WASM fetch, OffscreenCanvas/convertToBlob, output download, camera/file picker.
- EXIF orientations 1–8, alpha preservation, color profiles, corrupted and truncated images.
- Repeated upload/process/reset/unmount, stale async completion, abort mid-codec, multi-file mixed failures.
- Real peak memory on 2/3/4 GB Android and iPhone/iPad. Static review cannot establish actual device limits.
- Codec preparation and production asset routing under deployed CSP/cache configuration.

## Memory estimates

Formula: `width × height × 4 bytes` for one RGBA pixel surface.

| Resolution | Pixels | One RGBA surface | Assessment |
|---|---:|---:|---|
| 1920×1080 | 2.07M | 7.9 MiB | SAFE for most operations (not runtime-certified) |
| 4000×3000 | 12M | 45.8 MiB | WARNING |
| 6000×4000 | 24M | 91.6 MiB | DANGEROUS for full-res editing on low-memory mobile |
| 8000×6000 | 48M | 183.1 MiB | SHOULD BE BLOCKED for full-res main-thread editing on low-memory mobile; allow safe downscaled flows |
| 10000×10000 | 100M | 381.5 MiB | SHOULD BE BLOCKED for general editing on low-memory devices |

At 24M pixels, canvas + decoded bitmap + ImageData + copied buffer can reach several hundred MiB. At 40M pixels, ImageData plus a copied array alone are ~305 MiB, excluding canvas/decoder. Browser implementations add overhead, so these are lower-bound pixel-payload estimates, not peak RSS.

## Dynamic memory strategy

- Estimate bytes using actual planned output and an operation-specific live-surface multiplier, not a pixel cutoff alone.
- Start conservatively around 64–96 MiB estimated pixel surfaces on unknown/mobile devices; a desktop can allow more. Treat `navigator.deviceMemory` as a hint only, especially since Safari support is not dependable.
- Decode at target dimensions for downsize workflows only where the codec's resize behavior is confirmed.
- Keep batch processing serial; don't decode/preview every selected input.
- Close ImageBitmap in finally and release canvas backing stores after encoding where feasible.
- Validate signature, finite dimensions and dimension product before expensive decode/allocation.
- For oversized main-thread editing, offer downscaled processing or block with an explanation; don't silently alter an exact crop.
- Warn or limit Data URLs for large files.

## Files changed on audit branch

- `src/workers/imageCompressionWorker.ts`: resize-aware output dimension validation.
- `src/engine/image/imageDimensionValidation.ts`: shared pure output-dimension contract helper.
- `tests/image-dimension-validation.spec.ts`: regression cases for 4000×3000 → 2000×1500 contract, no-resize, incomplete and invalid dimensions.
- `docs/image-tools-low-ram-audit.md`: this report.

## Test status

| Check | Status |
|---|---|
| Static source review at baseline | Complete |
| Targeted regression assertions authored | Yes; not executed |
| TypeScript | Not run |
| ESLint | Not run |
| Unit tests | Not run |
| Playwright (Chromium/Firefox/WebKit/mobile) | Not run |
| Production build / SIP asset preparation | Not run |
| Real SIP output dimensions | Not run |

The available GitHub source connector cannot run the repository locally, so none of these checks may be marked passed. The new dimension test is a pure Playwright test and should run via the project's Playwright setup.

## Production readiness estimate

**58/100 — static-review estimate only.** Positives: worker JPEG path, worker termination on cancellation, ImageBitmap cleanup in many engines, dimension validators and sequential compression batch. The resize-contract bug and lack of executed CI/device testing keep confidence low until runtime validation is done.
