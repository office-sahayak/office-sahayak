import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://office-sahayak.onrender.com";
const staticRoutes = ["", "/about", "/contact", "/privacy", "/terms", "/disclaimer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = tools.map((tool) => `/tools/${tool.category}/${tool.slug}`);

  return [...staticRoutes, ...toolRoutes].map((route, index) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route.startsWith("/tools/") ? 0.8 : 0.5,
  }));
}
