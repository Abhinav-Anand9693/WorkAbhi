import type { ToolSEOContent as ToolSEOContentData } from "@/lib/toolSeo";

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-border p-4 text-sm leading-6 text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ToolSEOContent({
  content,
}: {
  content: ToolSEOContentData;
}) {
  return (
    <div>
      <section className="mt-16 max-w-4xl">
        <h2 className="text-2xl font-bold tracking-tight">About this tool</h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {content.overview}
        </p>
      </section>

      <Section title="What this tool does" items={content.features} />
      <Section title="Common use cases" items={content.useCases} />
      <Section title="Practical tips" items={content.tips} />
    </div>
  );
}
