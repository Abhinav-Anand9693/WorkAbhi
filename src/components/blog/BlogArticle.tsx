import Link from "next/link";
import { marked } from "marked";
import type { BlogPost } from "@/lib/blog";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedTools from "@/components/seo/RelatedTools";
import { getRelatedBlogPosts, getRelatedToolsForPost } from "@/lib/blog";
import { siteConfig } from "@/config/site";

export default function BlogArticle({ post }: { post: BlogPost }) {
  const html = marked.parse(post.content) as string;
  const relatedPosts = getRelatedBlogPosts(post);
  const relatedTools = getRelatedToolsForPost(post);

  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt,
    author: {
      "@type": "Organization",
      name: post.author,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: "WorkAbhi",
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteConfig.url}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${siteConfig.url}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />

      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Blog", href: "/blog" },
              { name: post.title, href: `/blog/${post.slug}` },
            ]}
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{post.category}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={post.publishedAt}>
              Published {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${post.publishedAt}T00:00:00Z`))}
            </time>
            {post.modifiedAt !== post.publishedAt && (
              <>
                <span aria-hidden="true">•</span>
                <time dateTime={post.modifiedAt}>
                  Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${post.modifiedAt}T00:00:00Z`))}
                </time>
              </>
            )}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Article tags">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <article
          className="workabhi-prose mt-12 border-t border-border pt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {relatedTools.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="text-2xl font-bold">Try the related WorkAbhi tools</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use the relevant browser-based tool after reading the guide.
            </p>
            <div className="mt-6">
              <RelatedTools tools={relatedTools} />
            </div>
          </section>
        )}

        {relatedPosts.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="text-2xl font-bold">Related guides</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="rounded-2xl border border-border p-5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <p className="text-xs font-semibold text-primary">{item.category}</p>
                  <h3 className="mt-2 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
