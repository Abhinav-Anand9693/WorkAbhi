import type { Tool, ToolFAQ } from "@/types/tool";

export interface ToolSEOContent {
  overview: string;
  features: string[];
  useCases: string[];
  tips: string[];
  howToUse: string[];
  faq: ToolFAQ[];
}

const categoryLabels: Record<Tool["category"], string> = {
  calculator: "calculation",
  image: "image processing",
  pdf: "PDF processing",
  text: "text processing",
  developer: "developer workflow",
  qr: "QR and barcode work",
  security: "security utility",
  color: "color and design work",
  "date-time": "date and time work",
  "file-data": "file and data processing",
  audio: "audio processing",
  video: "video processing",
};

function lowerFirst(value: string): string {
  return value.length > 0 ? value[0].toLowerCase() + value.slice(1) : value;
}

function toolText(tool: Tool): string {
  return `${tool.name} ${tool.id} ${tool.description}`.toLowerCase();
}

function has(tool: Tool, ...terms: string[]): boolean {
  const text = toolText(tool);
  return terms.some((term) => text.includes(term));
}

function outputObject(tool: Tool): string {
  const name = tool.name.replace(/\s+Generator$/i, "").replace(/\s+Calculator$/i, "");
  return lowerFirst(name);
}

function operationFamily(tool: Tool):
  | "calculate"
  | "convert"
  | "format"
  | "validate"
  | "minify"
  | "compress"
  | "resize"
  | "edit"
  | "extract"
  | "merge"
  | "split"
  | "generate"
  | "inspect"
  | "encode"
  | "decode"
  | "compare"
  | "count"
  | "timer"
  | "other" {
  if (has(tool, "calculator", "calculate", "estimate", "percentage")) return "calculate";
  if (has(tool, "convert", "conversion", " to ")) return "convert";
  if (has(tool, "formatter", "format ", "format and", "formatting")) return "format";
  if (has(tool, "validator", "validate")) return "validate";
  if (has(tool, "minifier", "minify")) return "minify";
  if (has(tool, "compress", "compression")) return "compress";
  if (has(tool, "resize", "resizer")) return "resize";
  if (has(tool, "extract", "extractor")) return "extract";
  if (has(tool, "merge", "merger")) return "merge";
  if (has(tool, "split", "splitter")) return "split";
  if (has(tool, "generator", "generate", "random ")) return "generate";
  if (has(tool, "viewer", "view ", "metadata", "inspect", "scanner", "scan ", "checker", "check whether")) return "inspect";
  if (has(tool, "encoder", "encode")) return "encode";
  if (has(tool, "decoder", "decode")) return "decode";
  if (has(tool, "difference", "compare")) return "compare";
  if (has(tool, "counter", "count ", "counting")) return "count";
  if (has(tool, "timer", "stopwatch", "pomodoro")) return "timer";
  if (has(tool, "crop", "rotate", "flip", "watermark", "annotation", "drawing", "stamp", "highlight", "cleaner", "clean", "booster", "fade", "speed", "pitch", "brightness", "contrast", "saturation", "hue", "exposure", "opacity", "border", "rounded", "overlay", "sharpen", "blur", "pixelate", "grayscale", "black & white")) return "edit";
  return "other";
}

