import type {
  MetadataRoute
} from "next";

import { siteConfig } from "@/config/site";
import { categories } from "@/config/categories";
import { tools } from "@/config/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const mainPages = [
    {
      url: siteConfig.url,
      priority: 1
    },

    {
      url:
        `${siteConfig.url}/tools`,
      priority: 0.9
    }
  ];

  const categoryPages =
    categories.map(
      (category) => ({
        url:
          `${siteConfig.url}/tools/${category.id}`,
        priority: 0.8
      })
    );

  const toolPages =
    tools
      .filter(
        (tool) =>
          tool.available
      )
      .map(
        (tool) => ({
          url:
            `${siteConfig.url}/tool/${tool.id}`,
          priority:
            tool.popular
              ? 0.8
              : 0.6
        })
      );

  return [
    ...mainPages,
    ...categoryPages,
    ...toolPages
  ].map((item) => ({
    ...item,
    lastModified:
      new Date(),
    changeFrequency:
      "monthly" as const
  }));
}