import Container from "@/components/layout/Container";
import ToolSearch from "@/components/tools/ToolSearch";

export const metadata = {
  title: "Free Online Tools",
  description:
    "Explore WorkAbhi's free online tools."
};

export default function ToolsPage() {
  return (
    <Container className="py-14 sm:py-20">

      <div className="max-w-3xl">

        <p className="
          text-sm
          font-semibold
          text-primary
        ">
          WORKABHI TOOLS
        </p>

        <h1 className="
          mt-2
          text-4xl
          font-bold
          tracking-tight
          sm:text-5xl
        ">
          Free Online Tools
        </h1>

        <p className="
          mt-4
          text-base
          leading-7
          text-muted-foreground
        ">
          Find tools for calculations,
          images, PDFs, text, developers
          and everyday work.
        </p>

      </div>

      <div className="mt-10">
        <ToolSearch />
      </div>

    </Container>
  );
}