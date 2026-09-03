export type CalculatorFieldType =
  | "number"
  | "date"
  | "select";

export interface CalculatorOption {
  label: string;
  value: string;
}

export interface CalculatorField {
  id: string;
  label: string;
  type: CalculatorFieldType;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  options?: CalculatorOption[];
}

export interface CalculatorDefinition {
  toolId: string;
  title: string;
  description: string;
  fields: CalculatorField[];
  engine:
    | "financial"
    | "investment"
    | "deposit"
    | "tax"
    | "basic"
    | "date"
    | "health"
    | "education";
}