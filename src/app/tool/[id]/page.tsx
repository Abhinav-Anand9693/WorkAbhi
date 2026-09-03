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
  return tools.map(
    (tool) => ({
      id: tool.id
    })
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const tool =
    getToolById(id);

  if (!tool) {
    return {};
  }

  return {
    title:
      tool.seo.title,

    description:
      tool.seo.description,

    keywords:
      tool.seo.keywords,

    alternates: {
      canonical:
        `/tool/${tool.id}`
    },

    openGraph: {
      title:
        tool.seo.title,

      description:
        tool.seo.description,

      type: "website"
    }
  };
}

export default async function ToolPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  const tool =
    getToolById(id);

  if (!tool) {
    notFound();
  }

  const related =
    getRelatedTools(tool);

  const breadcrumbItems = [
    {
      name: "Home",
      href: "/"
    },
    {
      name: "Tools",
      href: "/tools"
    },
    {
      name: tool.name,
      href: `/tool/${tool.id}`
    }
  ];

  return (
    <>
      <StructuredData
        tool={tool}
      />

      <Container className="py-10 sm:py-14">

        <Breadcrumbs
          items={breadcrumbItems}
        />

        <header className="mt-8 max-w-3xl">

          <h1 className="
            text-4xl
            font-bold
            tracking-tight
            sm:text-5xl
          ">
            {tool.name}
          </h1>

          <p className="
            mt-4
            text-base
            leading-7
            text-muted-foreground
          ">
            {tool.seo.intro ??
              tool.description}
          </p>

        </header>

        <div className="mt-10">
          <ToolRunner
            tool={tool}
          />
        </div>

        {tool.seo.howToUse && (
          <HowToUse
            steps={
              tool.seo.howToUse
            }
          />
        )}

        {tool.seo.faq &&
          tool.seo.faq.length > 0 && (
            <FAQ
              items={
                tool.seo.faq
              }
            />
          )}

        <RelatedTools
          tools={related}
        />

      </Container>
    </>
  );
}