function operationSentence(tool: Tool): string {
  const family = operationFamily(tool);
  const object = outputObject(tool);

  switch (family) {
    case "calculate":
      return `Use it when you need to ${lowerFirst(tool.description.replace(/[.!?]$/, ""))}.`;
    case "convert":
      return `Use it when you need to ${lowerFirst(tool.description.replace(/[.!?]$/, ""))}.`;
    case "format":
      return `It is intended for formatting the ${object} described by the tool.`;
    case "validate":
      return `It is intended to check the syntax or structure described by the tool.`;
    case "minify":
      return `It is intended to make the supported content more compact by removing unnecessary formatting.`;
    case "compress":
      return `It is intended to reduce the size of the supported input while keeping the operation focused on the compression task.`;
    case "resize":
      return `It is intended to change the dimensions of the supported image or video according to the selected resize operation.`;
    case "extract":
      return `It is intended to take the specific content described by the tool out of the source input.`;
    case "merge":
      return `It is intended to combine the supported inputs into a single result.`;
    case "split":
      return `It is intended to divide the supported input according to the operation described by the tool.`;
    case "generate":
      return `It is intended to create ${object} from the inputs or options supported by the tool.`;
    case "inspect":
      return `It is intended to inspect the information or content described by the tool.`;
    case "encode":
      return `It is intended to encode the supported input into the representation named by the tool.`;
    case "decode":
      return `It is intended to decode the supported input into the representation named by the tool.`;
    case "compare":
      return `It is intended to compare the inputs and surface the differences relevant to the tool.`;
    case "count":
      return `It is intended to count the text unit named by the tool.`;
    case "timer":
      return `It provides the timing function described by the tool.`;
    default:
      return `It is focused on the operation described in the tool's name and description.`;
  }
}

function features(tool: Tool): string[] {
  const family = operationFamily(tool);
  const description = tool.description.replace(/[.!?]$/, "");

  const first = `${description.charAt(0).toUpperCase()}${description.slice(1)}.`;

  const secondByFamily: Record<typeof family, string> = {
    calculate: "Accepts the inputs required by the calculation and presents the resulting value for review.",
    convert: "Keeps the workflow centered on the source and target representation named by the tool.",
    format: "Presents supported structured content in a more readable form without changing the purpose of the data.",
    validate: "Checks the supported input against the syntax or structure relevant to the validator.",
    minify: "Removes unnecessary formatting from supported content so the result can be more compact.",
    compress: "Focuses the workflow on reducing the size of the supported input.",
    resize: "Focuses the workflow on changing dimensions rather than changing the underlying purpose of the media.",
    edit: "Applies the specific transformation or adjustment named by the tool.",
    extract: "Focuses on extracting the specific content named by the tool from the source.",
    merge: "Combines supported inputs into the single result described by the tool.",
    split: "Creates results based on the split operation described by the tool.",
    generate: "Creates the requested output from the inputs or options exposed by the tool.",
    inspect: "Shows information that can be derived from the supported input or operation.",
    encode: "Transforms supported input into the encoding named by the tool.",
    decode: "Transforms supported encoded input back into the representation named by the tool.",
    compare: "Focuses on identifying differences between the supported inputs.",
    count: "Reports the count requested by the tool rather than modifying the source text.",
    timer: "Provides the timing workflow described by the tool.",
    other: "Keeps the workflow focused on the operation named by the tool.",
  };

  return [
    first,
    secondByFamily[family],
    `The tool is part of WorkAbhi's ${categoryLabels[tool.category]} collection.`,
  ];
}

