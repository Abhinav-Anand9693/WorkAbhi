import { ChevronDown } from "lucide-react";
import type { ToolFAQ } from "@/types/tool";

export default function FAQ({ items }: { items: ToolFAQ[] }) {
  return (
    <section className="mt-16 border-t border-border/70 pt-14">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">FAQ</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Frequently asked questions
        </h2>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl border border-border/80 bg-card">
        {items.map((item) => (
          <details key={item.question} className="group border-b border-border/70 last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 pr-12">
              <p className="text-sm leading-7 text-muted-foreground">{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
