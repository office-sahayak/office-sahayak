import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { tools } from "@/lib/tools";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://office-sahayak.onrender.com";
const staticRoutes = ["", "/articles", "/guides", "/about", "/contact", "/privacy", "/terms", "/disclaimer", "/editorial-policy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = tools.map((tool) => `/tools/${tool.category}/${tool.slug}`);
  const articleRoutes = articles.map((article) => `/articles/${article.slug}`);

  return [...staticRoutes, ...articleRoutes, ...toolRoutes].map((route, index) => ({
    url: `${siteUrl}${route}`,
    lastModified: route.startsWith("/articles/") ? new Date("2026-10-08") : undefined,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route.startsWith("/articles/") ? 0.85 : route.startsWith("/tools/") ? 0.8 : 0.5,
  }));
}
