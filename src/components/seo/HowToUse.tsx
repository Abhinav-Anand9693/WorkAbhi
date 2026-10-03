import { Check } from "lucide-react";

export default function HowToUse({ steps }: { steps: string[] }) {
  return (
    <section className="mt-16 border-t border-border/70 pt-14">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workflow</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">How to use it</h2>
      </div>

      <ol className="mt-7 grid gap-3 md:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step}
            className="group flex gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-colors hover:border-primary/20 hover:bg-primary/[0.02]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1">
              <p className="text-sm leading-6">{step}</p>
              <Check aria-hidden="true" className="mt-3 h-4 w-4 text-primary/60" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
