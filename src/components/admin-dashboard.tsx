"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Tab = "articles" | "opportunities" | "inquiries";
type ArticleStatus = "draft" | "published";
type OpportunityType = "Full-time" | "Project" | "AI task";
type OpportunityStatus = "Open" | "Closed";
type InquiryStatus = "new" | "in_review" | "contacted" | "closed";

type AdminArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
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

const blankArticle: ArticleDraft = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  category: "",
  author: "Elliottask Editorial",
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
  status: "Open",
};

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  const [tab, setTab] = useState<Tab>("articles");
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [opportunities, setOpportunities] = useState<AdminOpportunity[]>([]);
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [articleDraft, setArticleDraft] = useState<ArticleDraft>(blankArticle);
  const [opportunityDraft, setOpportunityDraft] = useState<OpportunityDraft>(blankOpportunity);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [sendingId, setSendingId] = useState("");

  const loadData = useCallback(async () => {
    const [articleResult, opportunityResult, inquiryResult] = await Promise.all([
      fetch("/api/admin/articles", { cache: "no-store" }).then(responseJson),
      fetch("/api/admin/opportunities", { cache: "no-store" }).then(responseJson),
      fetch("/api/admin/inquiries", { cache: "no-store" }).then(responseJson),
    ]);
    setArticles(articleResult.articles);
    setOpportunities(opportunityResult.opportunities);
    setInquiries(inquiryResult.inquiries);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(async (session) => {
        if (!active) return;
        if (session?.authenticated) {
          setAuthenticated(true);
          setEmail(session.email);
          await loadData();
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
      setAuthenticated(true);
      setPassword("");
      await loadData();
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
      setNotice("Article saved.");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The article could not be saved.");
    } finally {
      setBusy(false);
    }
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
      await responseJson(response);
      setOpportunityDraft(blankOpportunity);
      setEditingId("");
      setNotice("Opportunity saved.");
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
    setArticleDraft({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      body: article.body,
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
        <div className="admin-login-mark"><span className="brand-mark"><i /><i /><i /></span></div>
        <p className="eyebrow">Elliottask workspace</p>
        <h1>Administrator sign in</h1>
        <p>Manage articles, verified opportunities, and incoming requests.</p>
        <form className="admin-login-form" onSubmit={signIn}>
          <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="admin-login-foot">Access is limited to the configured administrator.</p>
      </section>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar"><Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>Elliottask</span></Link><div><span className="admin-email">{email}</span><button className="button button-outline button-small" onClick={signOut}>Sign out</button></div></header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="eyebrow">Workspace</p>
          {([
            ["articles", "Articles", articles.length],
            ["opportunities", "Opportunities", opportunities.length],
            ["inquiries", "Requests", inquiries.length],
          ] as const).map(([id, label, count]) => (
            <button className={`admin-nav-item${tab === id ? " is-active" : ""}`} key={id} onClick={() => { setTab(id); setEditingId(""); setError(""); setNotice(""); }}>
              <span>{label}</span><b>{count}</b>
            </button>
          ))}
          <div className="admin-sidebar-note"><strong>Before publishing</strong><p>Confirm role details, scope, compensation, and application instructions with the hiring team.</p></div>
        </aside>
        <main className="admin-main">
          <div className="admin-heading"><div><p className="eyebrow">Manage content</p><h1>{tab === "articles" ? "Articles" : tab === "opportunities" ? "Opportunities" : "Incoming requests"}</h1></div><span className="admin-session-chip">Signed in securely</span></div>
          {error && <p className="form-error admin-alert" role="alert">{error}</p>}
          {notice && <p className="form-success admin-alert" role="status">{notice}</p>}

          {tab === "articles" && (
            <div className="admin-columns">
              <form className="admin-editor" onSubmit={saveArticle}>
                <h2>{editingId ? "Edit article" : "Write an article"}</h2>
                <label>Headline<input required minLength={5} maxLength={120} value={articleDraft.title} onChange={(event) => setArticleDraft((draft) => ({ ...draft, title: event.target.value, ...(!editingId && !draft.slug ? { slug: makeSlug(event.target.value) } : {}) }))} /></label>
                <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={articleDraft.slug} onChange={(event) => setArticleDraft((draft) => ({ ...draft, slug: event.target.value }))} /></label>
                <label>Excerpt<textarea required minLength={20} maxLength={320} rows={3} value={articleDraft.excerpt} onChange={(event) => setArticleDraft((draft) => ({ ...draft, excerpt: event.target.value }))} /></label>
                <label>Article body<textarea required minLength={80} maxLength={30000} rows={10} placeholder="Use ## for a section heading and blank lines between paragraphs." value={articleDraft.body} onChange={(event) => setArticleDraft((draft) => ({ ...draft, body: event.target.value }))} /></label>
                <div className="admin-form-row"><label>Category<input required value={articleDraft.category} onChange={(event) => setArticleDraft((draft) => ({ ...draft, category: event.target.value }))} /></label><label>Author<input required value={articleDraft.author} onChange={(event) => setArticleDraft((draft) => ({ ...draft, author: event.target.value }))} /></label></div>
                <label>Search title <small>{articleDraft.metaTitle.length}/70</small><input required maxLength={70} value={articleDraft.metaTitle} onChange={(event) => setArticleDraft((draft) => ({ ...draft, metaTitle: event.target.value }))} /></label>
                <label>Search description <small>{articleDraft.metaDescription.length}/170</small><textarea required minLength={30} maxLength={170} rows={3} value={articleDraft.metaDescription} onChange={(event) => setArticleDraft((draft) => ({ ...draft, metaDescription: event.target.value }))} /></label>
                <label>Keywords <input value={articleDraft.keywords.join(", ")} onChange={(event) => setArticleDraft((draft) => ({ ...draft, keywords: event.target.value.split(",").map((word) => word.trim()).filter(Boolean) }))} placeholder="software quality, remote teams" /></label>
                <label>Publication status<select value={articleDraft.status} onChange={(event) => setArticleDraft((draft) => ({ ...draft, status: event.target.value as ArticleStatus }))}><option value="draft">Draft</option><option value="published">Published</option></select></label>
                <div className="admin-editor-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Save article"}</button>{editingId && <button className="button button-outline" type="button" onClick={() => { setEditingId(""); setArticleDraft(blankArticle); }}>Cancel</button>}</div>
              </form>
              <div className="admin-records"><h2>Saved articles <span>{articles.length}</span></h2>{articles.length ? articles.map((article) => <article className="admin-record" key={article._id}><div><span className={`status-pill status-${article.status}`}>{article.status}</span><h3>{article.title}</h3><p>/articles/{article.slug}</p></div><div className="admin-record-actions"><button onClick={() => startArticleEdit(article)}>Edit</button><button className="danger-action" onClick={() => removeItem(`/api/admin/articles/${article._id}`, "article")}>Delete</button></div></article>) : <p className="admin-empty">No saved articles yet.</p>}</div>
            </div>
          )}

          {tab === "opportunities" && (
            <div className="admin-columns">
              <form className="admin-editor" onSubmit={saveOpportunity}>
                <h2>{editingId ? "Edit opportunity" : "Publish an opportunity"}</h2>
                <label>Role or project title<input required minLength={5} maxLength={120} value={opportunityDraft.title} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, title: event.target.value, ...(!editingId && !draft.slug ? { slug: makeSlug(event.target.value) } : {}) }))} /></label>
                <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={opportunityDraft.slug} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, slug: event.target.value }))} /></label>
                <div className="admin-form-row"><label>Engagement<select value={opportunityDraft.type} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, type: event.target.value as OpportunityType }))}><option>Full-time</option><option>Project</option><option>AI task</option></select></label><label>Publication status<select value={opportunityDraft.status} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, status: event.target.value as OpportunityStatus }))}><option>Open</option><option>Closed</option></select></label></div>
                <div className="admin-form-row"><label>Location<input required value={opportunityDraft.location} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, location: event.target.value }))} /></label><label>Team<input required value={opportunityDraft.team} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, team: event.target.value }))} /></label></div>
                <label>Compensation / rate disclosure<input required maxLength={120} value={opportunityDraft.compensation} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, compensation: event.target.value }))} /></label>
                <label>Short description<textarea required minLength={20} maxLength={320} rows={3} value={opportunityDraft.summary} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, summary: event.target.value }))} /></label>
                <label>Full description<textarea required minLength={40} maxLength={12000} rows={8} value={opportunityDraft.description} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, description: event.target.value }))} /></label>
                <label>Skills <input value={opportunityDraft.skills.join(", ")} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, skills: event.target.value.split(",").map((word) => word.trim()).filter(Boolean) }))} placeholder="TypeScript, React, APIs" /></label>
                <div className="admin-editor-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Save opportunity"}</button>{editingId && <button className="button button-outline" type="button" onClick={() => { setEditingId(""); setOpportunityDraft(blankOpportunity); }}>Cancel</button>}</div>
              </form>
              <div className="admin-records"><h2>Saved opportunities <span>{opportunities.length}</span></h2>{opportunities.length ? opportunities.map((opportunity) => <article className="admin-record" key={opportunity._id}><div><span className={`status-pill status-${opportunity.status.toLowerCase()}`}>{opportunity.status} · {opportunity.type}</span><h3>{opportunity.title}</h3><p>/opportunities/{opportunity.slug}</p></div><div className="admin-record-actions"><button onClick={() => startOpportunityEdit(opportunity)}>Edit</button><button className="danger-action" onClick={() => removeItem(`/api/admin/opportunities/${opportunity._id}`, "opportunity")}>Delete</button></div></article>) : <p className="admin-empty">No published opportunities yet.</p>}</div>
            </div>
          )}

          {tab === "inquiries" && <div className="inquiry-records"><div className="inquiry-table-head"><span>Request</span><span>Details</span><span>Received</span><span>Status</span></div>{inquiries.length ? inquiries.map((inquiry) => {
            const reply = replyDrafts[inquiry._id] ?? { subject: `Re: ${inquiry.subject || inquiry.opportunity || "Your Elliottask request"}`, body: "" };
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
        </main>
      </div>
    </div>
  );
}
