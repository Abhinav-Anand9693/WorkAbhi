import Link from "next/link";
import type { Tool } from "@/types/tool";

export default function RelatedTools({
  tools
}: {
  tools: Tool[];
}) {
  if (!tools.length) {
    return null;
  }

  return (
    <section className="mt-16">

      <h2 className="
        text-2xl
        font-bold
      ">
        Related Tools
      </h2>

      <div className="
        mt-6
        grid
        gap-4
        sm:grid-cols-2
        lg:grid-cols-3
      ">

        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tool/${tool.id}`}
            className="
              rounded-2xl
              border border-border
              p-5
              transition
              hover:bg-muted
            "
          >

            <h3 className="font-semibold">
              {tool.name}
            </h3>

            <p className="
              mt-2
              text-sm
              text-muted-foreground
            ">
              {tool.description}
            </p>

          </Link>
        ))}

      </div>

    </section>
  );
}