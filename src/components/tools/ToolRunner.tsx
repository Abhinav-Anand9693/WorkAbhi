"use client";

import type { Tool } from "@/types/tool";
import CalculatorTool from "@/components/calculator/CalculatorTool";
import ImageTool from "@/components/image/ImageTool";

interface ToolRunnerProps {
  tool: Tool;
}

export default function ToolRunner({
  tool,
}: ToolRunnerProps) {
  switch (tool.type) {
    case "calculator":
      return <CalculatorTool toolId={tool.id} />;

    case "image":
      return <ImageTool toolId={tool.id} />;

    default:
      return (
        <div className="rounded-2xl border p-8 text-center">
          <h2 className="text-xl font-semibold">
            {tool.name}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            This tool is registered and will be implemented
            in the next development phase.
          </p>
        </div>
      );
  }
}