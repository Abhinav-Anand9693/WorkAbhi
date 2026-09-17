import { tools } from "@/config/tools";
import type { Tool } from "@/types/tool";

export function getToolById(
  id: string
): Tool | undefined {
  return tools.find(
    (tool) =>
      tool.id === id
  );
}

export function resolveTool(id: string) {
  return getToolById(id);
}

export function getToolsByCategory(
  category: Tool["category"]
): Tool[] {
  return tools.filter(
    (tool) =>
      tool.category === category
  );
}

export function getPopularTools(): Tool[] {
  return tools.filter(
    (tool) =>
      tool.popular
  );
}

export function getAvailableTools(): Tool[] {
  return tools.filter(
    (tool) =>
      tool.available
  );
}