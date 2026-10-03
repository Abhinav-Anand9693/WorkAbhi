import Link from "next/link";
import type { Tool } from "@/types/tool"; 

export default function ToolCard({
  tool
}: {
  tool: Tool;
}) {
  return (
    <Link
      href={`/tool/${tool.id}`}
      className="
        group rounded-2xl
        border border-border
        bg-card p-5
        transition
        hover:-translate-y-0.5
        hover:shadow-lg
      "
    >
      <div className="flex items-start justify-between">

        <span className="
          rounded-xl
          border border-border
          px-3 py-2
          text-xs
        ">
          {tool.icon}
        </span>

        <span className="
          text-muted-foreground
          transition
          group-hover:translate-x-1
        ">
          →
        </span>

      </div>

      <h3 className="mt-5 font-semibold">
        {tool.name}
      </h3>

      <p className="
        mt-2
        line-clamp-2
        text-sm
        leading-6
        text-muted-foreground
      ">
        {tool.description}
      </p>

      <div className="mt-5 flex items-center justify-between">

        <span className="text-xs capitalize text-muted-foreground">
          {tool.category.replace(
            "-",
            " "
          )}
        </span>

        {tool.available && (
          <span className="text-xs font-medium text-primary">
            Available
          </span>
        )}

      </div>

    </Link>
  );
}