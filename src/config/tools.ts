import type { Tool } from "@/types/tool";


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
      title: `${name} - Free Online Image Tool | WorkAbhi`,

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
          question: `Is ${name} free?`,
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
        "WorkAbhi"
      ],
      intro:
        `${description} WorkAbhi provides a fast, browser-based calculator with no signup required.`,
      howToUse: [
        "Enter the required values.",
        "Review the inputs.",
        "Click Calculate.",
        "Review your result."
      ],
      faq: [
        {
          question:
            `Is the ${name} free?`,
          answer:
            "Yes. WorkAbhi provides this calculator for free."
        },
        {
          question:
            `Do I need an account to use the ${name}?`,
          answer:
            "No. The calculator can be used without creating an account."
        }
      ]
    }
  };
}



export const tools: Tool[] = [

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
  )
,
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
    "compress-image-50kb",
    "Compress Image to 50KB",
    "Compress images to approximately 50KB."
  ),

  imageTool(
    "compress-image-100kb",
    "Compress Image to 100KB",
    "Compress images to approximately 100KB."
  ),

  imageTool(
    "compress-image-200kb",
    "Compress Image to 200KB",
    "Compress images to approximately 200KB."
  ),

  imageTool(
    "custom-size-image-compressor",
    "Custom Size Image Compressor",
    "Compress images to a custom target size."
  ),

  imageTool(
    "batch-image-compressor",
    "Batch Image Compressor",
    "Compress multiple images at once.",
    true
  ),

  imageTool(
    "image-quality-reducer",
    "Image Quality Reducer",
    "Reduce image quality and file size."
  ),

  imageTool(
    "image-cropper",
    "Image Cropper",
    "Crop images to custom dimensions."
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
    "image-editor",
    "Image Editor",
    "Edit images using common adjustments.",
    true
  ),

  imageTool(
    "image-background-color-changer",
    "Image Background Color Changer",
    "Change image background colors."
  ),

  imageTool(
    "image-brightness-adjuster",
    "Image Brightness Adjuster",
    "Adjust image brightness."
  ),

  imageTool(
    "image-contrast-adjuster",
    "Image Contrast Adjuster",
    "Adjust image contrast."
  ),

  imageTool(
    "image-saturation-adjuster",
    "Image Saturation Adjuster",
    "Adjust image saturation."
  ),

  imageTool(
    "image-blur-tool",
    "Image Blur Tool",
    "Apply blur effects to images."
  ),

  imageTool(
    "image-sharpen-tool",
    "Image Sharpen Tool",
    "Sharpen images."
  ),

  imageTool(
    "image-watermark",
    "Image Watermark",
    "Add watermarks to images."
  ),

  imageTool(
    "image-text-overlay",
    "Image Text Overlay",
    "Add custom text over images."
  ),

  imageTool(
    "image-border-generator",
    "Image Border Generator",
    "Add borders to images."
  ),

  imageTool(
    "image-rounded-corners",
    "Image Rounded Corners",
    "Create images with rounded corners."
  ),

  imageTool(
    "image-grayscale",
    "Image Grayscale",
    "Convert images to grayscale."
  ),

  imageTool(
    "image-sepia",
    "Image Sepia",
    "Apply a sepia effect."
  ),

  imageTool(
    "image-invert",
    "Image Invert",
    "Invert image colors."
  ),

  imageTool(
    "image-pixelate",
    "Image Pixelate",
    "Apply a pixelated effect."
  ),

  imageTool(
    "image-metadata-viewer",
    "Image Metadata Viewer",
    "View image metadata."
  ),

  imageTool(
    "remove-image-metadata",
    "Remove Image Metadata",
    "Remove image metadata."
  ),

  imageTool(
    "image-to-base64",
    "Image to Base64",
    "Convert images to Base64."
  ),

  imageTool(
    "base64-to-image",
    "Base64 to Image",
    "Convert Base64 data back to an image."
  ),

  imageTool(
    "image-color-picker",
    "Image Color Picker",
    "Pick colors from images."
  ),

  imageTool(
    "image-palette-generator",
    "Image Palette Generator",
    "Generate a color palette from an image."
  ),

  imageTool(
    "image-dimensions-checker",
    "Image Dimensions Checker",
    "Check image dimensions."
  ),

  imageTool(
    "image-dpi-calculator",
    "Image DPI Calculator",
    "Calculate image DPI."
  ),

  imageTool(
    "image-aspect-ratio-calculator",
    "Image Aspect Ratio Calculator",
    "Calculate image aspect ratios."
  ),

  imageTool(
    "passport-photo-maker",
    "Passport Photo Maker",
    "Create passport-style photos."
  ),

  imageTool(
    "signature-resizer",
    "Signature Resizer",
    "Resize signature images."
  ),

  imageTool(
    "profile-picture-maker",
    "Profile Picture Maker",
    "Create profile pictures."
  ),

  imageTool(
    "meme-generator",
    "Meme Generator",
    "Create memes using images and text.",
    true
  ),

  imageTool(
    "collage-maker",
    "Collage Maker",
    "Create collages from multiple images.",
    true
  ),

];