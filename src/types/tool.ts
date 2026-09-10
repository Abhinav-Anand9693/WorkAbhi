export type ToolType =
  | "calculator"
  | "text"
  | "file"
  | "image"
  | "pdf"
  | "developer"
  | "code"
  | "generator"
  | "audio"
  | "video";

export type ToolCategory =
  | "calculator"
  | "image"
  | "pdf"
  | "text"
  | "developer"
  | "qr"
  | "security"
  | "color"
  | "date-time"
  | "file-data"
  | "audio"
  | "video";

export type CalculatorEngine =
  | "financial"
  | "investment"
  | "deposit"
  | "tax"
  | "basic"
  | "date"
  | "health"
  | "education";

export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolSEO {
  title: string;
  description: string;
  keywords?: string[];
  intro?: string;
  howToUse?: string[];
  faq?: ToolFAQ[];
}

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: string;
  type: ToolType;
  engine?: string;
  available: boolean;
  popular?: boolean;
  seo: ToolSEO;
}