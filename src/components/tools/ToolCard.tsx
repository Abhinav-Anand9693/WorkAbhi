import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/types/tool";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tool/${tool.id}`}
      className="group relative flex min-h-[218px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_18px_45px_-24px_rgba(15,23,42,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-muted/60 text-xs font-semibold text-foreground/75 transition-colors group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
          {tool.icon}
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-5 text-[15px] font-semibold tracking-tight group-hover:text-primary">{tool.name}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{tool.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs">
        <span className="capitalize text-muted-foreground">{tool.category.replace("-", " ")}</span>
        {tool.available && <span className="font-semibold text-primary">Open tool</span>}
      </div>
    </Link>
  );
}
