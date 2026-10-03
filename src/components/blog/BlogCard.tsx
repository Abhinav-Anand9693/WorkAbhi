import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:bg-muted/40">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
          {post.category}
        </span>
        <time dateTime={post.publishedAt}>
          {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
            new Date(`${post.publishedAt}T00:00:00Z`)
          )}
        </time>
      </div>

      <h2 className="mt-5 text-xl font-bold tracking-tight">
        <Link
          href={`/blog/${post.slug}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {post.title}
        </Link>
      </h2>

      <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
        {post.excerpt}
      </p>

      <Link
        href={`/blog/${post.slug}`}
        className="mt-6 inline-flex w-fit rounded-lg text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Read the guide →
      </Link>
    </article>
  );
}
