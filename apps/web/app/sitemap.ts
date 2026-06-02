import type { MetadataRoute } from "next";
import { TOOLS } from "@pdf-tools/core/src/tools";

const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${APP_URL}/tools`,  lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${APP_URL}/about`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${APP_URL}/contact`,lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${APP_URL}/privacy`,lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/terms`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  for (const tool of TOOLS) {
    entries.push({
      url: `${APP_URL}/${tool.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}
