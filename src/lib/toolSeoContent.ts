import type { ToolSEOContent } from "@/lib/toolSeo";

/**
 * High-intent, tool-specific SEO content.
 *
 * This layer intentionally contains useful task-focused copy instead of
 * keyword stuffing. Existing tool.seo fields can still override these values.
 */
export const curatedToolSEO: Record<string, Partial<ToolSEOContent>> = {
  "image-compressor": {
    overview:
      "An image compressor reduces the amount of data stored in an image so the resulting file is easier to upload, share, store, or use on a website. The practical goal is to balance file size with visual quality rather than simply applying the strongest possible compression.",
    features: [
      "Reduce image file size before uploading or sharing.",
      "Work with common image-compression workflows directly in the browser.",
      "Preview the processed result before saving it when preview support is available.",
      "Keep the original image separate from the compressed copy.",
    ],
    useCases: [
      "Reduce images before uploading them to websites or forms.",
      "Prepare photographs for faster sharing or storage.",
      "Create smaller copies of large images for web workflows.",
      "Reduce file size when an upload service has a size restriction.",
    ],
    tips: [
      "Start from the original image instead of repeatedly compressing an already compressed copy.",
      "If an image is much larger than its intended display size, resizing it first can reduce the amount of compression required.",
      "Inspect important images after compression because aggressive compression can introduce visible artifacts.",
    ],
  },

  "compress-image-to-100kb": {
    overview:
      "Compress Image to 100KB is designed for workflows where an image needs to be reduced to approximately a 100KB target. Dimensions, image format, image content, and compression settings all affect the final file size.",
    features: [
      "Work toward an approximately 100KB image-size target.",
      "Useful for forms, portals, applications, and other workflows with image-size limits.",
      "Combine size reduction with practical image-quality checking.",
      "Use the result as a separate delivery copy while preserving the original.",
    ],
    useCases: [
      "Prepare an image for an upload field with a roughly 100KB limit.",
      "Reduce photographs before submitting them to an online application.",
      "Create smaller copies for websites or document workflows.",
      "Prepare an image when the destination specifies an approximate file-size requirement.",
    ],
    tips: [
      "Do not assume every image can reach exactly 100KB with the same settings.",
      "Large dimensions can make a target-size requirement harder to achieve without quality loss.",
      "If the output looks too degraded, return to the original and adjust dimensions or compression instead of repeatedly compressing the same file.",
    ],
  },

  "image-resizer": {
    overview:
      "An image resizer changes the pixel dimensions of an image while keeping the image content itself intact. Resizing is useful when an image is larger than the dimensions required by a website, form, document, or other destination.",
    features: [
      "Resize images to dimensions appropriate for the intended destination.",
      "Reduce unnecessarily large pixel dimensions.",
      "Create a separate resized copy while retaining the original.",
      "Use resizing as a first step before additional compression when appropriate.",
    ],
    useCases: [
      "Prepare images for websites and online forms.",
      "Reduce oversized photographs before compression.",
      "Create images with specific width and height requirements.",
      "Prepare smaller copies for sharing or digital documents.",
    ],
    tips: [
      "Check the required dimensions before resizing.",
      "Avoid enlarging a small image when the destination does not require it.",
      "Keep the original high-resolution file when image quality matters.",
    ],
  },

  "json-formatter": {
    overview:
      "JSON Formatter makes structured JSON easier to read by adding indentation and line breaks. It is useful for inspecting nested objects and arrays, debugging API responses, and reviewing configuration data.",
    features: [
      "Turn compact JSON into a more readable structure.",
      "Inspect nested objects and arrays more easily.",
      "Copy formatted JSON for development workflows.",
      "Work with JSON directly in the browser.",
    ],
    useCases: [
      "Inspect API responses during development.",
      "Read minified JSON more comfortably.",
      "Review configuration files and structured data.",
      "Prepare JSON before sharing it with another developer.",
    ],
    tips: [
      "Formatting changes presentation; it does not automatically make invalid JSON correct.",
      "Use a JSON validator when you need an explicit syntax check.",
      "Avoid pasting API keys, passwords, tokens, or other secrets unnecessarily.",
    ],
  },

  "json-validator": {
    overview:
      "JSON Validator checks whether JSON follows the required syntax so malformed objects, arrays, strings, commas, or other structural problems can be identified before the data is used by an application.",
    features: [
      "Check JSON syntax directly in the browser.",
      "Identify malformed JSON before using it in an application.",
      "Use it alongside formatting and minification workflows.",
      "Review and correct the input after validation.",
    ],
    useCases: [
      "Check API payloads before sending them.",
      "Validate configuration JSON.",
      "Find syntax problems in manually edited JSON.",
      "Verify generated JSON during development.",
    ],
    tips: [
      "Valid JSON syntax does not guarantee that the values are logically correct.",
      "Check quotation marks, commas, brackets, and braces when troubleshooting.",
      "Do not expose sensitive credentials simply to validate a document.",
    ],
  },

  "json-minifier": {
    overview:
      "JSON Minifier removes unnecessary whitespace from JSON so the resulting representation is more compact. Minification is useful when compact output matters more than human readability.",
    features: [
      "Remove unnecessary JSON whitespace.",
      "Create a compact representation of structured JSON.",
      "Use it after validating the source JSON.",
      "Copy the compact result for another development workflow.",
    ],
    useCases: [
      "Prepare JSON for compact transmission.",
      "Reduce formatting overhead in generated JSON.",
      "Create compact test payloads.",
      "Prepare JSON for systems where whitespace is unnecessary.",
    ],
    tips: [
      "Validate JSON before relying on a minified result.",
      "Keep a readable version of important JSON configuration files.",
      "Minification does not encrypt or secure JSON data.",
    ],
  },

  "merge-pdf": {
    overview:
      "Merge PDF combines multiple supported PDF files into a single document. It is useful when related pages or documents need to be delivered, archived, or shared as one file.",
    features: [
      "Combine multiple supported PDF inputs into one document.",
      "Arrange inputs using the available page controls.",
      "Keep the source files separate from the merged result.",
      "Review the final document before saving it.",
    ],
    useCases: [
      "Combine related documents into one submission.",
      "Create a single PDF for sharing or archiving.",
      "Assemble pages from separate PDF files into one deliverable.",
      "Reduce the number of PDF files in a document workflow.",
    ],
    tips: [
      "Check the input order before creating the final PDF.",
      "Use clear filenames when selecting several source documents.",
      "Keep the originals until the merged document has been checked.",
    ],
  },

  "split-pdf": {
    overview:
      "Split PDF separates selected pages or ranges from a PDF into separate output. It is useful when only part of a larger document needs to be shared, stored, or processed.",
    features: [
      "Select the page range supported by the tool.",
      "Create separate output from the original PDF.",
      "Keep the original document unchanged.",
      "Review the selected pages before saving the result.",
    ],
    useCases: [
      "Extract a smaller section from a long PDF.",
      "Share only the pages relevant to a recipient.",
      "Create separate documents from a larger PDF.",
      "Prepare selected pages for another document workflow.",
    ],
    tips: [
      "Double-check page numbers before exporting.",
      "Keep the original PDF until the split result is verified.",
      "Use clear output filenames when creating multiple sections.",
    ],
  },

  "pdf-viewer": {
    overview:
      "PDF Viewer lets you inspect supported PDF documents directly in the browser. It is useful for quickly reviewing a document before deciding whether it needs editing, conversion, or another PDF operation.",
    features: [
      "Open and inspect supported PDF files in the browser.",
      "Review document pages without changing the source file.",
      "Use the viewer as an inspection step before another workflow.",
      "Keep the original PDF available for later processing.",
    ],
    useCases: [
      "Quickly inspect a PDF before editing it.",
      "Review a generated document before sharing it.",
      "Check page content before selecting another PDF tool.",
      "Inspect a document without replacing the original.",
    ],
    tips: [
      "Viewing a document is different from editing its contents.",
      "Keep important source files separately from any processed copies.",
      "Review the relevant pages before sharing a document.",
    ],
  },

  "pdf-metadata-viewer": {
    overview:
      "PDF Metadata Viewer displays metadata and document information that can be read from a supported PDF. Metadata can be useful when troubleshooting, organizing documents, or checking information before sharing a file.",
    features: [
      "Inspect readable PDF metadata in the browser.",
      "Review document information exposed by the file.",
      "Use metadata inspection during troubleshooting or organization.",
      "Keep the original PDF separate from any later processing.",
    ],
    useCases: [
      "Check PDF properties during troubleshooting.",
      "Review document information before sharing.",
      "Inspect metadata while organizing a document collection.",
      "Investigate unexpected PDF information.",
    ],
    tips: [
      "Metadata visibility depends on what information the PDF actually contains.",
      "Review metadata before sharing a document when privacy matters.",
      "Metadata inspection does not automatically remove or change metadata.",
    ],
  },

  "emi-calculator": {
    overview:
      "EMI Calculator estimates an equated monthly installment from the loan values entered into the calculator. It can help compare repayment scenarios by changing the principal, interest rate, or tenure.",
    features: [
      "Enter the loan values required by the calculator.",
      "Calculate the resulting EMI from the implemented formula.",
      "Review the result before comparing scenarios.",
      "Use different inputs to explore repayment changes.",
    ],
    useCases: [
      "Estimate a monthly loan installment.",
      "Compare different loan amounts or tenures.",
      "Check a repayment estimate before discussing a loan.",
      "Explore how interest rate changes affect an installment.",
    ],
    tips: [
      "Check the interest-rate and tenure units before calculating.",
      "Treat the result as an estimate based on the values entered.",
      "Actual lender costs can include charges that are not represented by a basic EMI calculation.",
    ],
  },

  "sip-calculator": {
    overview:
      "SIP Calculator estimates the future value of recurring investments from the values entered into the calculator. It can be used to explore how contribution amount, duration, and assumed return affect an illustration.",
    features: [
      "Enter the recurring investment values supported by the calculator.",
      "Estimate a projected value from the implemented formula.",
      "Change assumptions to compare scenarios.",
      "Review the inputs alongside the result.",
    ],
    useCases: [
      "Illustrate recurring investment growth.",
      "Compare different monthly contribution scenarios.",
      "Explore the effect of investment duration.",
      "Check a mathematical projection before planning.",
    ],
    tips: [
      "An estimated return is an assumption, not a guaranteed future result.",
      "Check the contribution frequency and duration used by the calculator.",
      "Use the output as a planning illustration rather than a promise of investment performance.",
    ],
  },

  "percentage-calculator": {
    overview:
      "Percentage Calculator handles common percentage calculations such as finding a percentage of a value or determining percentage change from the values entered.",
    features: [
      "Enter the values required for the selected percentage calculation.",
      "Calculate the result automatically.",
      "Use the result for everyday calculations, study, or work.",
      "Review inputs before relying on the output.",
    ],
    useCases: [
      "Calculate discounts and percentage changes.",
      "Check marks, scores, and proportions.",
      "Solve everyday percentage calculations.",
      "Verify a manually calculated percentage.",
    ],
    tips: [
      "Confirm which percentage relationship you are calculating before entering values.",
      "Check whether the result should be a percentage or a numeric amount.",
      "Review the input values if a result looks unexpected.",
    ],
  },

  "age-calculator": {
    overview:
      "Age Calculator calculates age from the supplied dates and presents the result using the units supported by the tool.",
    features: [
      "Enter the relevant date values.",
      "Calculate the resulting age automatically.",
      "Review the result in the units supported by the calculator.",
      "Use the result for planning, forms, or date-related tasks.",
    ],
    useCases: [
      "Calculate age from a date of birth.",
      "Check age for forms or eligibility workflows.",
      "Verify an age calculation manually.",
      "Calculate an age interval for planning.",
    ],
    tips: [
      "Check the date format and selected dates before calculating.",
      "Date-based results depend on the exact dates entered.",
      "For official eligibility decisions, use the rules and dates specified by the relevant organization.",
    ],
  },

  "qr-code-generator": {
    overview:
      "QR Code Generator creates a QR code from the information supplied to the tool. QR codes can encode URLs, text, contact information, or other supported data depending on the generator's options.",
    features: [
      "Enter the information supported by the QR workflow.",
      "Generate a QR code in the browser.",
      "Review the generated code before sharing it.",
      "Save or use the generated result through the available controls.",
    ],
    useCases: [
      "Share a website URL without manually typing it.",
      "Create a code for event or business information.",
      "Generate a QR code for supported text or contact details.",
      "Create a scannable code for printed or digital materials.",
    ],
    tips: [
      "Scan-test an important QR code before publishing or printing it.",
      "Check the encoded destination or text carefully before generating the final copy.",
      "For sensitive destinations, verify the URL independently before sharing the code.",
    ],
  },

  "video-compressor": {
    overview:
      "Video Compressor reduces the size of supported video output so it can be easier to store, share, or upload. Video compression can involve a trade-off between file size, resolution, bitrate, and visual quality.",
    features: [
      "Reduce the size of supported video files.",
      "Use the available compression settings.",
      "Review the processed result before saving it.",
      "Keep the original video separate from the compressed copy.",
    ],
    useCases: [
      "Prepare a video for an upload size restriction.",
      "Create a smaller copy for sharing.",
      "Reduce storage requirements for a video.",
      "Prepare media for a website or messaging workflow.",
    ],
    tips: [
      "Large videos can require significant processing time and memory on some devices.",
      "Check the output quality before replacing the original.",
      "If quality becomes unacceptable, start again from the original rather than repeatedly compressing the processed copy.",
    ],
  },

  "video-trimmer": {
    overview:
      "Video Trimmer removes unwanted sections from the beginning or end of supported video so you can create a shorter clip from a longer source.",
    features: [
      "Choose the portion of the video to keep using the available controls.",
      "Create a shorter video from the original.",
      "Review the result before saving it.",
      "Keep the source video unchanged.",
    ],
    useCases: [
      "Remove unwanted beginning or ending footage.",
      "Prepare a short clip for sharing.",
      "Create a focused section from a longer recording.",
      "Prepare video for another editing workflow.",
    ],
    tips: [
      "Preview the selected start and end points before saving.",
      "Keep the original video when you may need another cut later.",
      "Processing time can vary with video length, resolution, codec, and device performance.",
    ],
  },

  "mp4-to-webm": {
    overview:
      "MP4 to WebM converts supported MP4 video into WebM output for workflows where WebM is the required or preferred format. The resulting file should be checked for compatibility with its destination.",
    features: [
      "Convert supported MP4 input to WebM output.",
      "Create a separate converted copy from the source.",
      "Use the result in workflows that support WebM.",
      "Review the converted video before publishing or sharing.",
    ],
    useCases: [
      "Prepare video for a web workflow that supports WebM.",
      "Create an alternative format while keeping the MP4 source.",
      "Test browser-oriented video delivery.",
      "Prepare a video for a destination that specifically requests WebM.",
    ],
    tips: [
      "Check the destination's codec and browser compatibility requirements.",
      "Conversion can change file size and quality depending on the settings used.",
      "Keep the original MP4 until the WebM result has been verified.",
    ],
  },

  "audio-converter": {
    overview:
      "Audio Converter converts supported audio input into an available output format. It is useful when another application, device, or publishing workflow requires a different audio representation.",
    features: [
      "Convert supported audio between available formats.",
      "Create a separate converted copy.",
      "Review the output before using it elsewhere.",
      "Keep the source audio available for future conversions.",
    ],
    useCases: [
      "Prepare audio for an application that requires another format.",
      "Create a compatible copy for sharing or editing.",
      "Convert audio for a specific publishing workflow.",
      "Keep multiple supported representations of the same recording.",
    ],
    tips: [
      "Check the destination format requirement before converting.",
      "Conversion can affect file size and technical characteristics.",
      "Keep the original recording until the converted result is verified.",
    ],
  },

  "extract-audio-from-video": {
    overview:
      "Extract Audio from Video creates an audio result from supported video input. This is useful when the sound is needed separately from the visual portion of a recording.",
    features: [
      "Extract audio from supported video input.",
      "Create a separate audio result from the source.",
      "Review the output before saving or sharing it.",
      "Keep the original video unchanged.",
    ],
    useCases: [
      "Save the audio from a video recording.",
      "Prepare speech or music for an audio workflow.",
      "Create an audio-only copy for listening or editing.",
      "Reuse a video's audio in another supported workflow.",
    ],
    tips: [
      "Make sure you have the right to reuse audio from the source.",
      "Long or high-resolution videos can require more processing resources.",
      "Keep the original video until the extracted audio has been checked.",
    ],
  },
};
