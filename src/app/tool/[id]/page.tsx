import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import FAQ from "@/components/seo/FAQ";
import HowToUse from "@/components/seo/HowToUse";
import RelatedTools from "@/components/seo/RelatedTools";
import StructuredData from "@/components/seo/StructuredData";
import ToolRunner from "@/components/tools/ToolRunner";
import { tools } from "@/config/tools";
import { getToolById } from "@/lib/toolRegistry";
import { getRelatedTools } from "@/lib/relatedTools";

export function generateStaticParams() {
  return tools.map((tool) => ({ id: tool.id }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = getToolById(id);

  if (!tool) return {};

  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    alternates: { canonical: `/tool/${tool.id}` },
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      type: "website"
    }
  };
}

export default async function ToolPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = getToolById(id);

  if (!tool) notFound();

  const related = getRelatedTools(tool);

  return (
    <>
      <StructuredData tool={tool} />

      <main>
        <section className="border-b border-border/70 bg-muted/20">
          <Container className="py-8 sm:py-10">
            <Breadcrumbs
              items={[
                { name: "Home", href: "/" },
                { name: "Tools", href: "/tools" },
                { name: tool.name, href: `/tool/${tool.id}` }
              ]}
            />

            <div className="mt-7 max-w-3xl">
              <span className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold capitalize text-primary">
                {tool.category.replace("-", " ")}
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-5xl">{tool.name}</h1>

              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                {tool.seo.intro ?? tool.description}
              </p>
            </div>
          </Container>
        </section>

        <Container className="py-8 sm:py-10">
          <div className="rounded-[1.5rem] border border-border/80 bg-card p-3 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] sm:p-5">
            <ToolRunner tool={tool} />
          </div>

          <div className="mt-2 text-center text-xs text-muted-foreground">
            Use the tool above to complete your task.
          </div>

          {tool.seo.howToUse && <HowToUse steps={tool.seo.howToUse} />}
          {tool.seo.faq && tool.seo.faq.length > 0 && <FAQ items={tool.seo.faq} />}
          <RelatedTools tools={related} />
        </Container>
      </main>
    </>
  );
}
