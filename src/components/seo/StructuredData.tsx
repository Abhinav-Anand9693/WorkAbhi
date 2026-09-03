import type { Tool } from "@/types/tool";
import { siteConfig } from "@/config/site";

export default function StructuredData({
  tool
}: {
  tool: Tool;
}) {
  const data = {
    "@context": "https://schema.org",

    "@type": "WebApplication",

    name: tool.name,

    description:
      tool.seo.description,

    applicationCategory:
      "UtilitiesApplication",

    operatingSystem:
      "Web",

    url:
      `${siteConfig.url}/tool/${tool.id}`
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html:
          JSON.stringify(data)
      }}
    />
  );
}