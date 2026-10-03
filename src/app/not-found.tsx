import Link from "next/link";
import Container from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container
      className="
        flex
        min-h-[60vh]
        flex-col
        items-center
        justify-center
        px-4
        text-center
      "
    >
      <span className="text-sm font-semibold text-primary">
        404
      </span>

      <h1 className="mt-2 text-4xl font-bold tracking-tight">
        Page not found
      </h1>

      <p className="mt-4 max-w-md text-muted-foreground">
        That page doesn&apos;t exist, but the tool or information
        you&apos;re looking for may still be available on WorkAbhi.
      </p>

      <div
        className="
          mt-7
          flex
          flex-col
          gap-3
          sm:flex-row
        "
      >
        <Link
          href="/"
          className="
            rounded-xl
            border
            border-border
            px-5
            py-3
            text-sm
            font-semibold
            hover:bg-muted
          "
        >
          Go Home
        </Link>

        <Link
          href="/tools"
          className="
            rounded-xl
            bg-primary
            px-5
            py-3
            text-sm
            font-semibold
            text-primary-foreground
          "
        >
          Explore Tools
        </Link>
      </div>

      <div
        className="
          mt-10
          flex
          flex-wrap
          justify-center
          gap-x-6
          gap-y-3
          text-sm
          text-muted-foreground
        "
      >
        <Link
          href="/tools/image"
          className="hover:text-foreground"
        >
          Image Tools
        </Link>

        <Link
          href="/tools/pdf"
          className="hover:text-foreground"
        >
          PDF Tools
        </Link>

        <Link
          href="/tools/calculator"
          className="hover:text-foreground"
        >
          Calculators
        </Link>

        <Link
          href="/blog"
          className="hover:text-foreground"
        >
          Blog
        </Link>

        <Link
          href="/faq"
          className="hover:text-foreground"
        >
          FAQ
        </Link>
      </div>
    </Container>
  );
}