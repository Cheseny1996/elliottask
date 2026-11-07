"use client";

import { useCallback, useEffect, useState } from "react";
import { Brand, BrandMark } from "@/components/site-shell";
import { AdminStaffPanel } from "@/components/admin-staff-panel";
import { AdminMatchingPanel } from "@/components/admin-matching-panel";
import { type AdminPermission, type AdminRole } from "@/lib/admin-roles";
import { opportunityTypeLabels, type OpportunityType } from "@/lib/opportunity-categories";

type Tab = "articles" | "opportunities" | "inquiries" | "staff" | "matches" | "finance";
type ArticleStatus = "draft" | "pending_approval" | "published";
type OpportunityStatus = "Draft" | "Pending approval" | "Open" | "Closed";
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
  status: "Draft",
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
  const [role, setRole] = useState<AdminRole | null>(null);
  const [roleLabel, setRoleLabel] = useState("");
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
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
      .then(async (session) => {
        if (!active) return;
        if (session?.authenticated) {
          setAuthenticated(true);
          applyAdminSession(session);
          await loadData(session.permissions);
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
      setNotice(opportunityDraft.status === "Pending approval" ? "Opportunity submitted for Super Admin approval." : opportunityDraft.status === "Open" ? "Opportunity published." : "Opportunity draft saved.");
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
          <div className="admin-heading"><div><p className="eyebrow">{roleLabel || "Workspace"}</p><h1>{tab === "articles" ? "Articles" : tab === "opportunities" ? "Opportunities" : tab === "inquiries" ? "Incoming requests" : tab === "staff" ? "Team access" : tab === "matches" ? "Talent matching" : "Finance foundation"}</h1></div><span className="admin-session-chip">Signed in securely</span></div>
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
                <label>Workflow status<select value={articleDraft.status} onChange={(event) => setArticleDraft((draft) => ({ ...draft, status: event.target.value as ArticleStatus }))}><option value="draft">Draft</option><option value="pending_approval">Submit for approval</option>{permissions.includes("articles_publish") && <option value="published">Publish</option>}</select></label>
                <div className="admin-editor-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Save article"}</button>{editingId && <button className="button button-outline" type="button" onClick={() => { setEditingId(""); setArticleDraft(blankArticle); }}>Cancel</button>}</div>
              </form>
              <div className="admin-records"><h2>Saved articles <span>{articles.length}</span></h2>{articles.length ? articles.map((article) => <article className="admin-record" key={article._id}><div><span className={`status-pill status-${article.status.replaceAll("_", "-")}`}>{article.status.replaceAll("_", " ")}</span><h3>{article.title}</h3><p>/articles/{article.slug}</p></div><div className="admin-record-actions"><button onClick={() => startArticleEdit(article)}>Edit{article.status === "pending_approval" && permissions.includes("articles_publish") ? " / review" : ""}</button>{permissions.includes("articles_delete") && <button className="danger-action" onClick={() => removeItem(`/api/admin/articles/${article._id}`, "article")}>Delete</button>}</div></article>) : <p className="admin-empty">No saved articles yet.</p>}</div>
            </div>
          )}

          {tab === "opportunities" && (
            <div className="admin-columns">
              <form className="admin-editor" onSubmit={saveOpportunity}>
                <h2>{editingId ? "Edit opportunity" : "Publish an opportunity"}</h2>
                <label>Role or project title<input required minLength={5} maxLength={120} value={opportunityDraft.title} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, title: event.target.value, ...(!editingId && !draft.slug ? { slug: makeSlug(event.target.value) } : {}) }))} /></label>
                <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={opportunityDraft.slug} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, slug: event.target.value }))} /></label>
                <div className="admin-form-row"><label>Opportunity category<small>Shown as Full-time, Project, or AI Training on the talent board.</small><select value={opportunityDraft.type} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, type: event.target.value as OpportunityType }))}><option value="Full-time">{opportunityTypeLabels["Full-time"]}</option><option value="Project">{opportunityTypeLabels.Project}</option><option value="AI task">{opportunityTypeLabels["AI task"]}</option></select></label><label>Workflow status<select value={opportunityDraft.status} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, status: event.target.value as OpportunityStatus }))}><option>Draft</option><option>Pending approval</option>{permissions.includes("opportunities_publish") && <><option>Open</option><option>Closed</option></>}</select></label></div>
                <div className="admin-form-row"><label>Location<input required value={opportunityDraft.location} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, location: event.target.value }))} /></label><label>Team<input required value={opportunityDraft.team} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, team: event.target.value }))} /></label></div>
                <label>Compensation / rate disclosure<input required maxLength={120} value={opportunityDraft.compensation} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, compensation: event.target.value }))} /></label>
                <label>Short description<textarea required minLength={20} maxLength={320} rows={3} value={opportunityDraft.summary} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, summary: event.target.value }))} /></label>
                <label>Full description<small>Describe responsibilities, required experience, work arrangement, and what success looks like.</small><textarea required minLength={40} maxLength={12000} rows={8} value={opportunityDraft.description} onChange={(event) => setOpportunityDraft((draft) => ({ ...draft, description: event.target.value }))} /></label>
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
