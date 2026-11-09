import type { MetadataRoute } from "next";
import { getPublishedArticles, getPublishedOpportunities } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elliottask-nine.vercel.app";
  const routes = ["", "/opportunities", "/hire", "/for-talent", "/articles", "/privacy"];
  const [articles, opportunities] = await Promise.all([
    getPublishedArticles(),
    getPublishedOpportunities(),
  ]);
  return [
    ...routes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.7,
    })),
    ...articles.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...opportunities.map((opportunity) => ({
      url: `${baseUrl}/opportunities/${opportunity.slug}`,
      lastModified: opportunity.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
