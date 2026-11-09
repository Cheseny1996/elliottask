"use client";

import { useCallback, useEffect, useState } from "react";
import { Brand, BrandMark } from "@/components/site-shell";
import { AdminStaffPanel } from "@/components/admin-staff-panel";
import { AdminMatchingPanel } from "@/components/admin-matching-panel";
import { AdminOverviewPanel } from "@/components/admin-overview-panel";
import { type AdminPermission, type AdminRole } from "@/lib/admin-roles";
import { opportunityTypeLabels, type OpportunityType } from "@/lib/opportunity-categories";

type Tab = "overview" | "articles" | "opportunities" | "inquiries" | "staff" | "matches" | "finance";
type ArticleStatus = "draft" | "pending_approval" | "published";
type OpportunityStatus = "Draft" | "Pending approval" | "Open" | "Closed";
type InquiryStatus = "new" | "in_review" | "contacted" | "closed";

type AdminArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  heroImage: string;
  heroAlt: string;
  category: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  status: ArticleStatus;
};

type AdminOpportunity = {
  _id: string;
  title: string;
  slug: string;
  type: OpportunityType;
  location: string;
  team: string;
  compensation: string;
  summary: string;
  description: string;
  skills: string[];
  taskDurationHours: number | null;
  status: OpportunityStatus;
};

type AdminInquiry = {
  _id: string;
  kind: "hire" | "quote" | "talent";
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  opportunity: string;
  status: InquiryStatus;
  createdAt: string;
  replies?: { subject: string; body: string; sentAt: string }[];
};

type ArticleDraft = Omit<AdminArticle, "_id">;
type OpportunityDraft = Omit<AdminOpportunity, "_id">;
type AiTool = "article" | "topics" | "headlines" | "outline" | "keywords" | "research" | "image-prompt";
type AiToolResult = {
  items?: unknown[];
  title?: string;
  headings?: { level: number; text: string }[];
  prompt?: string;
  altText?: string;
  summary?: string;
  keyPoints?: string[];
  keywords?: string[];
  suggestedTitle?: string;
  draftSection?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

const blankArticle: ArticleDraft = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  heroImage: "",
  heroAlt: "",
  category: "",
  author: "elliottask editorial",
  metaTitle: "",
  metaDescription: "",
  keywords: [],
  status: "draft",
};

const blankOpportunity: OpportunityDraft = {
  title: "",
  slug: "",
  type: "Full-time",
  location: "Remote",
  team: "",
  compensation: "",
  summary: "",
  description: "",
  skills: [],
  taskDurationHours: null,
  status: "Draft",
};

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeMetaTitle(value: string) {
  const cleanTitle = value.trim();
  return cleanTitle.length > 58 ? `${cleanTitle.slice(0, 57).trimEnd()}…` : cleanTitle;
}

function makeMetaDescription(value: string) {
  const cleanDescription = value.trim().replace(/\s+/g, " ");
  return cleanDescription.length > 160 ? `${cleanDescription.slice(0, 157).trimEnd()}…` : cleanDescription;
}

async function responseJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result;
}

