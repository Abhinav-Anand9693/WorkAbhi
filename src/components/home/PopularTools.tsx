import Link from "next/link";

import Container from "@/components/layout/Container";
import { getPopularTools } from "@/lib/toolRegistry";

export default function PopularTools() {
  const tools = getPopularTools();

  return (
    <section className="py-16 sm:py-20">
      <Container>
        {/* Section heading */}
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide">
            Popular Tools
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Start with something useful
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Simple tools for calculations, images, documents and everyday
            tasks.
          </p>
        </div>

        {/* 4 cards per row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.slice(0, 8).map((tool) => (
            <Link
              key={tool.id}
              href={`/tool/${tool.id}`}
              className="
                group
                rounded-2xl
                border
                border-border
                bg-background
                p-6
               transition-all
                min-h-[210px]    
              
              "
            >
              {/* Category */}
              <div className="flex items-center justify-between">
                <span
                  className="
                    rounded-xl
                    border
                    border-border
                    px-3
                    py-2
                    text-sm
                    font-medium
                  "
                >
                  {tool.category}
                </span>
              </div>

              {/* Tool name */}
              <h3
                className="
                  mt-7
                  text-lg
                  font-semibold
                  tracking-tight
                  transition-colors
                  group-hover:text-primary
                "
              >
                {tool.name}
              </h3>

              {/* Description */}
              <p
                className="
                  mt-3
                  min-h-[72px]
                  text-sm
                  leading-6
                  text-muted-foreground
                "
              >
                {tool.description}
              </p>

              {/* Open */}
              <div
                className="
                  mt-6
                  text-sm
                  font-semibold
                  transition-colors
                  group-hover:text-primary
                "
              >
                Open tool →
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}