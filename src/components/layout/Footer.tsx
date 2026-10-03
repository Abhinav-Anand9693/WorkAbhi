import Link from "next/link";
import Container from "./Container";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <Container
        className="
          grid
          gap-10
          py-14
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        <div className="sm:col-span-2">
          <Link
            href="/"
            className="text-xl font-bold"
            aria-label="WorkAbhi home"
          >
            Work
            <span className="text-primary">Abhi</span>
          </Link>

          <p
            className="
              mt-4
              max-w-md
              text-sm
              leading-6
              text-muted-foreground
            "
          >
            Free online tools for everyday work,
            calculations, images, PDFs, text,
            developers and more.
          </p>

          <p
            className="
              mt-3
              max-w-md
              text-sm
              leading-6
              text-muted-foreground
            "
          >
            WorkAbhi provides practical browser-based
            utilities designed to make common digital
            tasks simpler.
          </p>
        </div>

        <div>
          <h2 className="font-semibold">Tools</h2>

          <nav
            className="
              mt-4
              space-y-3
              text-sm
              text-muted-foreground
            "
            aria-label="Tool categories"
          >
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
              Calculator Tools
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

            <Link
              href="/tools/video"
              className="block hover:text-foreground"
            >
              Video Tools
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="font-semibold">WorkAbhi</h2>

          <nav
            className="
              mt-4
              space-y-3
              text-sm
              text-muted-foreground
            "
            aria-label="WorkAbhi information"
          >
            <Link
              href="/about"
              className="block hover:text-foreground"
            >
              About WorkAbhi
            </Link>

            <Link
              href="/blog"
              className="block hover:text-foreground"
            >
              WorkAbhi Blog
            </Link>

            <Link
              href="/faq"
              className="block hover:text-foreground"
            >
              FAQ & Help
            </Link>

            <Link
              href="/contact"
              className="block hover:text-foreground"
            >
              Contact
            </Link>

            <Link
              href="/privacy"
              className="block hover:text-foreground"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="block hover:text-foreground"
            >
              Terms of Service
            </Link>
          </nav>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container
          className="
            flex
            flex-col
            gap-2
            py-5
            text-xs
            text-muted-foreground
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <span>
            © {new Date().getFullYear()} WorkAbhi.
            All rights reserved.
          </span>

          <span>
            Free online tools for everyday digital tasks.
          </span>
        </Container>
      </div>
    </footer>
  );
}