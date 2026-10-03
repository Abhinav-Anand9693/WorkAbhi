import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/types/tool";

export default function RelatedTools({ tools }: { tools: Tool[] }) {
  if (!tools.length) return null;

  return (
    <section className="mt-16 border-t border-border/70 pt-14">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Keep exploring</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Related tools</h2>
        </div>
        <Link href="/tools" className="hidden text-sm font-semibold text-primary hover:underline sm:block">
          View all tools
        </Link>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tool/${tool.id}`}
            className="group rounded-2xl border border-border/80 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium capitalize text-muted-foreground">
                {tool.category.replace("-", " ")}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <h3 className="mt-4 font-semibold group-hover:text-primary">{tool.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
