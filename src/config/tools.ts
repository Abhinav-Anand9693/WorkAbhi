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