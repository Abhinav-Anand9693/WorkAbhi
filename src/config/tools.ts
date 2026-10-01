import type { Tool } from "@/types/tool";

/* ==========================================
   TOOL HELPERS
========================================== */

function imageTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "image",
    description,
    icon: "Image",
    type: "image",
    engine: "image",
    available: true,
    popular,

    seo: {
      title:
        `${name} - Free Online Image Tool | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free online ${name.toLowerCase()} with browser-based image processing.`,

      keywords: [
        name.toLowerCase(),
        "free image tool",
        "online image tool",
        "image editor",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi provides a fast browser-based image tool that processes images locally whenever possible.`,

      howToUse: [
        "Upload your image.",
        "Configure the available options.",
        "Process the image.",
        "Preview the result.",
        "Download the processed image.",
      ],

      faq: [
        {
          question:
            `Is ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this image tool for free.",
        },

        {
          question:
            "Are my images uploaded to a server?",
          answer:
            "The initial version is designed for browser-side processing whenever technically possible.",
        },
      ],
    },
  };
}
function videoTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "video",
    description,
    icon: "Video",
    type: "video",
    engine: "video",
    available: true,
    popular,

    seo: {
      title:
        `${name} - Free Online Video Tool | WorkAbhi`,

      description:
        `${description} Process your video directly in your browser with WorkAbhi.`,

      keywords: [
        name.toLowerCase(),
        "video tool",
        "online video tool",
        "free video editor",
        "browser video editor",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi processes supported video operations directly in your browser.`,

      howToUse: [
        `Open the ${name}.`,
        "Select your video.",
        "Choose the required settings.",
        "Process the video.",
        "Download your result.",
      ],

      faq: [
        {
          question:
            `Is ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this tool for free.",
        },
        {
          question:
            "Are my videos uploaded to a server?",
          answer:
            "The video processing is designed to happen locally in your browser using WebAssembly.",
        },
      ],
    },
  };
}

function calculatorTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "calculator",
    description,
    icon: "Calculator",
    type: "calculator",
    engine: "calculator",
    available: true,
    popular,

    seo: {
      title:
        `${name} - Free Online Calculator | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free online ${name.toLowerCase()}.`,

      keywords: [
        name.toLowerCase(),
        "free calculator",
        "online calculator",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi provides a fast, browser-based calculator with no signup required.`,

      howToUse: [
        "Enter the required values.",
        "Review the inputs.",
        "Click Calculate.",
        "Review your result.",
      ],

      faq: [
        {
          question:
            `Is the ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this calculator for free.",
        },

        {
          question:
            `Do I need an account to use the ${name}?`,
          answer:
            "No. The calculator can be used without creating an account.",
        },
      ],
    },
  };
}

function colorTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "color",
    description,
    icon: "Palette",
    type: "color",
    engine: "color",
    available: true,
    popular,

    seo: {
      title: `${name} - Free Color & Design Tool | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free browser-based color and design tool.`,

      keywords: [
        name.toLowerCase(),
        "color tool",
        "design tool",
        "css tool",
        "free color tool",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi processes this tool directly in your browser.`,

      howToUse: [
        `Open the ${name}.`,
        "Enter or select the required values.",
        "Generate or convert the result.",
        "Copy the generated result.",
      ],

      faq: [
        {
          question: `Is ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this tool for free.",
        },
        {
          question:
            "Does this tool process my data on a server?",
          answer:
            "The tool is designed to process supported operations directly in your browser.",
        },
      ],
    },
  };
}

function developerTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "developer",
    description,
    icon: "Code2",
    type: "developer",
    engine: "developer",
    available: true,
    popular,

    seo: {
      title:
        `${name} - Free Online Developer Tool | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free browser-based ${name.toLowerCase()}.`,

      keywords: [
        name.toLowerCase(),
        "developer tools",
        "online developer tool",
        "free developer tools",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi processes supported developer tasks directly in your browser.`,

      howToUse: [
        "Open the developer tool.",
        "Enter or paste your input.",
        "Process the input.",
        "Review the result.",
        "Copy or download the result.",
      ],

      faq: [
        {
          question:
            `Is ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this developer tool for free.",
        },
        {
          question:
            "Is my data uploaded to a server?",
          answer:
            "Supported developer processing is designed to run locally in your browser.",
        },
      ],
    },
  };
  
}

function qrTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "qr",
    description,
    icon: "QrCode",
    type: "qr",
    engine: "qr",
    available: true,
    popular,

    seo: {
      title:
        `${name} - Free Online QR Code Generator | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free online ${name.toLowerCase()}.`,

      keywords: [
        name.toLowerCase(),
        "free qr code generator",
        "online qr code",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi provides a fast, browser-based QR code generator with no signup required.`,

      howToUse: [
        "Enter the text or URL for the QR code.",
        "Review the inputs.",
        "Click Generate.",
        "Download or share the generated QR code.",
      ],

      faq: [
        {
          question:
            `Is the ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this QR code generator for free.",
        },

        {
          question:
            `Do I need an account to use the ${name}?`,
          answer:
            "No. The QR code generator can be used without creating an account.",
        },
      ],
    },
  };
}

function textTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "text",
    description,
    icon: "Type",
    type: "text",
    engine: "text",
    available: true,
    popular,

    seo: {
      title:
        `${name} - Free Online Text Tool | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free browser-based text tool.`,

      keywords: [
        name.toLowerCase(),
        "text tool",
        "free text tool",
        "online text tool",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi processes your text directly in your browser.`,

      howToUse: [
        `Open the ${name}.`,
        "Enter or paste your text.",
        "Process the text.",
        "Copy the result.",
      ],

      faq: [
        {
          question: `Is ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this text tool for free.",
        },
        {
          question:
            "Is my text uploaded to a server?",
          answer:
            "This tool is designed to process text directly in your browser.",
        },
      ],
    },
  };
}

function audioTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "audio",
    description,
    icon: "Music",
    type: "audio",
    engine: "audio",
    available: true,
    popular,

    seo: {
      title:
        `${name} - Free Online Audio Tool | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free browser-based ${name.toLowerCase()} with local audio processing.`,

      keywords: [
        name.toLowerCase(),
        "free audio tool",
        "online audio tool",
        "audio converter",
        "audio editor",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi provides browser-based audio processing designed to work locally whenever technically possible.`,

      howToUse: [
        "Upload your audio file.",
        "Choose the required options.",
        "Process the audio.",
        "Preview the result.",
        "Download the processed audio.",
      ],

      faq: [
        {
          question:
            `Is ${name} free?`,

          answer:
            "Yes. WorkAbhi provides this audio tool for free.",
        },

        {
          question:
            "Do I need to create an account?",

          answer:
            "No. The tool can be used without creating an account.",
        },

        {
          question:
            "Is my audio uploaded to a server?",

          answer:
            "Supported audio processing is designed to run locally in your browser, so your file does not need to be uploaded to WorkAbhi servers.",
        },
      ],
    },
  };
}

function DataTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "file-data",
    description,
    icon: "FileText",
    type: "file-data",
    engine: "file-data",
    available: true,
    popular,

    seo: {
      title:
        `${name} - Free Online File Data Tool | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free browser-based ${name.toLowerCase()} with local file processing.`,

      keywords: [
        name.toLowerCase(),
        "free file data tool",
        "online file data tool",
        "file converter",
        "file editor",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi provides browser-based file processing designed to work locally whenever technically possible.`,

      howToUse: [
        "Upload your file.",
        "Choose the required options.",
        "Process the file.",
        "Preview the result.",
        "Download the processed file.",
      ],

      faq: [
        {
          question:
            `Is ${name} free?`,

          answer:
            "Yes. WorkAbhi provides this file data tool for free.",
        },

        {
          question:
            "Do I need to create an account?",

          answer:
            "No. The tool can be used without creating an account.",
        },

        {
          question:
            "Is my file uploaded to a server?",

          answer:
            "Supported file processing is designed to run locally in your browser, so your file does not need to be uploaded to WorkAbhi servers.",
        },
      ],
    },
  };
}

   function pdfTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "pdf",
    description,
    icon: "FileText",
    type: "pdf",
    engine: "pdf",
    available: true,
    popular,

    seo: {
      title: `${name} - Free Online PDF Tool | WorkAbhi`,

      description:
        `${description} Use WorkAbhi's free browser-based PDF tool.`,

      keywords: [
        name.toLowerCase(),
        "pdf tool",
        "free pdf tool",
        "online pdf tool",
        "pdf editor",
        "WorkAbhi",
      ],

      intro:
        `${description} WorkAbhi processes supported PDF operations directly in your browser.`,

      howToUse: [
        `Open the ${name}.`,
        "Select your PDF file.",
        "Configure the available options.",
        "Process the PDF.",
        "Preview the result when available.",
        "Download the processed PDF.",
      ],

      faq: [
        {
          question: `Is ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this PDF tool for free.",
        },
        {
          question:
            "Are my PDF files uploaded to a server?",
          answer:
            "The PDF tools are designed for browser-side processing whenever technically possible.",
        },
        {
          question:
            "Do I need an account to use this PDF tool?",
          answer:
            "No. The tool is designed to work without requiring an account.",
        },
      ],
    },
  };
}

function securityTool(
  id: string,
  name: string,
  description: string,
  popular = false
): Tool {
  return {
    id,
    name,
    category: "security",
    description,
    icon: "ShieldCheck",
    type: "security",
    engine: "security",
    available: true,
    popular,

    seo: {
      title: `${name} - Free Online Security Tool | WorkAbhi`,
      description:
        `${description} Use WorkAbhi's free browser-based security tool.`,
      keywords: [
        name.toLowerCase(),
        "security tool",
        "online security tool",
        "free security tool",
        "privacy tool",
        "WorkAbhi",
      ],
      intro:
        `${description} WorkAbhi processes supported security operations directly in your browser.`,
      howToUse: [
        `Open the ${name}.`,
        "Enter or configure the required input.",
        "Run the tool.",
        "Review the result.",
        "Copy the result when needed.",
      ],
      faq: [
        {
          question: `Is ${name} free?`,
          answer: "Yes. WorkAbhi provides this security tool for free.",
        },
        {
          question: "Is my data uploaded to a server?",
          answer:
            "The supported security and encoding operations are designed to run directly in your browser.",
        },
        {
          question: "Do I need an account?",
          answer:
            "No. These tools are designed to work without requiring an account.",
        },
      ],
    },
  };
}

