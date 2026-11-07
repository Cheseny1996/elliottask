import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { ArticleModel, OpportunityModel } from "@/lib/models";
import { sampleArticles, sampleOpportunities, type Article, type Opportunity } from "@/lib/content";

function serializeArticle(article: Record<string, unknown>): Article {
  return {
    title: String(article.title),
    slug: String(article.slug),
    excerpt: String(article.excerpt),
    body: String(article.body),
    category: String(article.category),
    author: String(article.author),
    metaTitle: String(article.metaTitle),
    metaDescription: String(article.metaDescription),
    keywords: Array.isArray(article.keywords) ? article.keywords.map(String) : [],
    publishedAt: new Date(String(article.publishedAt ?? article.createdAt)),
  };
}

function serializeOpportunity(opportunity: Record<string, unknown>): Opportunity {
  return {
    title: String(opportunity.title),
    slug: String(opportunity.slug),
    type: opportunity.type as Opportunity["type"],
    location: String(opportunity.location),
    team: String(opportunity.team),
    compensation: String(opportunity.compensation),
    summary: String(opportunity.summary),
    description: String(opportunity.description),
    skills: Array.isArray(opportunity.skills) ? opportunity.skills.map(String) : [],
    status: opportunity.status as Opportunity["status"],
    publishedAt: new Date(String(opportunity.publishedAt ?? opportunity.createdAt)),
  };
}

export async function getPublishedArticles(): Promise<Article[]> {
  if (!isDatabaseConfigured()) return sampleArticles;
  await connectToDatabase();
  const articles = await ArticleModel.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .lean();
  return articles.map((article) => serializeArticle(article));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!isDatabaseConfigured()) {
    return sampleArticles.find((article) => article.slug === slug) ?? null;
  }
  await connectToDatabase();
  const article = await ArticleModel.findOne({ slug, status: "published" }).lean();
  return article ? serializeArticle(article) : null;
}

export async function getPublishedOpportunities(): Promise<Opportunity[]> {
  if (!isDatabaseConfigured()) return sampleOpportunities;
  await connectToDatabase();
  const opportunities = await OpportunityModel.find({ status: "Open" })
    .sort({ publishedAt: -1 })
    .lean();
  return opportunities.map((opportunity) => serializeOpportunity(opportunity));
}

export async function getTalentPortalOpportunities(): Promise<{
  opportunities: Opportunity[];
  usingExamples: boolean;
}> {
  if (!isDatabaseConfigured()) {
    return { opportunities: sampleOpportunities, usingExamples: true };
  }
  await connectToDatabase();
  const opportunities = await OpportunityModel.find({ status: "Open" })
    .sort({ publishedAt: -1 })
    .lean();
  if (!opportunities.length) {
    return { opportunities: sampleOpportunities, usingExamples: true };
  }
  return {
    opportunities: opportunities.map((opportunity) => serializeOpportunity(opportunity)),
    usingExamples: false,
  };
}

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  if (!isDatabaseConfigured()) {
    return sampleOpportunities.find((opportunity) => opportunity.slug === slug) ?? null;
  }
  await connectToDatabase();
  const opportunity = await OpportunityModel.findOne({ slug, status: "Open" }).lean();
  return opportunity ? serializeOpportunity(opportunity) : null;
}

export async function getTalentPortalOpportunityBySlug(
  slug: string,
): Promise<{ opportunity: Opportunity | null; usingExamples: boolean }> {
  if (!isDatabaseConfigured()) {
    return {
      opportunity: sampleOpportunities.find((opportunity) => opportunity.slug === slug) ?? null,
      usingExamples: true,
    };
  }
  await connectToDatabase();
  const opportunity = await OpportunityModel.findOne({ slug, status: "Open" }).lean();
  if (opportunity) {
    return { opportunity: serializeOpportunity(opportunity), usingExamples: false };
  }
  if (await OpportunityModel.exists({ status: "Open" })) {
    return { opportunity: null, usingExamples: false };
  }
  const example = sampleOpportunities.find((item) => item.slug === slug) ?? null;
  return { opportunity: example, usingExamples: Boolean(example) };
}
