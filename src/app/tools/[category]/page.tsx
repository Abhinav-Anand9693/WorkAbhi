import { notFound } from "next/navigation";

import Container from "@/components/layout/Container";
import ToolGrid from "@/components/tools/ToolGrid";

import { categories } from "@/config/categories";
import {
  getToolsByCategory
} from "@/lib/toolRegistry";

export function generateStaticParams() {
  return categories.map(
    (category) => ({
      category: category.id
    })
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{
    category: string;
  }>;
}) {
  const { category } =
    await params;

  const item =
    categories.find(
      (categoryItem) =>
        categoryItem.id === category
    );

  if (!item) {
    return {};
  }

  return {
    title:
      `${item.name} | WorkAbhi`,

    description:
      item.description
  };
}

export default async function CategoryPage({
  params
}: {
  params: Promise<{
    category: string;
  }>;
}) {
  const { category } =
    await params;

  const item =
    categories.find(
      (categoryItem) =>
        categoryItem.id === category
    );

  if (!item) {
    notFound();
  }

  const categoryTools =
    getToolsByCategory(
      item.id
    );

  return (
    <Container className="py-14 sm:py-20">

      <div className="max-w-3xl">

        <p className="
          text-sm
          font-semibold
          text-primary
        ">
          {item.icon}
        </p>

        <h1 className="
          mt-2
          text-4xl
          font-bold
          tracking-tight
        ">
          {item.name}
        </h1>

        <p className="
          mt-4
          text-base
          leading-7
          text-muted-foreground
        ">
          {item.description}
        </p>

      </div>

      <div className="mt-10">
        <ToolGrid
          tools={categoryTools}
        />
      </div>

    </Container>
  );
}