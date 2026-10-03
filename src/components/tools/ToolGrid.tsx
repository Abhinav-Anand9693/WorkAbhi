import type { Tool } from "@/types/tool";
import ToolCard from "./ToolCard";

export default function ToolGrid({ tools }: { tools: Tool[] }) {
  if (!tools.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <h3 className="font-semibold">No tools found</h3>
        <p className="mt-2 text-sm text-muted-foreground">Try another search.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
