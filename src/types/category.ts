import type { ToolCategory } from "./tool";

export interface Category {
  id: ToolCategory;

  name: string;

  description: string;

  icon: string;
}