export function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [role, setRole] = useState<AdminRole | null>(null);
  const [roleLabel, setRoleLabel] = useState("");
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [opportunities, setOpportunities] = useState<AdminOpportunity[]>([]);
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [articleDraft, setArticleDraft] = useState<ArticleDraft>(blankArticle);
  const [opportunityDraft, setOpportunityDraft] = useState<OpportunityDraft>(blankOpportunity);
  const [articleWorkspace, setArticleWorkspace] = useState<"write" | "ai">("write");
  const [aiTool, setAiTool] = useState<AiTool>("article");
  const [aiToolResult, setAiToolResult] = useState<AiToolResult | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMode, setAiMode] = useState<"draft" | "rewrite" | "seo" | "expand">("draft");
  const [aiTone, setAiTone] = useState("professional");
  const [aiAudience, setAiAudience] = useState("technology teams and specialists");
  const [aiKeywords, setAiKeywords] = useState("AI, hiring, editorial, talent");
  const [aiCategory, setAiCategory] = useState("AI and hiring");
  const [aiSourceUrl, setAiSourceUrl] = useState("");
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiImageAlt, setAiImageAlt] = useState("");
  const [headingLevel, setHeadingLevel] = useState("##");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [sendingId, setSendingId] = useState("");

  const loadData = useCallback(async (allowed: AdminPermission[] = permissions) => {
    const requests: Promise<void>[] = [];
    if (allowed.includes("articles_read")) {
      requests.push(fetch("/api/admin/articles", { cache: "no-store" }).then(responseJson).then((result) => setArticles(result.articles)));
    }
    if (allowed.includes("opportunities_read")) {
      requests.push(fetch("/api/admin/opportunities", { cache: "no-store" }).then(responseJson).then((result) => setOpportunities(result.opportunities)));
    }
    if (allowed.includes("inquiries_read")) {
      requests.push(fetch("/api/admin/inquiries", { cache: "no-store" }).then(responseJson).then((result) => setInquiries(result.inquiries)));
    }
    await Promise.all(requests);
  }, [permissions]);

  function applyAdminSession(session: { email: string; role: AdminRole; roleLabel: string; permissions: AdminPermission[] }) {
    setEmail(session.email);
    setRole(session.role);
    setRoleLabel(session.roleLabel);
    setPermissions(session.permissions);
    const available: Tab[] = [];
    if (session.permissions.includes("analytics_read")) available.push("overview");
    if (session.permissions.includes("articles_read")) available.push("articles");
    if (session.permissions.includes("opportunities_read")) available.push("opportunities");
    if (session.permissions.includes("inquiries_read")) available.push("inquiries");
    if (session.permissions.includes("staff_manage")) available.push("staff");
    if (session.permissions.includes("matches_read")) available.push("matches");
    if (session.role === "finance" || session.role === "super_admin") available.push("finance");
    setTab((current) => available.includes(current) ? current : available[0] ?? "finance");
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((session) => {
        if (!active) return;
        if (session?.authenticated) {
          setAuthenticated(true);
          applyAdminSession(session);
          void loadData(session.permissions).catch((loadError: unknown) => {
            if (active) {
              setError(loadError instanceof Error ? loadError.message : "Workspace data could not be loaded.");
            }
          });
        }
      })
      .catch((sessionError: unknown) => {
        if (active) setError(sessionError instanceof Error ? sessionError.message : "Unable to check administrator access.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, [loadData]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      await responseJson(response);
      const session = await responseJson(await fetch("/api/admin/session", { cache: "no-store" }));
      setAuthenticated(true);
      setPassword("");
      applyAdminSession(session);
      await loadData(session.permissions);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setArticles([]);
    setOpportunities([]);
    setInquiries([]);
  }

  async function saveArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(editingId ? `/api/admin/articles/${editingId}` : "/api/admin/articles", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(articleDraft),
      });
      await responseJson(response);
      setArticleDraft(blankArticle);
      setEditingId("");
      setNotice(articleDraft.status === "pending_approval" ? "Article submitted for Super Admin approval." : articleDraft.status === "published" ? "Article published." : "Article draft saved.");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The article could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function generateAiArticle(mode: typeof aiMode = aiMode) {
    if (!aiPrompt.trim()) {
      setError("Enter a topic or article brief first.");
      return;
    }
    if (mode !== "draft" && !articleDraft.body.trim()) {
      setError("Add article content before using rewrite, SEO optimize, or expand.");
      return;
    }
    if (mode !== "draft" && !window.confirm("This action replaces the current article text. Continue?")) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await responseJson(await fetch("/api/admin/articles/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: aiPrompt.trim(),
          audience: aiAudience,
          keywords: aiKeywords,
          category: aiCategory,
          mode,
          tone: aiTone,
          existingBody: mode === "draft" ? undefined : articleDraft.body,
        }),
      })) as { article: Partial<ArticleDraft> };
      setArticleDraft((draft) => ({
        ...draft,
        title: result.article.title || draft.title,
        slug: result.article.slug || draft.slug || makeSlug(result.article.title || draft.title),
        excerpt: result.article.excerpt || draft.excerpt,
        body: result.article.body || draft.body,
        category: result.article.category || draft.category || aiCategory,
        author: result.article.author || draft.author,
        metaTitle: result.article.metaTitle || draft.metaTitle || makeMetaTitle(result.article.title || draft.title),
        metaDescription: result.article.metaDescription || draft.metaDescription || makeMetaDescription(result.article.excerpt || draft.excerpt),
        keywords: result.article.keywords?.length ? result.article.keywords : draft.keywords,
      }));
      setArticleWorkspace("write");
      setNotice(mode === "draft" ? "AI draft created. Review and edit every detail before publishing." : "AI update applied. Review the content and verify all claims before publishing.");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "The AI assistant could not generate the article.");
    } finally {
      setBusy(false);
    }
  }

  async function runAiTool() {
    setBusy(true);
    setError("");
    setNotice("");
    setAiToolResult(null);
    try {
      const result = await responseJson(await fetch("/api/admin/articles/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tool: aiTool,
          topic: aiPrompt,
          audience: aiAudience,
          keywords: aiKeywords,
          category: aiCategory,
          tone: aiTone,
          sourceUrl: aiSourceUrl || undefined,
          sourceText: aiSourceText || undefined,
        }),
      })) as { result: AiToolResult };
      setAiToolResult(result.result);
      if (aiTool === "image-prompt") {
        setAiImagePrompt(result.result.prompt || "");
        setAiImageAlt(result.result.altText || "");
      }
    } catch (toolError) {
      setError(toolError instanceof Error ? toolError.message : "The AI assistant could not complete this task.");
    } finally {
      setBusy(false);
    }
  }

  async function generateArticleImage() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await responseJson(await fetch("/api/admin/articles/ai/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: aiImagePrompt, altText: aiImageAlt }),
      })) as { imageUrl: string; altText: string };
      setArticleDraft((draft) => ({ ...draft, heroImage: result.imageUrl, heroAlt: result.altText }));
      setArticleWorkspace("write");
      setNotice("Image generated, saved to the media library, and added to this article.");
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "The image could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  function applyAiTopic(item: unknown) {
    if (typeof item === "string") {
      setAiPrompt(item);
    } else if (item && typeof item === "object" && "title" in item && typeof item.title === "string") {
      const angle = "angle" in item && typeof item.angle === "string" ? item.angle : "";
      setAiPrompt(angle ? `${item.title}: ${angle}` : item.title);
    }
    setAiTool("article");
  }

  function applyAiHeadline(title: string) {
    setArticleDraft((draft) => ({
      ...draft,
      title,
      slug: draft.slug || makeSlug(title),
      metaTitle: draft.metaTitle || makeMetaTitle(title),
    }));
    setArticleWorkspace("write");
    setNotice("Headline applied to the article draft.");
  }

  function applyAiOutline() {
    if (!aiToolResult?.headings?.length) return;
    const outline = aiToolResult.headings
      .filter((heading) => heading.level >= 2 && heading.level <= 6 && heading.text.trim())
      .map((heading) => `${"#".repeat(heading.level)} ${heading.text.trim()}`)
      .join("\n\n");
    setArticleDraft((draft) => ({
      ...draft,
      title: aiToolResult.title || draft.title,
      slug: draft.slug || makeSlug(aiToolResult.title || draft.title),
      body: outline,
    }));
    setArticleWorkspace("write");
    setNotice("Outline added. Continue writing under each section heading.");
  }

  function applyAiKeywords() {
    const suggestions = (aiToolResult?.items ?? []).filter((item): item is string => typeof item === "string");
    setArticleDraft((draft) => ({ ...draft, keywords: [...new Set([...draft.keywords, ...suggestions])].slice(0, 12) }));
    setArticleWorkspace("write");
    setNotice("Suggested keywords added to the article SEO fields.");
  }

  function applyAiResearch() {
    if (!aiToolResult) return;
    const notes = aiToolResult.draftSection || aiToolResult.summary || "";
    if (!notes) return;
    const attribution = aiToolResult.sourceUrl
      ? `\n\nSource: [${aiToolResult.sourceTitle || "Reference article"}](${aiToolResult.sourceUrl})`
      : "";
    setArticleDraft((draft) => ({
      ...draft,
      title: draft.title || aiToolResult.suggestedTitle || "",
      slug: draft.slug || makeSlug(aiToolResult.suggestedTitle || ""),
      body: `${draft.body.trim()}\n\n${notes}${attribution}`.trim(),
      keywords: [...new Set([...draft.keywords, ...(aiToolResult.keywords ?? [])])].slice(0, 12),
    }));
    setArticleWorkspace("write");
    setNotice("Research notes and attribution added. Verify facts and write original copy before publishing.");
  }

  function insertHeading() {
    setArticleDraft((draft) => ({ ...draft, body: `${draft.body.trim()}\n\n${headingLevel} New section\n\n`.trimStart() }));
  }

  function insertImage() {
    if (!imageUrl.trim() || !imageAlt.trim()) {
      setError("Enter an image URL and descriptive alt text before inserting it.");
      return;
    }
    setArticleDraft((draft) => ({
      ...draft,
      heroImage: draft.heroImage || imageUrl.trim(),
      heroAlt: draft.heroAlt || imageAlt.trim(),
      body: `${draft.body.trim()}\n\n![${imageAlt.trim()}](${imageUrl.trim()})`.trim(),
    }));
    setImageUrl("");
    setImageAlt("");
  }

  async function saveOpportunity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(editingId ? `/api/admin/opportunities/${editingId}` : "/api/admin/opportunities", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(opportunityDraft),
      });
      const result = await responseJson(response);
      setOpportunityDraft(blankOpportunity);
      setEditingId("");
      setNotice(result.assignmentWarning ?? (opportunityDraft.status === "Pending approval" ? "Opportunity submitted for Super Admin approval." : opportunityDraft.status === "Open" ? opportunityDraft.type === "Full-time" ? "Full-time role published." : "Contract task published for automatic profile matching." : "Opportunity draft saved."));
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The opportunity could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(path: string, label: string) {
    if (!window.confirm(`Permanently delete this ${label}?`)) return;
    setError("");
    setNotice("");
    try {
      await responseJson(await fetch(path, { method: "DELETE" }));
      setNotice(`${label[0].toUpperCase()}${label.slice(1)} deleted.`);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `The ${label} could not be deleted.`);
    }
  }

  async function updateInquiryStatus(id: string, status: InquiryStatus) {
    setError("");
    try {
      await responseJson(await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      }));
      setInquiries((current) => current.map((item) => item._id === id ? { ...item, status } : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The request status could not be updated.");
    }
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>, inquiryId: string) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSendingId(inquiryId);
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/message`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(replyDrafts[inquiryId]),
      });
      await responseJson(response);
      setReplyDrafts((current) => ({ ...current, [inquiryId]: { subject: "", body: "" } }));
      setNotice("Email sent and logged on the request.");
      await loadData();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "The email could not be sent.");
    } finally {
      setSendingId("");
    }
  }

  function startArticleEdit(article: AdminArticle) {
    setTab("articles");
    setArticleWorkspace("write");
    setArticleDraft({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      body: article.body,
      heroImage: article.heroImage,
      heroAlt: article.heroAlt,
      category: article.category,
      author: article.author,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      keywords: article.keywords,
      status: article.status,
    });
    setEditingId(article._id);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startOpportunityEdit(opportunity: AdminOpportunity) {
    setTab("opportunities");
    setOpportunityDraft({
      title: opportunity.title,
      slug: opportunity.slug,
      type: opportunity.type,
      location: opportunity.location,
      team: opportunity.team,
      compensation: opportunity.compensation,
      summary: opportunity.summary,
      description: opportunity.description,
      skills: opportunity.skills,
      taskDurationHours: opportunity.taskDurationHours ?? null,
      status: opportunity.status,
    });
    setEditingId(opportunity._id);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (checking) {
    return <div className="admin-loading" role="status">Checking administrator access…</div>;
  }

  if (!authenticated) {
    return (
      <section className="admin-login">
        <div className="admin-login-mark"><BrandMark /></div>
        <p className="eyebrow">elliottask workspace</p>
        <h1>Administrator sign in</h1>
        <p>Sign in to your department workspace for content, hiring, matching, or operations.</p>
        <form className="admin-login-form" onSubmit={signIn}>
          <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="admin-login-foot">Access is limited to invited team members and the configured Super Admin.</p>
      </section>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar"><Brand /><div><span className="admin-email">{email}</span><button className="button button-outline button-small" onClick={signOut}>Sign out</button></div></header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="eyebrow">Workspace</p>
          <p className="admin-role-chip">{roleLabel}</p>
          {([
            ...(permissions.includes("analytics_read") ? [["overview", "Overview", 0] as const] : []),
            ...(permissions.includes("articles_read") ? [["articles", "Articles", articles.length] as const] : []),
            ...(permissions.includes("opportunities_read") ? [["opportunities", "Opportunities", opportunities.length] as const] : []),
            ...(permissions.includes("inquiries_read") ? [["inquiries", "Requests", inquiries.length] as const] : []),
            ...(permissions.includes("staff_manage") ? [["staff", "Team access", 0] as const] : []),
            ...(permissions.includes("matches_read") ? [["matches", "Talent matching", 0] as const] : []),
            ...(role === "finance" || role === "super_admin" ? [["finance", "Finance", 0] as const] : []),
          ]).map(([id, label, count]) => (
            <button className={`admin-nav-item${tab === id ? " is-active" : ""}`} key={id} onClick={() => { setTab(id); setEditingId(""); setError(""); setNotice(""); }}>
              <span>{label}</span>{count > 0 && <b>{count}</b>}
            </button>
          ))}
          <div className="admin-sidebar-note"><strong>Role-based workspace</strong><p>{role === "super_admin" ? "Review department submissions and approve content before it goes public." : "Your access is limited to the workflows assigned to your role. Super Admin approval is required before content goes public."}</p></div>
        </aside>
        <main className="admin-main">
          <div className="admin-heading"><div><p className="eyebrow">{roleLabel || "Workspace"}</p><h1>{tab === "overview" ? "Operations overview" : tab === "articles" ? "Articles" : tab === "opportunities" ? "Opportunities" : tab === "inquiries" ? "Incoming requests" : tab === "staff" ? "Team access" : tab === "matches" ? "Talent matching" : "Finance foundation"}</h1></div><span className="admin-session-chip">Signed in securely</span></div>
          {error && <p className="form-error admin-alert" role="alert">{error}</p>}
          {notice && <p className="form-success admin-alert" role="status">{notice}</p>}

          {tab === "overview" && permissions.includes("analytics_read") && <AdminOverviewPanel />}
          {tab === "articles" && (
            <div className="admin-columns">
              {permissions.includes("articles_write") ? (
                <section className="admin-editor">
                  <h2>{editingId ? "Edit article" : "Write an article"}</h2>
                  <div className="admin-article-workspace-tabs" role="tablist" aria-label="Article writing mode">
                    <button type="button" role="tab" aria-selected={articleWorkspace === "write"} className={articleWorkspace === "write" ? "is-active" : ""} onClick={() => setArticleWorkspace("write")}>Write article</button>
                    <button type="button" role="tab" aria-selected={articleWorkspace === "ai"} className={articleWorkspace === "ai" ? "is-active" : ""} onClick={() => setArticleWorkspace("ai")}>✦ Write with AI</button>
                  </div>
                  {articleWorkspace === "ai" ? (
                    <div className="admin-ai-panel">
                      <div className="admin-ai-intro"><strong>AI editorial studio</strong><p>Generate article drafts, topic and headline ideas, outlines, keywords, source-based notes, and original images. Always review AI output and verify claims before publishing.</p></div>
                      <div className="admin-ai-tool-tabs" role="tablist" aria-label="Choose an AI writing tool">
                        {([
                          ["article", "Write article"], ["topics", "Topic ideas"], ["headlines", "Headlines"],
                          ["outline", "Headings & outline"], ["keywords", "Keywords"], ["research", "Research a source"],
                          ["image-prompt", "Article image"],
                        ] as const).map(([id, label]) => (
                          <button key={id} type="button" role="tab" aria-selected={aiTool === id} className={aiTool === id ? "is-active" : ""} onClick={() => { setAiTool(id); setAiToolResult(null); }}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="admin-ai-head">
                        <strong>{aiTool === "article" ? "Article writer" : aiTool === "topics" ? "Main topic generator" : aiTool === "headlines" ? "Headline generator" : aiTool === "outline" ? "Heading and outline generator" : aiTool === "keywords" ? "Keyword generator" : aiTool === "research" ? "Source research" : "Article image generator"}</strong>
                        {aiTool === "article" && <div className="admin-ai-actions"><select aria-label="Article AI action" value={aiMode} onChange={(event) => setAiMode(event.target.value as typeof aiMode)}>
                          <option value="draft">New article</option><option value="rewrite">Rewrite</option><option value="seo">SEO optimize</option><option value="expand">Expand article</option>
                        </select></div>}
                      </div>
                      <label>{aiTool === "topics" ? "Seed topic (optional)" : aiTool === "research" ? "Article focus" : aiTool === "image-prompt" ? "Image subject or article topic" : "Main topic or article brief"}
                        <textarea rows={3} maxLength={500} value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Example: A practical guide to responsible AI hiring for growing teams." />
                      </label>
                      <div className="admin-form-row">
                        <label>Audience<input value={aiAudience} onChange={(event) => setAiAudience(event.target.value)} /></label>
                        <label>Category<input value={aiCategory} onChange={(event) => setAiCategory(event.target.value)} /></label>
                      </div>
                      <label>Writing style<select value={aiTone} onChange={(event) => setAiTone(event.target.value)}>
                        <option value="professional">Professional and clear</option><option value="conversational">Warm and conversational</option><option value="thought-leadership">Thought leadership</option><option value="practical">Practical step-by-step guide</option>
                      </select></label>
                      <label>Keywords<input value={aiKeywords} onChange={(event) => setAiKeywords(event.target.value)} placeholder="AI, hiring, editorial, talent" /></label>
                      {aiTool === "research" && <>
                        <label>Public source article URL<input type="url" value={aiSourceUrl} onChange={(event) => setAiSourceUrl(event.target.value)} placeholder="https://example.com/article" /></label>
                        <label>Or paste source text<textarea rows={4} maxLength={12000} value={aiSourceText} onChange={(event) => setAiSourceText(event.target.value)} placeholder="Paste text from a source if its URL cannot be read. The assistant will create original research notes, not copy the article." /></label>
                        <small className="admin-ai-disclaimer">Only use sources you may reference. AI summaries do not verify claims or grant rights to republish text.</small>
                      </>}
                      {aiTool === "image-prompt" && aiImagePrompt && <>
                        <label>Image generation prompt<textarea rows={4} maxLength={2000} value={aiImagePrompt} onChange={(event) => setAiImagePrompt(event.target.value)} /></label>
                        <label>Image alt text<input value={aiImageAlt} onChange={(event) => setAiImageAlt(event.target.value)} maxLength={180} /></label>
                        <button type="button" className="button button-primary" disabled={busy} onClick={generateArticleImage}>{busy ? "Generating image…" : "Generate and add image to article"}</button>
                      </>}
                      <button type="button" className="button button-primary admin-ai-run" disabled={busy || (aiTool !== "topics" && !aiPrompt.trim()) || (aiTool === "research" && !aiSourceUrl.trim() && !aiSourceText.trim())} onClick={() => aiTool === "article" ? generateAiArticle() : runAiTool()}>
                        {busy ? "Working…" : aiTool === "article" ? "Write article with AI" : aiTool === "image-prompt" ? "Create image prompt" : aiTool === "research" ? "Research source and optimize" : "Generate"}
                      </button>
                      {aiToolResult && <div className="admin-ai-result" aria-live="polite">
                        {aiTool === "topics" && <><strong>Topic ideas</strong><ul>{aiToolResult.items?.map((item, index) => {
                          const title = typeof item === "string" ? item : item && typeof item === "object" && "title" in item && typeof item.title === "string" ? item.title : "";
                          const angle = item && typeof item === "object" && "angle" in item && typeof item.angle === "string" ? item.angle : "";
                          return title ? <li key={`${title}-${index}`}><span><b>{title}</b>{angle && <small>{angle}</small>}</span><button type="button" onClick={() => applyAiTopic(item)}>Use topic</button></li> : null;
                        })}</ul></>}
                        {aiTool === "headlines" && <><strong>Headline options</strong><ul>{aiToolResult.items?.map((item, index) => typeof item === "string" ? <li key={`${item}-${index}`}><span>{item}</span><button type="button" onClick={() => applyAiHeadline(item)}>Use headline</button></li> : null)}</ul></>}
                        {aiTool === "outline" && <><strong>{aiToolResult.title || "Suggested article structure"}</strong><ol>{aiToolResult.headings?.map((heading, index) => <li key={`${heading.text}-${index}`}>H{heading.level} — {heading.text}</li>)}</ol><button type="button" className="button button-outline button-small" onClick={applyAiOutline}>Add outline to article</button></>}
                        {aiTool === "keywords" && <><strong>Keyword suggestions</strong><ul>{aiToolResult.items?.map((item, index) => typeof item === "string" ? <li key={`${item}-${index}`}>{item}</li> : null)}</ul><button type="button" className="button button-outline button-small" onClick={applyAiKeywords}>Add keywords to SEO fields</button></>}
                        {aiTool === "research" && <><strong>Source research notes</strong><p>{aiToolResult.summary}</p><ul>{aiToolResult.keyPoints?.map((point, index) => <li key={`${point}-${index}`}>{point}</li>)}</ul>{aiToolResult.keywords?.length ? <p><b>Related keywords:</b> {aiToolResult.keywords.join(", ")}</p> : null}{aiToolResult.sourceUrl && <p>Reference: <a href={aiToolResult.sourceUrl} target="_blank" rel="noreferrer noopener">{aiToolResult.sourceTitle || aiToolResult.sourceUrl}</a></p>}<button type="button" className="button button-outline button-small" onClick={applyAiResearch}>Add notes and attribution</button></>}
                        {aiTool === "image-prompt" && <p>Review and edit the image prompt, then generate an original image for this article.</p>}
                      </div>}
                    </div>
                  ) : (
                    <form className="admin-article-form" onSubmit={saveArticle}>
                      <label>Headline<input required minLength={5} maxLength={120} value={articleDraft.title} onChange={(event) => setArticleDraft((draft) => ({ ...draft, title: event.target.value, ...(!editingId && !draft.slug ? { slug: makeSlug(event.target.value) } : {}) }))} /></label>
                      <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={articleDraft.slug} onChange={(event) => setArticleDraft((draft) => ({ ...draft, slug: event.target.value }))} /></label>
                      <label>Excerpt<textarea required minLength={20} maxLength={320} rows={3} value={articleDraft.excerpt} onChange={(event) => setArticleDraft((draft) => ({ ...draft, excerpt: event.target.value }))} /></label>
                      <div className="admin-article-body">
                        <div className="admin-article-body-head"><strong>Article body</strong><div className="admin-ai-actions"><select aria-label="Heading level to insert" value={headingLevel} onChange={(event) => setHeadingLevel(event.target.value)}>{[2, 3, 4, 5, 6].map((level) => <option key={level} value={"#".repeat(level)}>H{level}</option>)}</select><button type="button" className="button button-outline button-small" onClick={insertHeading}>Insert heading</button></div></div>
                        <textarea required minLength={80} maxLength={30000} rows={12} placeholder="Use ## for H2, ### for H3, and blank lines between paragraphs. Add links as [link text](https://...). Images use ![descriptive alt text](image URL)." value={articleDraft.body} onChange={(event) => setArticleDraft((draft) => ({ ...draft, body: event.target.value }))} />
                      </div>
                      <div className="admin-form-row"><label>Image URL<input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https:// or /api/media/…" /></label><label>Image alt text<input value={imageAlt} maxLength={180} onChange={(event) => setImageAlt(event.target.value)} placeholder="Describe the image" /></label></div>
                      <button type="button" className="button button-outline button-small" onClick={insertImage}>Insert image into article</button>
                      <div className="admin-form-row"><label>Hero image URL<input type="text" maxLength={2048} value={articleDraft.heroImage} onChange={(event) => setArticleDraft((draft) => ({ ...draft, heroImage: event.target.value }))} placeholder="https:// or /api/media/…" /></label><label>Hero image alt text<input maxLength={180} value={articleDraft.heroAlt} onChange={(event) => setArticleDraft((draft) => ({ ...draft, heroAlt: event.target.value }))} /></label></div>
                      <div className="admin-form-row"><label>Category<input required value={articleDraft.category} onChange={(event) => setArticleDraft((draft) => ({ ...draft, category: event.target.value }))} /></label><label>Author<input required value={articleDraft.author} onChange={(event) => setArticleDraft((draft) => ({ ...draft, author: event.target.value }))} /></label></div>
                      <label><span className="admin-label-header"><span>Search title</span><small>{articleDraft.metaTitle.length}/70</small></span><input required maxLength={70} value={articleDraft.metaTitle} onChange={(event) => setArticleDraft((draft) => ({ ...draft, metaTitle: event.target.value }))} /></label>
                      <label><span className="admin-label-header"><span>Search description</span><small>{articleDraft.metaDescription.length}/170</small></span><textarea required minLength={30} maxLength={170} rows={3} value={articleDraft.metaDescription} onChange={(event) => setArticleDraft((draft) => ({ ...draft, metaDescription: event.target.value }))} /></label>
                      <label>Keywords<input value={articleDraft.keywords.join(", ")} onChange={(event) => setArticleDraft((draft) => ({ ...draft, keywords: event.target.value.split(",").map((word) => word.trim()).filter(Boolean).slice(0, 12) }))} placeholder="software quality, remote teams" /></label>
                      <label>Workflow status<select value={articleDraft.status} onChange={(event) => setArticleDraft((draft) => ({ ...draft, status: event.target.value as ArticleStatus }))}><option value="draft">Draft</option><option value="pending_approval">Submit for approval</option>{permissions.includes("articles_publish") && <option value="published">Publish</option>}</select></label>
                      <div className="admin-editor-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Save article"}</button>{editingId && <button className="button button-outline" type="button" onClick={() => { setEditingId(""); setArticleDraft(blankArticle); }}>Cancel</button>}</div>
                    </form>
                  )}
                </section>
              ) : <p className="admin-readonly-note">Your role can view articles but cannot create or edit them.</p>}
              <div className="admin-records"><h2>Saved articles <span>{articles.length}</span></h2>{articles.length ? articles.map((article) => <article className="admin-record" key={article._id}><div><span className={`status-pill status-${article.status.replaceAll("_", "-")}`}>{article.status.replaceAll("_", " ")}</span><h3>{article.title}</h3><p>/articles/{article.slug}</p></div><div className="admin-record-actions">{permissions.includes("articles_write") && <button onClick={() => startArticleEdit(article)}>Edit{article.status === "pending_approval" && permissions.includes("articles_publish") ? " / review" : ""}</button>}{permissions.includes("articles_delete") && <button className="danger-action" onClick={() => removeItem(`/api/admin/articles/${article._id}`, "article")}>Delete</button>}</div></article>) : <p className="admin-empty">No saved articles yet.</p>}</div>
            </div>
          )}

          {tab === "opportunities" && (
            <div className="admin-columns">
              <form className="admin-editor" onSubmit={saveOpportunity}>
                <h2>{editingId ? "Edit opportunity" : "Publish an opportunity"}</h2>
                <label>Role or project title<input required minLength={5} maxLength={120} value={opportunityDraft.title} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, title: event.target.value, ...(!editingId && !draft.slug ? { slug: makeSlug(event.target.value) } : {}) }))} /></label>
                <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={opportunityDraft.slug} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, slug: event.target.value }))} /></label>
                <div className="admin-form-row">
                  <label>Opportunity category<select value={opportunityDraft.type} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, type: event.target.value as OpportunityType, ...(event.target.value === "Full-time" ? { taskDurationHours: null } : {}) }))}><option value="Full-time">{opportunityTypeLabels["Full-time"]}</option><option value="Project">{opportunityTypeLabels.Project}</option><option value="AI task">{opportunityTypeLabels["AI task"]}</option></select><small className="admin-field-help">Shown as Full-time, Project, or AI Training on the talent board.</small></label>
                  <label>Workflow status<select value={opportunityDraft.status} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, status: event.target.value as OpportunityStatus }))}><option>Draft</option><option>Pending approval</option>{permissions.includes("opportunities_publish") && <><option>Open</option><option>Closed</option></>}</select></label>
                </div>
                {opportunityDraft.type !== "Full-time" && <label>Task deadline after assignment (hours)<small className="admin-field-help">1–720 hours. The countdown begins automatically when the best-fit talent is assigned. If time runs out, the task returns to the available pool.</small><input type="number" min={1} max={720} step={1} required value={opportunityDraft.taskDurationHours ?? ""} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, taskDurationHours: event.target.value ? Number(event.target.value) : null }))} placeholder="e.g. 48" /></label>}
                <div className="admin-form-row"><label>Location<input required value={opportunityDraft.location} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, location: event.target.value }))} /></label><label>Team<input required value={opportunityDraft.team} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, team: event.target.value }))} /></label></div>
                <label>Compensation / rate disclosure<input required maxLength={120} value={opportunityDraft.compensation} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, compensation: event.target.value }))} /></label>
                <label>Short description<textarea required minLength={20} maxLength={320} rows={3} value={opportunityDraft.summary} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, summary: event.target.value }))} /></label>
                <label>Full description<small className="admin-field-help">Describe responsibilities, required experience, work arrangement, and what success looks like.</small><textarea required minLength={40} maxLength={12000} rows={8} value={opportunityDraft.description} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, description: event.target.value }))} /></label>
                <label>Skills <input value={opportunityDraft.skills.join(", ")} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, skills: event.target.value.split(",").map((word) => word.trim()).filter(Boolean) }))} placeholder="TypeScript, React, APIs" /></label>
                <div className="admin-editor-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Save opportunity"}</button>{editingId && <button className="button button-outline" type="button" onClick={() => { setEditingId(""); setOpportunityDraft(blankOpportunity); }}>Cancel</button>}</div>
              </form>
              <div className="admin-records"><h2>Saved opportunities <span>{opportunities.length}</span></h2>{opportunities.length ? opportunities.map((opportunity) => <article className="admin-record" key={opportunity._id}><div><span className={`status-pill status-${opportunity.status.toLowerCase().replaceAll(" ", "-")}`}>{opportunity.status} · {opportunityTypeLabels[opportunity.type]}</span><h3>{opportunity.title}</h3><p>/opportunities/{opportunity.slug}</p></div><div className="admin-record-actions"><button onClick={() => startOpportunityEdit(opportunity)}>Edit{opportunity.status === "Pending approval" && permissions.includes("opportunities_publish") ? " / review" : ""}</button>{permissions.includes("opportunities_delete") && <button className="danger-action" onClick={() => removeItem(`/api/admin/opportunities/${opportunity._id}`, "opportunity")}>Delete</button>}</div></article>) : <p className="admin-empty">No saved opportunities yet.</p>}</div>
            </div>
          )}

          {tab === "inquiries" && <div className="inquiry-records"><div className="inquiry-table-head"><span>Request</span><span>Details</span><span>Received</span><span>Status</span></div>{inquiries.length ? inquiries.map((inquiry) => {
            const reply = replyDrafts[inquiry._id] ?? { subject: `Re: ${inquiry.subject || inquiry.opportunity || "Your elliottask request"}`, body: "" };
            return <article className="inquiry-record" key={inquiry._id}>
              <div><span className="status-pill">{inquiry.kind}</span><h3>{inquiry.name}</h3><a href={`mailto:${encodeURIComponent(inquiry.email)}`}>{inquiry.email}</a>{inquiry.company && <p>{inquiry.company}</p>}</div>
              <div><strong>{inquiry.subject || inquiry.opportunity || "General request"}</strong><p>{inquiry.message}</p>
                <details className="admin-reply"><summary>Write email reply</summary><form onSubmit={(event) => sendReply(event, inquiry._id)}><label>Subject<input required minLength={5} maxLength={160} value={reply.subject} onChange={(event) => setReplyDrafts((current) => ({ ...current, [inquiry._id]: { ...reply, subject: event.target.value } }))} /></label><label>Message<textarea required minLength={20} maxLength={4000} rows={4} value={reply.body} onChange={(event) => setReplyDrafts((current) => ({ ...current, [inquiry._id]: { ...reply, body: event.target.value } }))} /></label><button className="button button-primary button-small" disabled={sendingId === inquiry._id}>{sendingId === inquiry._id ? "Sending…" : "Send email"}</button></form></details>
                {inquiry.replies?.map((sentReply, index) => <details className="admin-reply-history" key={`${sentReply.sentAt}-${index}`}><summary>Sent {new Date(sentReply.sentAt).toLocaleDateString()}: {sentReply.subject}</summary><p>{sentReply.body}</p></details>)}
              </div>
              <time dateTime={inquiry.createdAt}>{new Date(inquiry.createdAt).toLocaleDateString()}</time>
              <select aria-label={`Status for ${inquiry.name}`} value={inquiry.status} onChange={(event) => updateInquiryStatus(inquiry._id, event.target.value as InquiryStatus)}><option value="new">New</option><option value="in_review">In review</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select>
            </article>;
          }) : <p className="admin-empty">No requests have been submitted.</p>}</div>}

          {tab === "staff" && <AdminStaffPanel />}
          {tab === "matches" && <AdminMatchingPanel role={role ?? "super_admin"} />}
          {tab === "finance" && (
            <section className="admin-workspace-panel">
              <div className="admin-finance-notice"><span className="status-pill">Foundation only</span><h2>Finance workflows are not enabled</h2><p>This area is reserved for finance access and future dual-approval controls. No bank or Payoneer details are stored, and this workspace cannot initiate payments, payouts, or money transfers.</p><p>Payment processing requires agreed countries, currencies, collection and payout flows, accounting records, and provider security requirements before implementation.</p></div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
