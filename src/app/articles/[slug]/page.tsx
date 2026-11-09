import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/article-content";
import { SiteShell } from "@/components/site-shell";
import { getArticleBySlug } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: { absolute: article.metaTitle },
    description: article.metaDescription,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.metaTitle,
      description: article.metaDescription,
      publishedTime: article.publishedAt.toISOString(),
      authors: [article.author],
      ...(article.heroImage ? { images: [{ url: article.heroImage, alt: article.heroAlt || article.title }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elliottask-nine.vercel.app";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt.toISOString(),
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: "elliottask" },
    mainEntityOfPage: `${baseUrl}/articles/${article.slug}`,
    ...(article.heroImage ? { image: new URL(article.heroImage, baseUrl).toString() } : {}),
  };

  return (
    <SiteShell>
      <article className="article-page">
        <div className="container article-narrow">
          <Link className="back-link" href="/articles">← All articles</Link>
          <div className="article-meta"><span>{article.category}</span><time dateTime={article.publishedAt.toISOString()}>{article.publishedAt.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</time></div>
          <h1>{article.title}</h1>
          <p className="article-deck">{article.excerpt}</p>
          {article.heroImage && <Image className="article-hero-image" src={article.heroImage} alt={article.heroAlt || article.title} width={1200} height={630} unoptimized />}
          <div className="article-author">By {article.author}</div>
          <ArticleContent body={article.body} />
          <div className="article-end"><p>Looking for a thoughtful next step?</p><Link className="text-link" href="/opportunities">Explore opportunities <span aria-hidden="true">↗</span></Link></div>
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </SiteShell>
  );
}
