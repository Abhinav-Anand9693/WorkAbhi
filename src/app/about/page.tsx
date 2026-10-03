import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { categories } from "@/config/categories";

export const metadata: Metadata = {
  title: "About WorkAbhi",
  description:
    "Learn what WorkAbhi is, why it exists, how its browser-first tools work, and what the platform is building for everyday digital tasks.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About WorkAbhi",
    description:
      "Learn what WorkAbhi is, why it exists, and how its online tools are designed for practical everyday work.",
    type: "website",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <Container className="py-10 sm:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About", href: "/about" }]} />

      <header className="mt-10 max-w-4xl">
        <p className="text-sm font-semibold text-primary">About WorkAbhi</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Practical online tools for everyday digital work.
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          WorkAbhi is a collection of browser-based utilities for common tasks such as calculations, image processing, PDF work, text transformation, developer workflows, QR codes, audio, and video.
        </p>
      </header>

      <section className="mt-14 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border p-7">
          <h2 className="text-2xl font-bold">Why WorkAbhi exists</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Many small digital tasks do not need a large application. They need a focused utility that is easy to find, understandable on the first visit, and useful without unnecessary setup. WorkAbhi is built around that idea: bring practical tools together in one place while keeping each tool focused on its job.
          </p>
        </div>
        <div className="rounded-3xl border border-border p-7">
          <h2 className="text-2xl font-bold">Browser-first by design</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Many current WorkAbhi tools are implemented with browser-side processing. Where an operation can be performed locally, the application is designed to work with the user&apos;s data in the browser rather than introducing an unnecessary upload workflow. Actual processing behavior depends on the individual tool.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold">What you can use WorkAbhi for</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            The platform is organized around practical categories so you can move from a task to the relevant utility without learning a new product for every small job.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/tools/${category.id}`} className="rounded-2xl border border-border p-5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <h3 className="font-semibold">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl bg-muted p-7 sm:p-9">
        <h2 className="text-3xl font-bold">Built around useful outcomes</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <div><h3 className="font-semibold">Find the right tool</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Browse categories or search the existing tool catalog.</p></div>
          <div><h3 className="font-semibold">Do the task</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Use a focused interface instead of navigating a large application.</p></div>
          <div><h3 className="font-semibold">Keep control</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">For supported browser-side operations, processing happens locally in the browser.</p></div>
        </div>
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="text-3xl font-bold">The product vision</h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          WorkAbhi is intended to grow into a dependable workspace for small but frequent digital tasks. That means expanding useful tools carefully, improving the existing experience, publishing genuinely helpful guides, and keeping the architecture maintainable rather than adding pages or features only for volume.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/tools" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Explore all tools</Link>
          <Link href="/blog" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted">Read the guides</Link>
        </div>
      </section>
    </Container>
  );
}
