import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { categories } from "@/config/categories";
import { tools } from "@/config/tools";
import { getAllBlogPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const mainPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      priority: 1,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${siteConfig.url}/tools`,
      priority: 0.9,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${siteConfig.url}/about`,
      priority: 0.6,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${siteConfig.url}/privacy`,
      priority: 0.4,
      lastModified: new Date(),
      changeFrequency: "yearly",
    },
    {
      url: `${siteConfig.url}/terms`,
      priority: 0.4,
      lastModified: new Date(),
      changeFrequency: "yearly",
    },
    {
      url: `${siteConfig.url}/contact`,
      priority: 0.5,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${siteConfig.url}/faq`,
      priority: 0.7,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      url: `${siteConfig.url}/blog`,
      priority: 0.8,
      lastModified: new Date(),
      changeFrequency: "weekly",
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map(
    (category) => ({
      url: `${siteConfig.url}/tools/${category.id}`,
      priority: 0.8,
      lastModified: new Date(),
      changeFrequency: "monthly",
    })
  );

  const toolPages: MetadataRoute.Sitemap = tools
    .filter((tool) => tool.available)
    .map((tool) => ({
      url: `${siteConfig.url}/tool/${tool.id}`,
      priority: tool.popular ? 0.8 : 0.6,
      lastModified: new Date(),
      changeFrequency: "monthly",
    }));

  const blogPages: MetadataRoute.Sitemap = getAllBlogPosts().map(
    (post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      priority: 0.7,
      lastModified: new Date(
        post.modifiedAt || post.publishedAt
      ),
      changeFrequency: "monthly",
    })
  );

  return [
    ...mainPages,
    ...categoryPages,
    ...toolPages,
    ...blogPages,
  ];
}