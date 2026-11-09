"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DayMetric = { day: string; visitors: number; pageViews: number; signups: number };
type PublishedOpportunity = {
  title: string;
  slug: string;
  type: string;
  location: string;
  publishedAt: string;
};
type TaskTimelineItem = {
  id: string;
  status: "in_progress" | "completed" | "expired";
  progress: number;
  assignedAt: string;
  deadlineAt: string;
  completedAt: string | null;
  expiredAt: string | null;
  talentName: string;
  opportunity: { title: string; slug: string; type: "Project" | "AI task"; taskDurationHours: number | null } | null;
};
type OverviewData = {
  rangeDays: number;
  visitors: { uniqueVisitors: number; pageViews: number; days: DayMetric[] };
  signups: { total: number; days: { day: string; signups: number }[] };
  onboarded: number;
  opportunities: {
    published: number;
    pendingApproval: number;
    recent: PublishedOpportunity[];
  };
  tasks: { active: number; completed: number; expired: number; available: number; timeline: TaskTimelineItem[] };
  payments: { available: false; message: string };
};

async function responseJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result;
}

function dayLabel(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function countdown(deadline: string, now: number) {
  const remaining = Math.max(0, new Date(deadline).getTime() - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function AdminOverviewPanel() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<OverviewData | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  const loadOverview = useCallback(async () => {
    const result = await responseJson(await fetch(`/api/admin/overview?days=${days}`, { cache: "no-store" }));
    setData(result);
    setSelectedDay((current) => current && result.visitors.days.some((item: DayMetric) => item.day === current)
      ? current
      : result.visitors.days.at(-1)?.day ?? "");
  }, [days]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await loadOverview();
        if (active) setError("");
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "The overview could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.clearInterval(clock);
    };
  }, [loadOverview]);

  const timelineByDay = useMemo(() => {
    const grouped = new Map<string, TaskTimelineItem[]>();
    for (const task of data?.tasks.timeline ?? []) {
      const key = new Date(task.assignedAt).toISOString().slice(0, 10);
      grouped.set(key, [...(grouped.get(key) ?? []), task]);
    }
    return grouped;
  }, [data]);

  if (loading) return <p className="admin-panel-lede" role="status">Loading workspace analytics…</p>;
  if (error) return <p className="form-error admin-alert" role="alert">{error}</p>;
  if (!data) return <p className="admin-empty">Analytics are not available.</p>;

  const selectedMetrics = data.visitors.days.find((item) => item.day === selectedDay);
  const selectedTasks = timelineByDay.get(selectedDay) ?? [];
  const maxVisitors = Math.max(1, ...data.visitors.days.map((item) => item.visitors));
  const nextDeadline = data.tasks.timeline
    .filter((task) => task.status === "in_progress")
    .sort((left, right) => new Date(left.deadlineAt).getTime() - new Date(right.deadlineAt).getTime())[0];

  return (
    <section className="admin-workspace-panel admin-overview">
      <div className="admin-overview-toolbar">
        <p className="admin-panel-lede">Live operational counts from recorded site visits, talent accounts, and timed contract-task assignments. Visitor tracking starts when enabled; no earlier visitor history is available.</p>
        <label>Reporting range<select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label>
      </div>
      <div className="admin-metric-grid">
        <article className="admin-metric-card"><span>Unique visitors</span><strong>{data.visitors.uniqueVisitors.toLocaleString()}</strong><small>{data.visitors.pageViews.toLocaleString()} page views · selected range</small></article>
        <article className="admin-metric-card"><span>Talent sign-ups</span><strong>{data.signups.total.toLocaleString()}</strong><small>New talent accounts · selected range</small></article>
        <article className="admin-metric-card"><span>Onboarded talent</span><strong>{data.onboarded.toLocaleString()}</strong><small>Completed talent profiles · all time</small></article>
        <article className="admin-metric-card"><span>Jobs posted</span><strong>{data.opportunities.published.toLocaleString()}</strong><small>{data.opportunities.pendingApproval} awaiting approval · all time</small></article>
        <article className="admin-metric-card"><span>Tasks in progress</span><strong>{data.tasks.active.toLocaleString()}</strong><small>{data.tasks.available} waiting for a best-fit assignment</small></article>
        <article className="admin-metric-card"><span>Tasks completed</span><strong>{data.tasks.completed.toLocaleString()}</strong><small>{data.tasks.expired} expired and returned to the pool</small></article>
        <article className="admin-metric-card"><span>Next task deadline</span><strong>{nextDeadline ? countdown(nextDeadline.deadlineAt, now) : "—"}</strong><small>{nextDeadline?.opportunity?.title ?? "No active task deadline"}</small></article>
      </div>
      <div className="admin-overview-columns">
        <section className="admin-records admin-posted-opportunities">
          <div className="admin-section-heading"><div><h2>All published jobs</h2><p>Every published opportunity, newest first. Previous jobs stay listed while they remain open.</p></div><Link href="/opportunities" target="_blank" rel="noreferrer noopener">View jobs ↗</Link></div>
          {data.opportunities.recent.length ? (
            <div className="admin-posted-opportunity-list">
              {data.opportunities.recent.map((opportunity) => (
                <article className="admin-posted-opportunity" key={opportunity.slug}>
                  <div><h3>{opportunity.title}</h3><p>{opportunity.type} · {opportunity.location} · Posted {new Date(opportunity.publishedAt).toLocaleDateString()}</p></div>
                  <Link href={`/opportunities/${opportunity.slug}`} target="_blank" rel="noreferrer noopener" aria-label={`View ${opportunity.title}`}>View ↗</Link>
                </article>
              ))}
            </div>
          ) : <p className="admin-empty">No jobs are published yet. Open a saved opportunity to publish it.</p>}
        </section>
        <section className="admin-records admin-traffic-card">
          <div className="admin-section-heading"><div><h2>Visitor activity</h2><p>Daily unique visitors; no personal identifiers are displayed.</p></div></div>
          <div className="admin-traffic-bars" role="img" aria-label="Daily unique visitors for the selected range">
            {data.visitors.days.map((item) => <div className="admin-traffic-day" key={item.day} title={`${dayLabel(item.day)}: ${item.visitors} visitors`}><div className="admin-traffic-bar-track"><span style={{ height: `${Math.max(3, (item.visitors / maxVisitors) * 100)}%` }} /></div><small>{new Date(`${item.day}T12:00:00Z`).getUTCDate()}</small></div>)}
          </div>
        </section>
        <section className="admin-finance-notice admin-payment-summary">
          <span className="status-pill">Not connected</span>
          <h2>Payment summary</h2>
          <p>{data.payments.message} Totals are intentionally not estimated or fabricated. Connect an approved ledger/provider before displaying received or paid amounts.</p>
        </section>
      </div>
      <section className="admin-records admin-calendar-card">
        <div className="admin-section-heading"><div><h2>Task calendar &amp; assignment timeline</h2><p>Select a date to view the day&apos;s sign-ups, visits, and task assignments. Select a task to inspect its schedule and progress.</p></div></div>
        <div className="admin-calendar-days" role="group" aria-label="Select a date">
          {data.visitors.days.map((item) => {
            const tasksForDay = timelineByDay.get(item.day)?.length ?? 0;
            return <button type="button" className={selectedDay === item.day ? "is-selected" : ""} aria-pressed={selectedDay === item.day} key={item.day} onClick={() => setSelectedDay(item.day)}><span>{dayLabel(item.day)}</span><strong>{tasksForDay ? `${tasksForDay} tasks` : "—"}</strong></button>;
          })}
        </div>
        {selectedMetrics && <div className="admin-day-summary"><span><strong>{selectedMetrics.visitors}</strong> unique visitors</span><span><strong>{selectedMetrics.pageViews}</strong> page views</span><span><strong>{selectedMetrics.signups}</strong> sign-ups</span><span><strong>{selectedTasks.length}</strong> task assignments</span></div>}
        <div className="admin-day-timeline">
          {selectedTasks.length ? selectedTasks.map((task) => (
            <details className="admin-timeline-item" key={task.id}>
              <summary><span className="admin-timeline-dot" /><span className="admin-timeline-time">{new Date(task.assignedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><span className="admin-timeline-title">{task.opportunity?.title ?? "Task details unavailable"}<small>{task.talentName} · {task.status.replaceAll("_", " ")}</small></span><span className="status-pill">{task.progress}%</span></summary>
              <div className="admin-timeline-detail">
                <p><strong>Assigned:</strong> {new Date(task.assignedAt).toLocaleString()}</p>
                <p><strong>Deadline:</strong> {new Date(task.deadlineAt).toLocaleString()}</p>
                {task.status === "in_progress" && <p><strong>Time remaining:</strong> {countdown(task.deadlineAt, now)}</p>}
                {task.completedAt && <p><strong>Completed:</strong> {new Date(task.completedAt).toLocaleString()}</p>}
                {task.expiredAt && <p><strong>Expired:</strong> {new Date(task.expiredAt).toLocaleString()} · returned to pool</p>}
                <div className="admin-task-progress-track" role="progressbar" aria-label={`Task progress for ${task.opportunity?.title ?? "task"}`} aria-valuenow={task.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${task.progress}%` }} /></div>
              </div>
            </details>
          )) : <p className="admin-empty">No task assignments were recorded on this date.</p>}
        </div>
      </section>
      <p className="admin-analytics-footnote">Visitor counts use a first-party random browser identifier, stored as a one-way hash with daily counts. Sign-ups count talent accounts created during the selected range; onboarded talent and task totals are all-time. Payment data is not connected.</p>
    </section>
  );
}
