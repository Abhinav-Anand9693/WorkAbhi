import Link from "next/link";
import Container from "./Container";

export default function Footer() {
  return (
    <footer className="border-t border-border">

      <Container className="
        grid
        gap-10
        py-14
        md:grid-cols-4
      ">

        <div className="md:col-span-2">

          <Link
            href="/"
            className="text-xl font-bold"
          >
            Work<span className="text-primary">
              Abhi
            </span>
          </Link>

          <p className="
            mt-4
            max-w-md
            text-sm
            leading-6
            text-muted-foreground
          ">
            Free online tools for everyday work,
            calculations, images, PDFs, text,
            developers and more.
          </p>

        </div>

        <div>

          <h2 className="font-semibold">
            Tools
          </h2>

          <div className="
            mt-4
            space-y-3
            text-sm
            text-muted-foreground
          ">

            <Link
              href="/tools"
              className="block hover:text-foreground"
            >
              All Tools
            </Link>

            <Link
              href="/tools/calculator"
              className="block hover:text-foreground"
            >
              Calculators
            </Link>

            <Link
              href="/tools/image"
              className="block hover:text-foreground"
            >
              Image Tools
            </Link>

            <Link
              href="/tools/pdf"
              className="block hover:text-foreground"
            >
              PDF Tools
            </Link>

          </div>

        </div>

        <div>

          <h2 className="font-semibold">
            WorkAbhi
          </h2>

          <p className="
            mt-4
            text-sm
            leading-6
            text-muted-foreground
          ">
            Simple, fast and privacy-conscious
            browser-first utilities.
          </p>

        </div>

      </Container>

      <div className="border-t border-border">

        <Container className="
          py-5
          text-xs
          text-muted-foreground
        ">
          © {new Date().getFullYear()} WorkAbhi.
          All rights reserved.
        </Container>

      </div>

    </footer>
  );
}