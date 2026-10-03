import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ToolGrid from "@/components/tools/ToolGrid";
import { categories } from "@/config/categories";
import { getToolsByCategory } from "@/lib/toolRegistry";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.id }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const item = categories.find((categoryItem) => categoryItem.id === category);

  if (!item) return {};

  return {
    title: `${item.name} | WorkAbhi`,
    description: item.description
  };
}

export default async function CategoryPage({
  params
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const item = categories.find((categoryItem) => categoryItem.id === category);

  if (!item) notFound();

  const categoryTools = getToolsByCategory(item.id);

  return (
    <main>
      <section className="border-b border-border/70 bg-muted/25">
        <Container className="py-10 sm:py-14">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Tools", href: "/tools" },
              { name: item.name, href: `/tools/${item.id}` }
            ]}
          />

          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-3 py-2 shadow-sm">
              <span className="text-xs font-semibold text-primary">{item.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {categoryTools.length} tools
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">{item.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {item.description}
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Available tools</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose a tool to get started.</p>
          </div>
          <span className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {categoryTools.length} tools
          </span>
        </div>

        <ToolGrid tools={categoryTools} />
      </Container>
    </main>
  );
}
