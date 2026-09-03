import Link from "next/link";
import Container from "@/components/layout/Container";
import { getPopularTools } from "@/lib/toolRegistry";

export default function PopularTools() {
  const tools = getPopularTools();

  return (
    <section className="py-20">

      <Container>

        <p className="
          text-sm
          font-semibold
          text-primary
        ">
          POPULAR TOOLS
        </p>

        <h2 className="
          mt-2
          text-3xl
          font-bold
          tracking-tight
        ">
          Start with something useful
        </h2>

        <div className="
          mt-10
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
                bg-card
                p-6
                transition
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >

              <span className="
                text-xs
                text-muted-foreground
              ">
                {tool.category}
              </span>

              <h3 className="
                mt-2
                font-semibold
              ">
                {tool.name}
              </h3>

              <p className="
                mt-2
                text-sm
                leading-6
                text-muted-foreground
              ">
                {tool.description}
              </p>

              <span className="
                mt-5
                inline-block
                text-sm
                font-semibold
                text-primary
              ">
                Open tool →
              </span>

            </Link>
          ))}

        </div>

      </Container>

    </section>
  );
}