function dateTimeTool(
  id: string,
  name: string,
  description: string,
  popular = false,
): Tool {
  return {
    id,
    name,
    category: "date-time",
    description,
    icon: "CalendarClock",
    type: "date-time",
    engine: "date-time",
    available: true,
    popular,

    seo: {
      title: `${name} - Free Online Date & Time Tool | WorkAbhi`,
      description: `${description} Use WorkAbhi's free browser-based date and time tool.`,
      keywords: [
        name.toLowerCase(),
        "date calculator",
        "time tool",
        "calendar tool",
        "WorkAbhi",
      ],
      intro: `${description} WorkAbhi processes this date and time task directly in your browser.`,

      howToUse: [
        `Open the ${name}.`,
        "Enter the required values.",
        "Run the calculation or generator.",
        "Review and copy the result.",
      ],

      faq: [
        {
          question: `Is ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this date and time tool for free.",
        },
        {
          question: "Is my data uploaded to a server?",
          answer:
            "Supported date and time calculations run directly in your browser.",
        },
        {
          question: "Do I need an account?",
          answer:
            "No. The tool is designed to work without an account.",
        },
      ],
    },
  };
}


/* ==========================================
   ALL WORKABHI TOOLS
========================================== */

export const tools: Tool[] = [

  /* ==========================================
     CALCULATORS
  ========================================== */

  calculatorTool(
    "emi-calculator",
    "EMI Calculator",
    "Calculate monthly EMI, total interest and total loan payment.",
    true
  ),

  calculatorTool(
    "loan-calculator",
    "Loan Calculator",
    "Estimate monthly loan payment and total repayment.",
    true
  ),

  calculatorTool(
    "home-loan-calculator",
    "Home Loan Calculator",
    "Calculate home loan EMI and total repayment."
  ),

  calculatorTool(
    "car-loan-calculator",
    "Car Loan Calculator",
    "Calculate car loan EMI and repayment."
  ),

  calculatorTool(
    "personal-loan-calculator",
    "Personal Loan Calculator",
    "Calculate personal loan EMI and interest."
  ),

  calculatorTool(
    "education-loan-calculator",
    "Education Loan Calculator",
    "Estimate education loan EMI and repayment."
  ),

  calculatorTool(
    "sip-calculator",
    "SIP Calculator",
    "Estimate SIP maturity value and investment returns.",
    true
  ),

  calculatorTool(
    "lumpsum-calculator",
    "Lumpsum Calculator",
    "Calculate future value of a lumpsum investment."
  ),

  calculatorTool(
    "swp-calculator",
    "SWP Calculator",
    "Estimate systematic withdrawal plan results."
  ),

  calculatorTool(
    "mutual-fund-return-calculator",
    "Mutual Fund Return Calculator",
    "Estimate mutual fund investment returns."
  ),

  calculatorTool(
    "fd-calculator",
    "FD Calculator",
    "Calculate fixed deposit maturity and interest."
  ),

  calculatorTool(
    "rd-calculator",
    "RD Calculator",
    "Calculate recurring deposit maturity amount."
  ),

  calculatorTool(
    "ppf-calculator",
    "PPF Calculator",
    "Estimate PPF maturity and interest."
  ),

  calculatorTool(
    "nps-calculator",
    "NPS Calculator",
    "Estimate NPS investment corpus."
  ),

  calculatorTool(
    "gst-calculator",
    "GST Calculator",
    "Calculate GST amount and total price."
  ),

  calculatorTool(
    "income-tax-calculator",
    "Income Tax Calculator",
    "Estimate income tax using a simplified slab calculation."
  ),

  calculatorTool(
    "salary-calculator",
    "Salary Calculator",
    "Estimate monthly take-home salary from annual CTC."
  ),

  calculatorTool(
    "percentage-calculator",
    "Percentage Calculator",
    "Calculate percentages quickly.",
    true
  ),

  calculatorTool(
    "percentage-increase-calculator",
    "Percentage Increase Calculator",
    "Calculate percentage increase between two values."
  ),

  calculatorTool(
    "percentage-decrease-calculator",
    "Percentage Decrease Calculator",
    "Calculate percentage decrease between two values."
  ),

  calculatorTool(
    "simple-interest-calculator",
    "Simple Interest Calculator",
    "Calculate simple interest and total amount."
  ),

  calculatorTool(
    "compound-interest-calculator",
    "Compound Interest Calculator",
    "Calculate compound interest and total amount."
  ),

  calculatorTool(
    "discount-calculator",
    "Discount Calculator",
    "Calculate discount amount and final price."
  ),

  calculatorTool(
    "profit-margin-calculator",
    "Profit Margin Calculator",
    "Calculate profit margin from cost and selling price."
  ),

  calculatorTool(
    "profit-loss-calculator",
    "Profit & Loss Calculator",
    "Calculate profit, loss and percentage."
  ),

  calculatorTool(
    "inflation-calculator",
    "Inflation Calculator",
    "Estimate future value of money after inflation."
  ),

  calculatorTool(
    "age-calculator",
    "Age Calculator",
    "Calculate exact age from date of birth."
  ),

  calculatorTool(
    "date-difference-calculator",
    "Date Difference Calculator",
    "Calculate the difference between two dates."
  ),

  calculatorTool(
    "time-duration-calculator",
    "Time Duration Calculator",
    "Calculate the duration between two times."
  ),

  calculatorTool(
    "bmi-calculator",
    "BMI Calculator",
    "Calculate body mass index from height and weight.",
    true
  ),

  calculatorTool(
    "bmr-calculator",
    "BMR Calculator",
    "Calculate basal metabolic rate."
  ),

  calculatorTool(
    "calorie-calculator",
    "Calorie Calculator",
    "Estimate daily calorie requirements."
  ),

  calculatorTool(
    "gpa-calculator",
    "GPA Calculator",
    "Calculate GPA from grade points."
  ),

  calculatorTool(
    "cgpa-calculator",
    "CGPA Calculator",
    "Calculate CGPA from semester GPAs."
  ),

  /* ==========================================
     IMAGE TOOLS — EXACT 40
  ========================================== */

  imageTool(
    "image-compressor",
    "Image Compressor",
    "Compress images while maintaining good visual quality.",
    true
  ),

  imageTool(
    "image-resizer",
    "Image Resizer",
    "Resize images to custom dimensions.",
    true
  ),

  imageTool(
    "resize-image-by-width",
    "Resize Image by Width",
    "Resize an image using a custom width."
  ),

  imageTool(
    "resize-image-by-height",
    "Resize Image by Height",
    "Resize an image using a custom height."
  ),

  imageTool(
    "resize-image-by-percentage",
    "Resize Image by Percentage",
    "Resize an image by percentage."
  ),

  imageTool(
    "compress-image-to-50kb",
    "Compress Image to 50KB",
    "Compress images to approximately 50KB."
  ),

  imageTool(
    "compress-image-to-100kb",
    "Compress Image to 100KB",
    "Compress images to approximately 100KB."
  ),

  imageTool(
    "compress-image-to-200kb",
    "Compress Image to 200KB",
    "Compress images to approximately 200KB."
  ),

  imageTool(
    "compress-image-to-500kb",
    "Compress Image to 500KB",
    "Compress images to approximately 500KB."
  ),

  imageTool(
    "compress-image-to-1mb",
    "Compress Image to 1MB",
    "Compress images to approximately 1MB."
  ),

  imageTool(
    "jpg-compressor",
    "JPG Compressor",
    "Compress JPG and JPEG images."
  ),

  imageTool(
    "png-compressor",
    "PNG Compressor",
    "Compress PNG images."
  ),

  imageTool(
    "webp-compressor",
    "WEBP Compressor",
    "Compress WEBP images."
  ),

  imageTool(
    "image-cropper",
    "Image Cropper",
    "Crop images to custom dimensions."
  ),

  imageTool(
    "circular-image-cropper",
    "Circular Image Cropper",
    "Crop images into circular shapes."
  ),

  imageTool(
    "image-rotator",
    "Image Rotator",
    "Rotate images easily."
  ),

  imageTool(
    "image-flipper",
    "Image Flipper",
    "Flip images horizontally or vertically."
  ),

  imageTool(
    "image-sharpening",
    "Image Sharpening",
    "Sharpen images."
  ),

  imageTool(
    "image-blur",
    "Image Blur",
    "Apply blur effects to images."
  ),

  imageTool(
    "pixelate-image",
    "Pixelate Image",
    "Apply a pixelated effect."
  ),

  imageTool(
    "grayscale-image",
    "Grayscale Image",
    "Convert images to grayscale."
  ),

  imageTool(
    "black-and-white-image",
    "Black & White Image",
    "Convert images to black and white."
  ),

  imageTool(
    "brightness-adjuster",
    "Brightness Adjuster",
    "Adjust image brightness."
  ),

  imageTool(
    "contrast-adjuster",
    "Contrast Adjuster",
    "Adjust image contrast."
  ),

  imageTool(
    "saturation-adjuster",
    "Saturation Adjuster",
    "Adjust image saturation."
  ),

  imageTool(
    "hue-adjuster",
    "Hue Adjuster",
    "Adjust image hue."
  ),

  imageTool(
    "exposure-adjuster",
    "Exposure Adjuster",
    "Adjust image exposure."
  ),

  imageTool(
    "opacity-adjuster",
    "Opacity Adjuster",
    "Adjust image opacity."
  ),

  imageTool(
    "image-border-generator",
    "Image Border Generator",
    "Add borders to images."
  ),

  imageTool(
    "rounded-corners",
    "Rounded Corners",
    "Create images with rounded corners."
  ),

  imageTool(
    "image-watermark",
    "Image Watermark",
    "Add watermarks to images."
  ),

  imageTool(
    "add-text-to-image",
    "Add Text to Image",
    "Add custom text over images."
  ),

  imageTool(
    "image-overlay",
    "Image Overlay",
    "Overlay one image on another."
  ),

  imageTool(
    "image-collage-maker",
    "Image Collage Maker",
    "Create collages from multiple images.",
    true
  ),

  imageTool(
    "image-splitter",
    "Image Splitter",
    "Split an image into multiple sections."
  ),

  imageTool(
    "image-merger",
    "Image Merger",
    "Merge multiple images into one image."
  ),

  imageTool(
    "image-color-picker",
    "Image Color Picker",
    "Pick colors from images."
  ),

  imageTool(
    "image-metadata-viewer",
    "Image Metadata Viewer",
    "View image metadata."
  ),

  imageTool(
    "exif-remover",
    "EXIF Remover",
    "Remove image metadata."
  ),

  imageTool(
    "image-to-data-url",
    "Image to Data URL",
    "Convert images to a Data URL."
  ),
  developerTool(
  "json-formatter",
  "JSON Formatter",
  "Format and indent JSON data for easier reading.",
  true
),

developerTool(
  "json-validator",
  "JSON Validator",
  "Validate JSON syntax and identify invalid JSON.",
  true
),

developerTool(
  "json-minifier",
  "JSON Minifier",
  "Remove unnecessary whitespace from JSON.",
),

developerTool(
  "json-beautifier",
  "JSON Beautifier",
  "Beautify JSON with readable indentation.",
),

developerTool(
  "json-to-csv",
  "JSON to CSV",
  "Convert JSON arrays of objects into CSV.",
),

developerTool(
  "csv-to-json",
  "CSV to JSON",
  "Convert CSV data into JSON objects.",
),

developerTool(
  "xml-formatter",
  "XML Formatter",
  "Format XML with readable indentation.",
),

developerTool(
  "xml-validator",
  "XML Validator",
  "Validate XML syntax directly in your browser.",
),

developerTool(
  "xml-minifier",
  "XML Minifier",
  "Minify XML by removing unnecessary whitespace.",
),

developerTool(
  "yaml-formatter",
  "YAML Formatter",
  "Format and normalize YAML documents.",
),

developerTool(
  "yaml-to-json",
  "YAML to JSON",
  "Convert YAML data into formatted JSON.",
),

developerTool(
  "json-to-yaml",
  "JSON to YAML",
  "Convert JSON data into YAML.",
),

developerTool(
  "html-formatter",
  "HTML Formatter",
  "Format HTML with readable indentation.",
),

developerTool(
  "html-minifier",
  "HTML Minifier",
  "Minify HTML by removing unnecessary whitespace.",
),

developerTool(
  "css-formatter",
  "CSS Formatter",
  "Format CSS into readable structured code.",
),

developerTool(
  "css-minifier",
  "CSS Minifier",
  "Minify CSS by removing unnecessary whitespace.",
),

developerTool(
  "javascript-formatter",
  "JavaScript Formatter",
  "Format JavaScript code with consistent styling.",
  true
),

developerTool(
  "javascript-minifier",
  "JavaScript Minifier",
  "Minify JavaScript by reducing unnecessary whitespace.",
),

developerTool(
  "sql-formatter",
  "SQL Formatter",
  "Format SQL queries for easier reading.",
  true
),

developerTool(
  "sql-minifier",
  "SQL Minifier",
  "Minify SQL queries by removing unnecessary whitespace.",
),

developerTool(
  "markdown-previewer",
  "Markdown Previewer",
  "Preview Markdown as rendered HTML.",
),

developerTool(
  "markdown-to-html",
  "Markdown to HTML",
  "Convert Markdown into HTML.",
),

developerTool(
  "html-to-markdown",
  "HTML to Markdown",
  "Convert HTML content into Markdown.",
),

developerTool(
  "url-encoder",
  "URL Encoder",
  "Encode text for safe use inside URLs.",
),

developerTool(
  "url-decoder",
  "URL Decoder",
  "Decode URL-encoded text.",
),

developerTool(
  "base64-encoder",
  "Base64 Encoder",
  "Encode text into Base64.",
),

developerTool(
  "base64-decoder",
  "Base64 Decoder",
  "Decode Base64 text.",
),

developerTool(
  "jwt-decoder",
  "JWT Decoder",
  "Decode JWT header and payload locally.",
  true
),

developerTool(
  "jwt-generator",
  "JWT Generator",
  "Generate HS256 JSON Web Tokens using a local secret.",
),

developerTool(
  "uuid-generator",
  "UUID Generator",
  "Generate a random UUID in your browser.",
  true
),

developerTool(
  "uuid-validator",
  "UUID Validator",
  "Validate UUID format.",
),

developerTool(
  "regex-tester",
  "Regex Tester",
  "Test regular expressions against text.",
  true
),

developerTool(
  "regex-generator",
  "Regex Generator",
  "Generate common regular expressions from useful patterns.",
),

developerTool(
  "timestamp-converter",
  "Timestamp Converter",
  "Convert Unix timestamps and date/time values.",
),

developerTool(
  "unix-timestamp-generator",
  "Unix Timestamp Generator",
  "Generate the current Unix timestamp.",
),

qrTool(
  "qr-code-generator",
  "QR Code Generator",
  "Generate QR codes for URLs, text, and more.",
  true
),

qrTool(
  "qr-code-scanner",
  "QR Code Scanner",
  "Scan QR codes from images and files.",
  true
),

qrTool(
  "barcode-generator",
  "Barcode Generator",
  "Generate barcodes in various formats.",
  true
),  

qrTool(
 "url-qr-generator",
  "URL QR Generator",
  "Generate QR codes for URLs.",
),
qrTool(
  "text-qr-generator",
  "Text QR Generator",
  "Generate QR codes for text.",
),
qrTool(
  "wifi-qr-generator",
  "WiFi QR Generator",  
  "Generate QR codes for WiFi credentials.",
),
qrTool("email-qr-generator",
  "Email QR Generator",
  "Generate QR codes for email addresses.",
),
qrTool("phone-qr-generator",
  "Phone QR Generator",
  "Generate QR codes for phone numbers.",
),
qrTool("sms-qr-generator",
  "SMS QR Generator",
  "Generate QR codes for SMS messages.",
),
qrTool("vcard-qr-generator",
  "vCard QR Generator",
  "Generate QR codes for vCard contact information.",
),
qrTool("location-qr-generator",
  "Location QR Generator",
  "Generate QR codes for geographic locations.",
),
qrTool("whatsapp-qr-generator",
  "WhatsApp QR Generator",
  "Generate QR codes for WhatsApp messages.",
),

qrTool("bitcoin-qr-generator",
  "Bitcoin QR Generator",
  "Generate QR codes for Bitcoin addresses.", 
),
qrTool("ethereum-qr-generator",
  "Ethereum QR Generator",
  "Generate QR codes for Ethereum addresses.",  
),
qrTool("upi-qr-generator",
  "UPI QR Generator",
  "Generate QR codes for UPI payments.",
),
qrTool("event-qr-generator",
  "Event QR Generator",
  "Generate QR codes for calendar events.",
),

qrTool("calendar-qr-generator",
  "Calendar QR Generator",
  "Generate QR codes for calendar events.",

),
qrTool("ean-13-generator",
  "EAN-13 Generator",
  "Generate EAN-13 barcodes.",
),
qrTool("code-128-generator",
  "Code 128 Generator",
  "Generate Code 128 barcodes.", 
),
qrTool("upc-generator",
  "UPC Generator",
  "Generate UPC barcodes.",
),

/* ==========================================
   COLOR & DESIGN TOOLS — 20
========================================== */

colorTool(
  "color-picker",
  "Color Picker",
  "Pick a color and get its HEX value.",
  true
),

colorTool(
  "hex-to-rgb",
  "HEX to RGB",
  "Convert HEX colors to RGB values."
),

colorTool(
  "rgb-to-hex",
  "RGB to HEX",
  "Convert RGB values to HEX colors."
),

colorTool(
  "rgb-to-hsl",
  "RGB to HSL",
  "Convert RGB colors to HSL values."
),

colorTool(
  "hsl-to-rgb",
  "HSL to RGB",
  "Convert HSL colors to RGB values."
),

colorTool(
  "hex-to-hsl",
  "HEX to HSL",
  "Convert HEX colors to HSL values."
),

colorTool(
  "hsl-to-hex",
  "HSL to HEX",
  "Convert HSL colors to HEX values."
),

colorTool(
  "rgb-to-cmyk",
  "RGB to CMYK",
  "Convert RGB colors to CMYK values."
),

colorTool(
  "cmyk-to-rgb",
  "CMYK to RGB",
  "Convert CMYK colors to RGB values."
),

colorTool(
  "css-border-radius-generator",
  "CSS Border Radius Generator",
  "Generate CSS border-radius styles visually."
),

colorTool(
  "css-gradient-generator",
  "CSS Gradient Generator",
  "Generate CSS linear gradients with a live preview."
),

colorTool(
  "gradient-generator",
  "Gradient Generator",
  "Create beautiful CSS gradients directly in your browser."
),

colorTool(
  "css-box-shadow-generator",
  "CSS Box Shadow Generator",
  "Generate CSS box-shadow code with a live preview."
),

colorTool(
  "css-button-generator",
  "CSS Button Generator",
  "Create customizable CSS buttons and copy the generated code."
),

colorTool(
  "color-palette-generator",
  "Color Palette Generator",
  "Generate a useful color palette from a base color.",
  true
),

colorTool(
  "contrast-checker",
  "Contrast Checker",
  "Check foreground and background color contrast for accessibility.",
  true
),

colorTool(
  "hex-to-cmyk",
  "HEX to CMYK",
  "Convert HEX colors to CMYK values."
),

colorTool(
  "cmyk-to-hex",
  "CMYK to HEX",
  "Convert CMYK values to HEX colors."
),

colorTool(
  "color-shades-generator",
  "Color Shades Generator",
  "Generate darker shades from a selected color."
),

colorTool(
  "color-tints-generator",
  "Color Tints Generator",
  "Generate lighter tints from a selected color."
),

/* ==========================================
   TEXT TOOLS — 30
========================================== */

textTool(
  "word-counter",
  "Word Counter",
  "Count words, characters, sentences and paragraphs in text.",
  true
),

textTool(
  "character-counter",
  "Character Counter",
  "Count characters in your text instantly.",
  true
),

textTool(
  "sentence-counter",
  "Sentence Counter",
  "Count the number of sentences in your text."
),

textTool(
  "paragraph-counter",
  "Paragraph Counter",
  "Count paragraphs in your text."
),

textTool(
  "reading-time-calculator",
  "Reading Time Calculator",
  "Estimate how long it takes to read your text.",
  true
),

textTool(
  "text-case-converter",
  "Text Case Converter",
  "Convert text between different capitalization styles."
),

textTool(
  "uppercase-converter",
  "Uppercase Converter",
  "Convert text to uppercase."
),

textTool(
  "lowercase-converter",
  "Lowercase Converter",
  "Convert text to lowercase."
),

textTool(
  "title-case-converter",
  "Title Case Converter",
  "Convert text to title case."
),

textTool(
  "sentence-case-converter",
  "Sentence Case Converter",
  "Convert text to sentence case."
),

textTool(
  "toggle-case-converter",
  "Toggle Case Converter",
  "Toggle uppercase and lowercase characters."
),

textTool(
  "remove-extra-spaces",
  "Remove Extra Spaces",
  "Remove unnecessary spaces from text."
),

textTool(
  "remove-duplicate-lines",
  "Remove Duplicate Lines",
  "Remove repeated lines from text."
),

textTool(
  "sort-lines-alphabetically",
  "Sort Lines Alphabetically",
  "Sort text lines alphabetically."
),

textTool(
  "reverse-text",
  "Reverse Text",
  "Reverse all characters in your text."
),

textTool(
  "reverse-words",
  "Reverse Words",
  "Reverse the order of words in your text."
),

textTool(
  "remove-line-breaks",
  "Remove Line Breaks",
  "Remove line breaks and combine text into paragraphs."
),

textTool(
  "add-line-breaks",
  "Add Line Breaks",
  "Add line breaks between sentences."
),

textTool(
  "text-repeater",
  "Text Repeater",
  "Repeat text multiple times.",
  true
),

textTool(
  "text-cleaner",
  "Text Cleaner",
  "Clean unwanted spaces and formatting from text."
),

textTool(
  "find-replace-text",
  "Find & Replace Text",
  "Find and replace text instantly."
),

textTool(
  "text-difference-checker",
  "Text Difference Checker",
  "Compare two text versions and find differences."
),

textTool(
  "text-length-calculator",
  "Text Length Calculator",
  "Calculate the length of text including characters, words and lines."
),

textTool(
  "lorem-ipsum-generator",
  "Lorem Ipsum Generator",
  "Generate placeholder Lorem Ipsum text.",
  true
),

textTool(
  "random-text-generator",
  "Random Text Generator",
  "Generate random text for testing and design."
),

textTool(
  "text-to-binary",
  "Text to Binary",
  "Convert text into binary representation."
),

textTool(
  "binary-to-text",
  "Binary to Text",
  "Convert binary data back into text."
),

textTool(
  "text-to-ascii",
  "Text to ASCII",
  "Convert text characters into ASCII codes."
),

textTool(
  "ascii-to-text",
  "ASCII to Text",
  "Convert ASCII codes into readable text."
),

textTool(
  "text-to-morse-code",
  "Text to Morse Code",
  "Convert text into Morse code."
),
/* ==========================================
   VIDEO TOOLS — 20
========================================== */

videoTool(
  "video-trimmer",
  "Video Trimmer",
  "Trim a video by selecting a start and end time.",
  true
),

videoTool(
  "video-cutter",
  "Video Cutter",
  "Cut a specific section from a video."
),

videoTool(
  "video-merger",
  "Video Merger",
  "Merge multiple videos into one video.",
  true
),

videoTool(
  "video-compressor",
  "Video Compressor",
  "Compress video files and reduce their file size.",
  true
),

videoTool(
  "video-resizer",
  "Video Resizer",
  "Resize videos while preserving their aspect ratio."
),

videoTool(
  "video-cropper",
  "Video Cropper",
  "Crop unwanted areas from a video."
),

videoTool(
  "video-rotator",
  "Video Rotator",
  "Rotate videos by 90, 180 or 270 degrees."
),

videoTool(
  "video-flipper",
  "Video Flipper",
  "Flip videos horizontally or vertically."
),

videoTool(
  "video-speed-changer",
  "Video Speed Changer",
  "Speed up or slow down a video."
),

videoTool(
  "video-volume-booster",
  "Video Volume Booster",
  "Increase or decrease the audio volume of a video."
),

videoTool(
  "mute-video",
  "Mute Video",
  "Remove audio from a video."
),

videoTool(
  "extract-audio-from-video",
  "Extract Audio from Video",
  "Extract the audio track from a video as an MP3 file."
),

videoTool(
  "video-to-gif",
  "Video to GIF",
  "Convert a video into an animated GIF."
),

videoTool(
  "gif-to-video",
  "GIF to Video",
  "Convert an animated GIF into an MP4 video."
),

videoTool(
  "mp4-to-webm",
  "MP4 to WebM",
  "Convert MP4 videos into WebM format."
),

videoTool(
  "webm-to-mp4",
  "WebM to MP4",
  "Convert WebM videos into MP4 format."
),

videoTool(
  "video-frame-extractor",
  "Video Frame Extractor",
  "Extract a single frame from a video."
),

videoTool(
  "video-thumbnail-generator",
  "Video Thumbnail Generator",
  "Generate a thumbnail image from a video."
),

videoTool(
  "video-metadata-viewer",
  "Video Metadata Viewer",
  "View video format, codec, dimensions, duration and other metadata."
),

videoTool(
  "video-to-images",
  "Video to Images",
  "Extract multiple frames from a video as images."
),
/* =========================================================
   AUDIO TOOLS
========================================================= */

audioTool(
  "audio-trimmer",
  "Audio Trimmer",
  "Trim an audio file by selecting a start and end time.",
  true
),

audioTool(
  "audio-cutter",
  "Audio Cutter",
  "Cut a section from an audio file quickly in your browser.",
  true
),

audioTool(
  "audio-merger",
  "Audio Merger",
  "Merge multiple audio files into one audio track.",
  true
),

audioTool(
  "audio-converter",
  "Audio Converter",
  "Convert audio files between MP3, WAV, OGG and M4A formats.",
  true
),

audioTool(
  "mp3-converter",
  "MP3 Converter",
  "Convert supported audio files to MP3 format.",
  true
),

audioTool(
  "wav-converter",
  "WAV Converter",
  "Convert supported audio files to WAV format.",
  false
),

audioTool(
  "ogg-converter",
  "OGG Converter",
  "Convert supported audio files to OGG format.",
  false
),

audioTool(
  "m4a-converter",
  "M4A Converter",
  "Convert supported audio files to M4A format.",
  false
),

audioTool(
  "mp3-to-wav",
  "MP3 to WAV",
  "Convert MP3 audio files to WAV format.",
  true
),

audioTool(
  "wav-to-mp3",
  "WAV to MP3",
  "Convert WAV audio files to compressed MP3 format.",
  true
),

audioTool(
  "mp3-to-ogg",
  "MP3 to OGG",
  "Convert MP3 audio files to OGG format.",
  false
),

audioTool(
  "ogg-to-mp3",
  "OGG to MP3",
  "Convert OGG audio files to MP3 format.",
  false
),

audioTool(
  "audio-compressor",
  "Audio Compressor",
  "Reduce audio file size by converting it to a lower bitrate.",
  true
),

audioTool(
  "audio-volume-booster",
  "Audio Volume Booster",
  "Increase the volume of an audio file.",
  true
),

audioTool(
  "audio-volume-normalizer",
  "Audio Volume Normalizer",
  "Normalize audio loudness for a more consistent listening level.",
  false
),

audioTool(
  "audio-fade-in",
  "Audio Fade In",
  "Add a smooth fade-in effect to an audio file.",
  false
),

audioTool(
  "audio-fade-out",
  "Audio Fade Out",
  "Add a smooth fade-out effect to an audio file.",
  false
),

audioTool(
  "audio-speed-changer",
  "Audio Speed Changer",
  "Change audio playback speed while preserving pitch.",
  true
),

audioTool(
  "audio-pitch-changer",
  "Audio Pitch Changer",
  "Raise or lower the pitch of an audio file.",
  false
),

audioTool(
  "audio-metadata-viewer",
  "Audio Metadata Viewer",
  "View audio format, codec, duration, bitrate, sample rate and channel information.",
  false
),

// ============================================================
// DATA TOOLS
// ============================================================

DataTool(
  "csv-viewer",
  "CSV Viewer",
  "View and analyze CSV files in your browser.",
  true
),

DataTool(
  "json-viewer",
  "JSON Viewer",
  "View and analyze JSON files in your browser.",
  true
),

DataTool(
  "xml-viewer",
  "XML Viewer",
  "View and analyze XML files in your browser.",
  true
),

DataTool(
  "yaml-viewer",
  "YAML Viewer",
  "View and analyze YAML files in your browser.",
  true
),

DataTool(
  "csv-formatter",
  "CSV Formatter",
  "Format and clean CSV data directly in your browser.",
  false
),

DataTool(
  "csv-to-json",
  "CSV to JSON",
  "Convert CSV data to JSON directly in your browser.",
  true
),

DataTool(
  "json-to-csv",
  "JSON to CSV",
  "Convert JSON data to CSV directly in your browser.",
  true
),

DataTool(
  "csv-to-tsv",
  "CSV to TSV",
  "Convert CSV data to TSV format directly in your browser.",
  false
),

DataTool(
  "tsv-to-csv",
  "TSV to CSV",
  "Convert TSV data to CSV format directly in your browser.",
  false
),

DataTool(
  "csv-column-extractor",
  "CSV Column Extractor",
  "Extract selected columns from a CSV file.",
  false
),

DataTool(
  "csv-row-filter",
  "CSV Row Filter",
  "Filter CSV rows based on column values.",
  false
),

DataTool(
  "csv-duplicate-remover",
  "CSV Duplicate Remover",
  "Remove duplicate rows from CSV files.",
  true
),

DataTool(
  "csv-sorter",
  "CSV Sorter",
  "Sort CSV rows by a selected column.",
  false
),

DataTool(
  "csv-splitter",
  "CSV Splitter",
  "Split large CSV files into smaller files by row count.",
  true
),

DataTool(
  "csv-merger",
  "CSV Merger",
  "Merge multiple CSV files into one CSV file.",
  true
),

DataTool(
  "json-to-xml",
  "JSON to XML",
  "Convert JSON data to XML format directly in your browser.",
  true
),

DataTool(
  "xml-to-json",
  "XML to JSON",
  "Convert XML data to JSON format directly in your browser.",
  true
),

DataTool(
  "json-to-yaml",
  "JSON to YAML",
  "Convert JSON data to YAML format directly in your browser.",
  false
),

DataTool(
  "yaml-to-json",
  "YAML to JSON",
  "Convert YAML data to JSON format directly in your browser.",
  false
),

DataTool(
  "txt-to-csv",
  "TXT to CSV",
  "Convert structured text data into CSV format.",
  false
),

DataTool(
  "txt-file-cleaner",
  "TXT File Cleaner",
  "Clean text files by removing empty lines and unnecessary whitespace.",
  false
),

DataTool(
  "file-hash-calculator",
  "File Hash Calculator",
  "Calculate SHA-256, SHA-384 and SHA-512 file hashes in your browser.",
  true
),

DataTool(
  "file-metadata-viewer",
  "File Metadata Viewer",
  "View basic file information such as name, type, size, extension and modified date.",
  false
),


  /* =========================================================
     PDF TOOLS
  ========================================================= */

  pdfTool(
    "merge-pdf",
    "Merge PDF",
    "Merge multiple PDF files into a single PDF.",
    true
  ),

  pdfTool(
    "split-pdf",
    "Split PDF",
    "Split a PDF into selected page ranges."
  ),

  pdfTool(
    "rotate-pdf",
    "Rotate PDF",
    "Rotate PDF pages by 90, 180 or 270 degrees."
  ),

  pdfTool(
    "delete-pdf-pages",
    "Delete PDF Pages",
    "Remove selected pages from a PDF."
  ),

  pdfTool(
    "extract-pdf-pages",
    "Extract PDF Pages",
    "Extract selected pages from a PDF into a new PDF."
  ),

  pdfTool(
    "reorder-pdf-pages",
    "Reorder PDF Pages",
    "Change the order of pages inside a PDF."
  ),

  pdfTool(
    "duplicate-pdf-pages",
    "Duplicate PDF Pages",
    "Duplicate selected PDF pages."
  ),

  pdfTool(
    "reverse-pdf-pages",
    "Reverse PDF Pages",
    "Reverse the page order of a PDF."
  ),

  pdfTool(
    "pdf-page-numbering",
    "PDF Page Numbering",
    "Add page numbers to PDF pages."
  ),

  pdfTool(
    "pdf-page-organizer",
    "PDF Page Organizer",
    "Organize and manage PDF pages."
  ),

  pdfTool(
    "pdf-viewer",
    "PDF Viewer",
    "View PDF files directly in your browser.",
    true
  ),

  pdfTool(
    "pdf-metadata-viewer",
    "PDF Metadata Viewer",
    "View PDF metadata and document information."
  ),

  pdfTool(
    "remove-pdf-metadata",
    "Remove PDF Metadata",
    "Remove metadata from a PDF document."
  ),

  pdfTool(
    "pdf-watermark",
    "PDF Watermark",
    "Add a watermark to PDF pages."
  ),

  pdfTool(
    "pdf-stamp",
    "PDF Stamp",
    "Add a visual stamp to PDF pages."
  ),

  pdfTool(
    "add-text-to-pdf",
    "Add Text to PDF",
    "Add custom text to PDF pages."
  ),

  pdfTool(
    "add-image-to-pdf",
    "Add Image to PDF",
    "Add images to PDF pages."
  ),

  pdfTool(
    "add-signature-to-pdf",
    "Add Signature to PDF",
    "Add a signature image to a PDF."
  ),

  pdfTool(
    "pdf-highlight-tool",
    "PDF Highlight Tool",
    "Highlight selected areas of PDF pages."
  ),

  pdfTool(
    "pdf-drawing-tool",
    "PDF Drawing Tool",
    "Draw directly over PDF pages."
  ),

  pdfTool(
    "pdf-annotation-tool",
    "PDF Annotation Tool",
    "Add visual annotations to PDF pages."
  ),

  pdfTool(
    "pdf-whiteout-tool",
    "PDF Whiteout Tool",
    "Cover selected PDF content with a white overlay."
  ),

  pdfTool(
    "pdf-form-filler",
    "PDF Form Filler",
    "Fill supported PDF form fields."
  ),

  pdfTool(
    "pdf-checkbox-filler",
    "PDF Checkbox Filler",
    "Fill supported PDF checkbox fields."
  ),

  pdfTool(
    "pdf-radio-button-filler",
    "PDF Radio Button Filler",
    "Fill supported PDF radio button fields."
  ),

  pdfTool(
    "pdf-flatten-tool",
    "PDF Flatten Tool",
    "Flatten supported PDF form content."
  ),

  pdfTool(
    "jpg-to-pdf",
    "JPG to PDF",
    "Convert JPG and JPEG images into PDF files.",
    true
  ),

  pdfTool(
    "png-to-pdf",
    "PNG to PDF",
    "Convert PNG images into PDF files.",
    true
  ),

  pdfTool(
    "webp-to-pdf",
    "WEBP to PDF",
    "Convert WEBP images into PDF files."
  ),

  pdfTool(
    "bmp-to-pdf",
    "BMP to PDF",
    "Convert BMP images into PDF files."
  ),

  pdfTool(
    "tiff-to-pdf",
    "TIFF to PDF",
    "Convert supported TIFF images into PDF files."
  ),

  pdfTool(
    "images-to-pdf",
    "Images to PDF",
    "Convert multiple images into a single PDF.",
    true
  ),

  pdfTool(
    "text-to-pdf",
    "Text to PDF",
    "Convert text content into a PDF document."
  ),

  pdfTool(
    "pdf-to-jpg",
    "PDF to JPG",
    "Convert PDF pages into JPG images.",
    true
  ),

  pdfTool(
    "pdf-to-png",
    "PDF to PNG",
    "Convert PDF pages into PNG images.",
    true
  ),

  pdfTool(
    "pdf-to-webp",
    "PDF to WEBP",
    "Convert PDF pages into WEBP images."
  ),

  pdfTool(
    "pdf-to-images",
    "PDF to Images",
    "Convert PDF pages into image files."
  ),

  pdfTool(
    "pdf-pages-to-images",
    "PDF Pages to Images",
    "Convert selected PDF pages into images."
  ),

  pdfTool(
    "pdf-password-generator",
    "PDF Password Generator",
    "Generate a secure password for PDF protection workflows."
  ),

  pdfTool(
    "pdf-hash-generator",
    "PDF Hash Generator",
    "Generate cryptographic hashes for PDF files."
  ),

  pdfTool(
    "pdf-file-integrity-checker",
    "PDF File Integrity Checker",
    "Check whether a PDF can be parsed successfully."
  ),

  pdfTool(
    "pdf-metadata-cleaner",
    "PDF Metadata Cleaner",
    "Clean metadata from a PDF document."
  ),

  pdfTool(
    "pdf-privacy-cleaner",
    "PDF Privacy Cleaner",
    "Remove supported document metadata and privacy-related information."
  ),

  pdfTool(
    "pdf-security-checker",
    "PDF Security Checker",
    "Inspect supported PDF security and document properties."
  ),

  /* ==========================================
   SECURITY TOOLS — 17
========================================== */

securityTool(
  "strong-password-generator",
  "Strong Password Generator",
  "Generate a strong cryptographically random password."
),

securityTool(
  "passphrase-generator",
  "Passphrase Generator",
  "Generate a random multi-word passphrase."
),

securityTool(
  "pin-generator",
  "PIN Generator",
  "Generate a cryptographically random numeric PIN."
),

securityTool(
  "username-generator",
  "Username Generator",
  "Generate a random username."
),

securityTool(
  "sha-256-hash-generator",
  "SHA-256 Hash Generator",
  "Generate a SHA-256 hash from text."
),

securityTool(
  "sha-512-hash-generator",
  "SHA-512 Hash Generator",
  "Generate a SHA-512 hash from text."
),

securityTool(
  "md5-hash-generator",
  "MD5 Hash Generator",
  "Generate an MD5 hash from text."
),

securityTool(
  "sha-1-hash-generator",
  "SHA-1 Hash Generator",
  "Generate a SHA-1 hash from text."
),

securityTool(
  "base64-encoder",
  "Base64 Encoder",
  "Encode text as Base64."
),

securityTool(
  "base64-decoder",
  "Base64 Decoder",
  "Decode Base64 text into readable text."
),

securityTool(
  "url-encoder",
  "URL Encoder",
  "Percent-encode text for use in URLs."
),

securityTool(
  "url-decoder",
  "URL Decoder",
  "Decode percent-encoded URL text."
),

securityTool(
  "html-encoder",
  "HTML Encoder",
  "Encode HTML-sensitive characters into entities."
),

securityTool(
  "html-decoder",
  "HTML Decoder",
  "Decode HTML entities into readable text."
),

securityTool(
  "rot13-encoder",
  "ROT13 Encoder",
  "Encode text using ROT13."
),

securityTool(
  "rot13-decoder",
  "ROT13 Decoder",
  "Decode ROT13 text."
),

securityTool(
  "caesar-cipher",
  "Caesar Cipher",
  "Encrypt or transform text using a configurable Caesar shift."
),

dateTimeTool(
  "leap-year-checker",
  "Leap Year Checker",
  "Check whether a year is a leap year.",
),

dateTimeTool(
  "week-number-calculator",
  "Week Number Calculator",
  "Calculate the ISO week number for a date.",
),

dateTimeTool(
  "date-difference",
  "Date Difference",
  "Calculate the difference between two dates.",
),

dateTimeTool(
  "days-until-calculator",
  "Days Until Calculator",
  "Calculate how many days remain until a selected date.",
),

dateTimeTool(
  "date-to-timestamp",
  "Date to Timestamp",
  "Convert a date to a Unix-style timestamp.",
),

dateTimeTool(
  "timestamp-to-date",
  "Timestamp to Date",
  "Convert a timestamp into a readable date.",
),

dateTimeTool(
  "random-number-generator",
  "Random Number Generator",
  "Generate a random number within a selected range.",
),

dateTimeTool(
  "random-name-generator",
  "Random Name Generator",
  "Generate a random name.",
),

dateTimeTool(
  "random-password-generator",
  "Random Password Generator",
  "Generate a random password.",
),

dateTimeTool(
  "random-choice-picker",
  "Random Choice Picker",
  "Pick one random choice from a list.",
),

dateTimeTool(
  "stopwatch",
  "Stopwatch",
  "Measure elapsed time.",
),

dateTimeTool(
  "countdown-timer",
  "Countdown Timer",
  "Run a countdown timer.",
),

dateTimeTool(
  "age-calculator",
  "Age Calculator",
  "Calculate age in years, months and days.",
),

dateTimeTool(
  "date-calculator",
  "Date Calculator",
  "Add years, months and days to a date.",
),

dateTimeTool(
  "working-days-calculator",
  "Working Days Calculator",
  "Calculate working days excluding weekends.",
),

dateTimeTool(
  "business-days-calculator",
  "Business Days Calculator",
  "Calculate business days between two dates.",
),

dateTimeTool(
  "pomodoro-timer",
  "Pomodoro Timer",
  "Run a 25-minute Pomodoro focus timer.",
),

dateTimeTool(
  "calendar-generator",
  "Calendar Generator",
  "Generate a complete calendar for a year.",
),

dateTimeTool(
  "monthly-calendar-generator",
  "Monthly Calendar Generator",
  "Generate a monthly calendar.",
),

dateTimeTool(
  "year-calendar-generator",
  "Year Calendar Generator",
  "Generate all twelve months of a year.",
),

dateTimeTool(
  "random-date-generator",
  "Random Date Generator",
  "Generate a random date between two dates.",
),

dateTimeTool(
  "unix-timestamp-converter",
  "Unix Timestamp Converter",
  "Convert Unix timestamps between seconds and readable dates.",
),

];
/* ==========================================
   TOOL LOOKUP
========================================== */

export function getToolById(
  id: string
): Tool | undefined {
  return tools.find(
    (tool) => tool.id === id
  );
}