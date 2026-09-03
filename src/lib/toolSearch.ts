import { tools } from "@/config/tools";

export function searchTools(query: string) {
  const value = query.trim().toLowerCase();

  if (!value) {
    return tools;
  }

  return tools.filter((tool) => {
    return (
      tool.name.toLowerCase().includes(value) ||
      tool.description.toLowerCase().includes(value) ||
      tool.category.toLowerCase().includes(value)
    );
  });
}