function buildUseCases(tool: Tool): string[] {
  const family = operationFamily(tool);
  const object = outputObject(tool);

  switch (family) {
    case "calculate":
      return [
        `Get a quick result for the ${object} inputs supported by the calculator.`,
        "Check a calculation before using the result in a larger workflow.",
        "Compare different input values when exploring a calculation.",
      ];
    case "convert":
      return [
        `Prepare content for a workflow that requires the output format named by ${tool.name}.`,
        "Create a converted copy when the original format is not suitable for the destination.",
        "Check the converted result before relying on it in another application.",
      ];
    case "format":
      return [
        "Make structured content easier to inspect during development or review.",
        "Read compact or poorly formatted input more comfortably.",
        "Prepare formatted content before sharing or debugging it.",
      ];
    case "validate":
      return [
        "Check input before sending or storing it in a workflow.",
        "Find syntax problems in manually edited structured data.",
        "Verify generated content before using it elsewhere.",
      ];
    case "minify":
      return [
        "Create a more compact representation of supported structured content.",
        "Prepare content for workflows where unnecessary whitespace is not useful.",
        "Keep a readable source version while using a compact copy when needed.",
      ];
    case "compress":
      return [
        "Reduce the size of supported media or files before sharing or uploading them.",
        "Prepare a smaller copy when a destination has a size constraint.",
        "Balance the requested size reduction with the quality requirements of the result.",
      ];
    case "resize":
      return [
        "Prepare media for a destination that requires specific dimensions.",
        "Reduce unnecessarily large dimensions before a later compression step.",
        "Create a dimension-specific copy while keeping the original available.",
      ];
    case "extract":
      return [
        `Create the specific extracted result described by ${tool.name}.`,
        "Reuse selected content without processing the entire source for an unrelated task.",
        "Check the extracted output before moving it into another workflow.",
      ];
    case "merge":
      return [
        "Combine multiple supported inputs into one result.",
        "Create a single file when a workflow expects one combined output.",
        "Review the final order or combined result before sharing it.",
      ];
    case "split":
      return [
        "Separate a supported source into smaller results.",
        "Create only the ranges or sections needed for another workflow.",
        "Use smaller outputs when handling a large source is inconvenient.",
      ];
    case "generate":
      return [
        `Create ${object} for the use case supported by the tool.`,
        "Generate a fresh result when you do not want to create it manually.",
        "Review generated output before using it in a production workflow.",
      ];
    case "inspect":
      return [
        "Inspect supported information before editing or converting the source.",
        "Check file or data properties when troubleshooting a workflow.",
        "Use the displayed information to decide what operation to perform next.",
      ];
    case "encode":
    case "decode":
      return [
        "Prepare data for a workflow that expects the selected representation.",
        "Inspect the transformed value before passing it to another system.",
        "Use the tool for reversible encoding or decoding workflows where the format supports it.",
      ];
    case "compare":
      return [
        "Compare two supported inputs during review or debugging.",
        "Identify changes between versions of content.",
        "Review differences before replacing or publishing a version.",
      ];
    case "count":
      return [
        "Measure the text quantity relevant to the tool.",
        "Check text length before meeting a content or field limit.",
        "Review counts while editing or preparing content.",
      ];
    case "timer":
      return [
        "Run the timing workflow provided by the tool.",
        "Use a visible timer while completing a focused task.",
        "Repeat the timing cycle when the workflow calls for multiple intervals.",
      ];
    default:
      return [
        `Use ${tool.name} for the operation described on this page.`,
        "Review the available inputs and options before processing.",
        "Check the result before using it in another workflow.",
      ];
  }
}

