import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import BlogCard from "@/components/blog/BlogCard";  
import { blogPosts, getBlogCategories } from "@/lib/blog";

export const metadata: Metadata = {
  title: "WorkAbHi Blog",
  description:
    "Practical guides for image compression, PDFs, video, developer utilities, file conversion, and browser-based workflows using WorkAbhi tools.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "WorkAbhi Blog", description: "Helpful guides built around real WorkAbhi tools and everyday digital tasks.", type: "website", url: "/blog" },
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;
  const categories = getBlogCategories();

  return (
    <Container className="py-10 sm:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }]} />
      <header className="mt-10 max-w-4xl">
        <p className="text-sm font-semibold text-primary">WorkAbhi Blog</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Useful guides for real online tool tasks</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Short, practical articles connected to the tools that are actually available on WorkAbhi. The goal is to help you complete a task, understand a format, or troubleshoot a workflow—not to publish pages just for volume.</p>
      </header>

      <section className="mt-10 flex flex-wrap gap-2" aria-label="Blog categories">
        {categories.map((category) => (
          <span key={category} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">{category}</span>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-border bg-muted/30 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Featured guide</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{featured.title}</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{featured.excerpt}</p>
        <Link href={`/blog/${featured.slug}`} className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Read the featured guide</Link>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Latest guides</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => <BlogCard key={post.slug} post={post} />)}
        </div>
      </section>

      <section className="mt-16 rounded-3xl bg-muted p-7 sm:p-9">
        <h2 className="text-2xl font-bold">Looking for a tool instead?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Go straight to the WorkAbhi catalog to browse calculators, image tools, PDFs, developer utilities, text tools, QR tools, audio, video, and more.</p>
        <Link href="/tools" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Explore all tools</Link>
      </section>
    </Container>
  );
}
