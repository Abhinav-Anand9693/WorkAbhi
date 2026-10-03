import { getToolById } from "@/lib/toolRegistry";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  modifiedAt: string;
  author: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  content: string;
  relatedToolIds: string[];
  relatedSlugs: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "compress-image-to-100kb",
    title: "How to Resize and Compress an Image to 100KB",
    excerpt:
      "A practical guide to getting an image close to a target file size while keeping dimensions and visual quality under control.",
    publishedAt: "2026-10-03",
    modifiedAt: "2026-10-03",
    author: "WorkAbhi",
    category: "Image Tools",
    tags: ["image compression", "100KB", "image resize", "web tools"],
    seoTitle: "How to Compress an Image to 100KB | WorkAbhi",
    seoDescription:
      "Learn how to reduce an image to approximately 100KB, what affects file size, and how to balance dimensions, format, and quality.",
    relatedToolIds: ["compress-image-to-100kb", "image-resizer", "image-compressor"],
    relatedSlugs: ["image-compression-without-losing-too-much-quality", "webp-vs-jpg-for-smaller-images"],
    content: `
## Why a 100KB target can be useful

Many forms, portals, applications, and document workflows place a practical limit on image size. A target such as 100KB is therefore different from simply asking for the smallest possible file: the image still needs to remain readable and visually useful.

## What determines an image's file size?

Four factors usually matter most:

- **Dimensions:** More pixels generally require more data.
- **Format:** JPEG, PNG, and WebP use different compression approaches.
- **Image content:** Detailed photographs are harder to compress than simple graphics.
- **Compression settings:** Higher compression usually reduces size further, with a possible quality trade-off.

## A practical workflow

1. Start with the original image so you do not repeatedly recompress an already compressed copy.
2. Resize the image if its dimensions are much larger than the place where it will be used.
3. Choose a suitable output format for the image. Photographs often behave differently from screenshots or transparent graphics.
4. Compress toward the target size rather than assuming one quality setting will work for every image.
5. Preview the result at a useful zoom level before downloading it.

WorkAbhi's **Compress Image to 100KB** tool is designed around this target-size workflow. The **Image Resizer** can be useful when dimensions are the main reason the file is large.

## What if the result is not exactly 100KB?

Image compression is affected by the source image and encoder behavior, so a target-size tool may produce an approximation rather than an identical byte count for every file. If the image is still too large, reducing dimensions or using a different output format can help.

If the image becomes visibly degraded, start again from the original and make a smaller adjustment instead of repeatedly compressing the same output.

## Keep the original

Before replacing an image, keep a copy of the original. A compressed image is useful for a specific upload or web workflow, but it should not become the only copy of an important photograph or document scan.
`,
  },
  {
    slug: "image-compression-without-losing-too-much-quality",
    title: "How to Compress an Image Without Losing Too Much Quality",
    excerpt:
      "Understand the main quality-versus-size trade-offs and choose a compression workflow that fits photographs, screenshots, and graphics.",
    publishedAt: "2026-10-03",
    modifiedAt: "2026-10-03",
    author: "WorkAbhi",
    category: "Image Tools",
    tags: ["image compression", "image quality", "JPEG", "WebP"],
    seoTitle: "How to Compress Images Without Losing Too Much Quality | WorkAbhi",
    seoDescription:
      "Learn practical ways to reduce image file size while preserving useful visual quality for websites, forms, documents, and sharing.",
    relatedToolIds: ["image-compressor", "compress-image-to-100kb", "image-resizer"],
    relatedSlugs: ["compress-image-to-100kb", "webp-vs-jpg-for-smaller-images"],
    content: `
## Compression is a trade-off

Image compression is not about removing as much data as possible. The useful goal is to remove data that the final use case does not need while keeping the image clear enough for its purpose.

A profile picture, scanned document, product photo, and screenshot can all need different settings.

## Start with dimensions

If a photo is 4000 pixels wide but will only be displayed at 800 pixels wide, resizing it can produce a substantial size reduction before aggressive compression is needed. This can preserve a cleaner result than forcing a very high compression level onto an oversized image.

Use the **Image Resizer** when the physical dimensions are the main issue, and use the **Image Compressor** when you want to focus on file size.

## Choose a format that fits the image

Photographs often compress well with lossy formats. Graphics with large areas of flat color, sharp text, or transparency can behave differently. There is no single format that is ideal for every source image.

When comparing outputs, check both the file size and the visual result. A smaller file is not automatically a better result if text becomes difficult to read or important details disappear.

## Avoid repeated recompression

Keep your original file and create delivery copies from it. Repeatedly opening and saving an already compressed image can introduce additional quality loss, depending on the format and settings.

## A simple checklist

- Resize oversized images first when appropriate.
- Use a format suited to the image content.
- Compress from the original whenever possible.
- Preview important details before downloading.
- Keep an original copy for future edits.
`,
  },
  {
    slug: "webp-vs-jpg-for-smaller-images",
    title: "WebP vs JPG: Which Image Format Should You Use?",
    excerpt:
      "A practical comparison of WebP and JPG for common web and image workflows, including quality, compatibility, and file size considerations.",
    publishedAt: "2026-10-03",
    modifiedAt: "2026-10-03",
    author: "WorkAbhi",
    category: "Image Tools",
    tags: ["WebP", "JPG", "image formats", "web performance"],
    seoTitle: "WebP vs JPG: Image Format Guide | WorkAbhi",
    seoDescription:
      "Compare WebP and JPG for image compression, web use, compatibility, and quality so you can choose a suitable format for your workflow.",
    relatedToolIds: ["image-compressor", "jpg-compressor", "webp-compressor"],
    relatedSlugs: ["compress-image-to-100kb", "image-compression-without-losing-too-much-quality"],
    content: `
## The short version

JPG and WebP are both useful for reducing the size of photographic images. The right choice depends on the image, the destination, and the compatibility requirements of the workflow.

## JPG

JPG has been used widely for photographs for many years. Its broad compatibility makes it a practical choice when you need an image format that works across older and newer systems.

Its compression is lossy, so aggressive settings can introduce visible artifacts. Keeping a high-quality original and generating a delivery copy is a sensible workflow.

## WebP

WebP is a modern image format designed to provide efficient compression for web images. It can be useful when the target environment supports it and when reducing transfer size matters.

WebP also supports transparency, which makes it relevant to some graphics that would not be a good fit for a traditional JPG output.

## Which should you choose?

Use the format that matches the destination. For a website you control, WebP may be a useful delivery format. For a form, application, or workflow that explicitly requests JPG/JPEG, use JPG.

The **JPG Compressor** and **WebP Compressor** in WorkAbhi can help you prepare files for those workflows. Always check the requirements of the service receiving the image.

## The important part is the result

Do not select a format based only on the extension. Compare the final file size, visual quality, transparency requirements, and compatibility with the destination.
`,
  },
  {
    slug: "reduce-pdf-size-without-changing-content",
    title: "How to Reduce a PDF's Size Before Sharing It",
    excerpt:
      "A practical checklist for making large PDF workflows easier to manage without changing the document more than necessary.",
    publishedAt: "2026-10-03",
    modifiedAt: "2026-10-03",
    author: "WorkAbhi",
    category: "PDF Tools",
    tags: ["PDF", "PDF workflow", "file size", "document tools"],
    seoTitle: "How to Reduce a PDF File Size | WorkAbhi",
    seoDescription:
      "Learn practical ways to manage large PDF files, including image-heavy documents, page removal, conversion, and metadata cleanup.",
    relatedToolIds: ["pdf-metadata-viewer", "remove-pdf-metadata", "pdf-to-jpg"],
    relatedSlugs: ["convert-images-to-pdf", "clean-pdf-metadata"],
    content: `
## Start by finding out what makes the PDF large

A PDF can become large because of high-resolution images, embedded resources, many pages, or document metadata. The best workflow depends on the source rather than applying the same operation to every PDF.

## Remove pages you do not need

If a document contains unnecessary pages, removing them is usually more direct than changing the whole document. WorkAbhi provides **Delete PDF Pages**, **Extract PDF Pages**, and **Split PDF** for page-level workflows.

## Check metadata

Metadata is usually small compared with large embedded images, but it can still be useful to inspect and clean document information when sharing a file. WorkAbhi includes **PDF Metadata Viewer** and **Remove PDF Metadata** for these tasks.

## Be careful with conversion workflows

Converting a PDF to images and rebuilding it can change text behavior, selectable content, document structure, or visual quality. Use conversion when you actually need images, rather than treating it as a universal compression method.

## Keep a source copy

Before changing an important PDF, keep the original. This is especially important for forms, reports, signed documents, and records that may need to be reproduced later.

A useful PDF workflow is therefore: inspect the document, remove what is genuinely unnecessary, clean metadata when appropriate, and verify the output before sharing it.
`,
  },
  {
    slug: "convert-mp4-to-webm-in-browser",
    title: "How to Convert MP4 to WebM in Your Browser",
    excerpt:
      "Understand when WebM is useful, what browser video conversion involves, and how to check the converted file before using it.",
    publishedAt: "2026-10-03",
    modifiedAt: "2026-10-03",
    author: "WorkAbhi",
    category: "Video Tools",
    tags: ["MP4", "WebM", "video conversion", "browser tools"],
    seoTitle: "How to Convert MP4 to WebM Online in Your Browser | WorkAbhi",
    seoDescription:
      "Learn how MP4 to WebM conversion works, when WebM is useful, and what to check after converting a video in your browser.",
    relatedToolIds: ["mp4-to-webm", "webm-to-mp4", "video-compressor"],
    relatedSlugs: ["extract-audio-from-a-video", "compress-a-video-before-sharing"],
    content: `
## Why convert MP4 to WebM?

MP4 and WebM are different media containers and can be useful in different delivery environments. WebM is commonly associated with modern web video workflows, while MP4 remains widely supported across devices and applications.

## Before converting

Check the destination first. If a platform explicitly requests MP4, converting to WebM will not solve the compatibility requirement. If the destination accepts WebM, conversion may be useful for a web-oriented workflow.

## A practical browser workflow

1. Open the **MP4 to WebM** tool.
2. Select the source MP4 file.
3. Choose the available conversion options supported by the tool and browser.
4. Process the video.
5. Preview or inspect the resulting file.
6. Download it only after confirming the output is suitable for the destination.

Video conversion can require substantial CPU and memory, particularly for long or high-resolution files. Browser and device capabilities can also affect processing time.

## Check the output

Verify that the converted file plays correctly and that its duration, dimensions, audio, and visual quality meet the requirements of the destination. Keep the original MP4 until you have confirmed the WebM version works.
`,
  },
  {
    slug: "format-json-online-safely",
    title: "How to Format JSON Online and Check It Before Using It",
    excerpt:
      "A practical workflow for making JSON readable, spotting syntax problems, and avoiding accidental changes to the data structure.",
    publishedAt: "2026-10-03",
    modifiedAt: "2026-10-03",
    author: "WorkAbhi",
    category: "Developer Tools",
    tags: ["JSON", "developer tools", "formatting", "data"],
    seoTitle: "How to Format JSON Online | WorkAbhi",
    seoDescription:
      "Learn how to format JSON, spot common syntax mistakes, and verify the result before copying formatted data into your application.",
    relatedToolIds: ["json-formatter", "json-validator", "json-minifier"],
    relatedSlugs: ["format-json-online-safely"],
    content: `
## Why format JSON?

Minified JSON is useful for transmission, but it is difficult to inspect manually. Formatting adds indentation and line breaks so nested objects and arrays are easier to understand.

## Common JSON mistakes

Typical syntax problems include:

- Missing or extra commas.
- Unquoted property names.
- Single quotes where JSON requires double quotes for strings.
- Unclosed objects or arrays.
- Trailing commas.

Formatting cannot make invalid JSON valid by guessing what you meant. A validator is useful when you need an explicit syntax check.

## A simple workflow

1. Copy the JSON from the source.
2. Open WorkAbhi's **JSON Formatter**.
3. Paste the data.
4. Format it and inspect the structure.
5. If the input is invalid, use the validation result to locate the syntax problem.
6. Copy the corrected or formatted JSON only after checking the content.

## Be careful with sensitive data

Before pasting data into any online utility, understand how that particular tool processes it. WorkAbhi's developer tools are designed for supported processing in the browser, but users should still avoid sharing secrets such as API keys or passwords unnecessarily.

Formatting changes whitespace and presentation; it should not be treated as a substitute for reviewing the actual values in your data.
`,
  },
  {
    slug: "extract-audio-from-a-video",
    title: "How to Extract Audio from a Video",
    excerpt:
      "Learn when extracting audio is useful and how to check the resulting audio file before sharing or editing it.",
    publishedAt: "2026-10-03",
    modifiedAt: "2026-10-03",
    author: "WorkAbhi",
    category: "Audio & Video",
    tags: ["audio extraction", "video", "MP3", "media tools"],
    seoTitle: "How to Extract Audio from a Video | WorkAbhi",
    seoDescription:
      "Learn how to extract an audio track from a video, what can affect processing time, and how to verify the resulting audio file.",
    relatedToolIds: ["extract-audio-from-video", "video-trimmer", "video-compressor"],
    relatedSlugs: ["convert-mp4-to-webm-in-browser"],
    content: `
## When audio extraction is useful

You may have a video containing a lecture, interview, voice recording, music performance, or other audio that you want to edit or reuse separately. Extracting the audio creates a separate audio file from the video's audio track.

## What the process does

Extraction separates an existing audio track from the video workflow. It is different from recording audio again or converting speech to text. If the source video has no audio track, there is nothing to extract.

## A practical workflow

1. Open **Extract Audio from Video**.
2. Select the video file.
3. Let the browser inspect the media and process the available audio track.
4. Review the output when processing finishes.
5. Download the extracted audio after confirming it plays correctly.

Large or high-resolution videos can take time to process because media work can be CPU- and memory-intensive in a browser.

## Keep the source video

Keep the original until you have verified the extracted file. This makes it easy to repeat the operation if you need a different output or discover that the source contained multiple audio characteristics that matter to your workflow.
`,
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogCategories() {
  return [...new Set(blogPosts.map((post) => post.category))];
}

export function getRelatedBlogPosts(post: BlogPost) {
  const explicit = post.relatedSlugs
    .map((slug) => getBlogPost(slug))
    .filter((item): item is BlogPost => Boolean(item));

  if (explicit.length >= 3) return explicit.slice(0, 3);

  const fallback = blogPosts.filter(
    (candidate) =>
      candidate.slug !== post.slug && candidate.category === post.category
  );

  return [...explicit, ...fallback].filter(
    (item, index, array) => array.findIndex((candidate) => candidate.slug === item.slug) === index
  ).slice(0, 3);
}

export function getRelatedToolsForPost(post: BlogPost) {
  return post.relatedToolIds
    .map((id) => getToolById(id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
}

export function getAllBlogPosts() {
  return blogPosts;
}