function tips(tool: Tool): string[] {
  const family = operationFamily(tool);

  const common = [
    "Use the original input when you need to retry an operation rather than repeatedly processing an already processed copy.",
    "Review the result before replacing or deleting the original input.",
  ];

  switch (family) {
    case "calculate":
      return [
        "Check units and input values before calculating.",
        "Treat estimates as dependent on the inputs and assumptions used by the calculator.",
        "For financial, tax, health, or academic decisions, verify important results against the applicable rules or source data.",
      ];
    case "convert":
      return [
        "Confirm that the destination format is suitable for the application or service that will receive the result.",
        "Keep the original input if you may need to convert it again.",
        "Inspect the converted output because different formats can represent content differently.",
      ];
    case "format":
      return [
        "Formatting improves readability; it does not by itself prove that the input is valid.",
        "Validate structured data separately when syntax correctness matters.",
        "Keep sensitive credentials out of pasted developer content whenever possible.",
      ];
    case "validate":
      return [
        "A valid syntax result does not guarantee that the data is logically correct for your application.",
        "Check the reported problem against the original input before changing it.",
        "Avoid pasting passwords, private keys, or other secrets unless the workflow specifically requires them.",
      ];
    case "minify":
      return [
        "Keep a readable source copy of important files.",
        "Minification is not encryption and does not make sensitive data secure.",
        "Validate the content before relying on a minified result.",
      ];
    case "compress":
      return [
        "Check both output size and visible or audible quality after compression.",
        "Use the original source for another compression attempt instead of repeatedly compressing the same output.",
        "If a destination has a strict size limit, verify the actual output size before uploading it.",
      ];
    case "resize":
      return [
        "Check the required dimensions before resizing.",
        "Avoid unnecessary enlargement when the destination does not require larger dimensions.",
        "Keep the original high-resolution source when future editing or quality is important.",
      ];
    case "generate":
      return [
        "Review generated output before publishing or using it in a production workflow.",
        "Use the options exposed by the tool instead of assuming unsupported output formats or settings.",
        "For credentials or security-sensitive values, prefer the site's documented security-focused generators and handle the result carefully.",
      ];
    case "inspect":
      return [
        "Metadata and inspection results depend on the information present in the input.",
        "Use inspection results as a diagnostic aid rather than assuming missing fields are errors.",
        ...common,
      ];
    case "encode":
    case "decode":
      return [
        "Confirm that the receiving system expects the same encoding or representation.",
        "Encoding is not the same as encryption.",
        "Check the transformed value before passing it to another system.",
      ];
    case "compare":
      return [
        "Compare the intended versions of the input so the reported differences are meaningful.",
        "Review surrounding context before deciding that every difference is important.",
        ...common,
      ];
    case "count":
      return [
        "Check the counting rules relevant to your destination because different systems may treat whitespace or punctuation differently.",
        "Use the result as a practical check before submitting content to a field or platform with limits.",
        ...common,
      ];
    default:
      return [
        "Review the available controls before processing so the result matches your intended operation.",
        ...common,
      ];
  }
}

function howToUse(tool: Tool): string[] {
  const family = operationFamily(tool);

  if (tool.category === "calculator" || tool.category === "date-time") {
    return [
      "Enter the values required by the tool.",
      "Review the inputs and units.",
      "Run the calculation or generator.",
      "Review the result before using it elsewhere.",
    ];
  }

  if (family === "generate" || tool.category === "qr" || tool.category === "color") {
    return [
      "Enter or select the values required by the tool.",
      "Adjust the available options.",
      "Generate the result.",
      "Review and copy or save the result.",
    ];
  }

  if (tool.category === "text" || tool.category === "developer") {
    return [
      "Enter or paste your input.",
      "Run the requested operation.",
      "Review the result for correctness.",
      "Copy or save the result as needed.",
    ];
  }

  return [
    "Select or provide the input required by the tool.",
    "Choose the available options for the operation.",
    "Process the input.",
    "Review the result before saving or downloading it.",
  ];
}

function faq(tool: Tool): ToolFAQ[] {
  const family = operationFamily(tool);

  return [
    {
      question: `What does ${tool.name} do?`,
      answer: tool.description,
    },
    {
      question: `When should I use ${tool.name}?`,
      answer: operationSentence(tool),
    },
    {
      question: `Is ${tool.name} free to use?`,
      answer: "Yes. WorkAbhi provides its listed tools without requiring a paid plan for the tool itself.",
    },
    ...(family === "validate"
      ? [
          {
            question: `Does a valid result mean the data is logically correct?`,
            answer: "No. Validation checks the syntax or structure supported by the tool; it does not establish that the data is correct for every application or business rule.",
          },
        ]
      : []),
  ];
}

export function getToolSEOContent(tool: Tool): ToolSEOContent {
  const category = categoryLabels[tool.category];
  const overview = `${tool.description} This WorkAbhi page is focused on that ${category} task and explains the intended workflow, common uses, and practical checks for the result.`;

  return {
    overview,
    features: features(tool),
    useCases: buildUseCases(tool),
    tips: tips(tool),
    howToUse: howToUse(tool),
    faq: faq(tool),
  };
}
