import { tools } from "@/config/tools";
import type { Tool } from "@/types/tool";

export function getRelatedTools(
  currentTool: Tool,
  limit = 6
) {
  return tools
    .filter(
      (tool) =>
        tool.id !== currentTool.id &&
        tool.category === currentTool.category
    )
    .slice(0, limit);
}