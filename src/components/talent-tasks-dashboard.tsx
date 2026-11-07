"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { opportunityTypeLabels } from "@/lib/opportunity-categories";

type TaskItem = {
  id: string;
  status: "in_progress" | "completed" | "expired";
  progress: number;
  assignedAt: string;
  deadlineAt: string;
  completedAt: string | null;
  expiredAt: string | null;
  opportunity: {
    title: string;
    slug: string;
    type: "Project" | "AI task" | "Full-time";
    summary: string;
    description: string;
    skills: string[];
    compensation: string;
    taskDurationHours: number | null;
  } | null;
};

async function responseJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result;
}

function countdown(deadline: string, now: number) {
  const remaining = Math.max(0, new Date(deadline).getTime() - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export function TalentTasksDashboard() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [progressDrafts, setProgressDrafts] = useState<Record<string, number>>({});
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const result = await responseJson(await fetch("/api/talent/tasks", { cache: "no-store" }));
    setTasks(result.tasks);
    setProgressDrafts((current) => Object.fromEntries(
      result.tasks.map((task: TaskItem) => [task.id, Math.max(current[task.id] ?? task.progress, task.progress)]),
    ));
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await refresh();
        if (active) setError("");
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Your tasks could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const poll = window.setInterval(() => void load(), 30_000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [refresh]);

  async function saveProgress(task: TaskItem, progress: number) {
    setSavingId(task.id);
    setError("");
    setNotice("");
    try {
      const result = await responseJson(await fetch(`/api/talent/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ progress }),
      }));
      setNotice(result.status === "completed" ? `${task.opportunity?.title ?? "Task"} completed. Nice work!` : "Task progress updated.");
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Task progress could not be saved.");
      await refresh();
    } finally {
      setSavingId("");
    }
  }

  const activeTasks = tasks.filter((task) => task.status === "in_progress");
  const pastTasks = tasks.filter((task) => task.status !== "in_progress");

  if (loading) return <p className="talent-portal-status" role="status">Loading your tasks…</p>;

  return (
    <section className="talent-tasks-dashboard" aria-label="Assigned timed tasks">
      {error && <p className="talent-portal-error" role="alert">{error}</p>}
      {notice && <p className="talent-portal-status" role="status">{notice}</p>}
      <div className="talent-tasks-summary">
        <div><strong>{activeTasks.length}</strong><span>in progress</span></div>
        <div><strong>{pastTasks.filter((task) => task.status === "completed").length}</strong><span>completed</span></div>
        <div><strong>{activeTasks.length ? Math.min(...activeTasks.map((task) => Math.max(0, new Date(task.deadlineAt).getTime() - now))) > 0 ? countdown(activeTasks.reduce((earliest, task) => new Date(task.deadlineAt) < new Date(earliest) ? task.deadlineAt : earliest, activeTasks[0].deadlineAt), now) : "Due now" : "—"}</strong><span>next deadline</span></div>
      </div>

      <div className="talent-task-list">
        <h2>Active tasks <span>{activeTasks.length}</span></h2>
        {activeTasks.length ? activeTasks.map((task) => {
          const opportunity = task.opportunity;
          const progress = progressDrafts[task.id] ?? task.progress;
          const remaining = new Date(task.deadlineAt).getTime() - now;
          return (
            <article className="talent-task-card" key={task.id}>
              <div className="talent-task-card-heading">
                <span className="talent-task-type">{opportunity ? opportunityTypeLabels[opportunity.type] : "Contract task"}</span>
                <span className={remaining < 60 * 60 * 1000 ? "talent-task-countdown is-urgent" : "talent-task-countdown"} aria-live="off">
                  {remaining > 0 ? countdown(task.deadlineAt, now) : "Deadline reached"}
                </span>
              </div>
              <h3>{opportunity?.title ?? "Opportunity details unavailable"}</h3>
              <p>{opportunity?.summary}</p>
              <div className="talent-task-meta">
                <span>Assigned {new Date(task.assignedAt).toLocaleString()}</span>
                <span>Due {new Date(task.deadlineAt).toLocaleString()}</span>
              </div>
              <div className="talent-task-progress-label"><span>Progress</span><strong>{task.progress}% saved</strong></div>
              <div className="talent-task-progress-track" role="progressbar" aria-label={`Progress on ${opportunity?.title ?? "task"}`} aria-valuenow={task.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${task.progress}%` }} /></div>
              <label className="talent-task-progress-input">Update progress <output>{progress}%</output><input type="range" min={task.progress} max={100} step={5} value={progress} onChange={(event) => setProgressDrafts((current) => ({ ...current, [task.id]: Number(event.target.value) }))} /></label>
              <div className="talent-task-actions">
                {opportunity && <Link href={`/talent/jobs/${opportunity.slug}`}>Review task details</Link>}
                <button className="talent-portal-primary" type="button" disabled={savingId === task.id || progress === task.progress} onClick={() => void saveProgress(task, progress)}>{savingId === task.id ? "Saving…" : progress === 100 ? "Mark completed" : "Save progress"}</button>
              </div>
            </article>
          );
        }) : <div className="talent-tasks-empty"><h3>No active tasks yet</h3><p>We’ll automatically match published contract tasks to your completed profile and work preferences. Keep your skills and availability up to date to improve your matches.</p><Link className="talent-portal-secondary" href="/talent/profile/edit">Update my profile</Link><Link className="talent-portal-secondary" href="/talent/jobs">Browse opportunities</Link></div>}
      </div>

      {pastTasks.length > 0 && <div className="talent-task-list talent-task-history">
        <h2>Task history <span>{pastTasks.length}</span></h2>
        {pastTasks.map((task) => (
          <article className="talent-task-history-item" key={task.id}>
            <div><span className={`status-pill status-${task.status.replaceAll("_", "-")}`}>{task.status.replaceAll("_", " ")}</span><h3>{task.opportunity?.title ?? "Opportunity details unavailable"}</h3><p>{task.status === "completed" ? `Completed ${task.completedAt ? new Date(task.completedAt).toLocaleString() : ""}` : `Deadline passed ${task.expiredAt ? new Date(task.expiredAt).toLocaleString() : ""}. The task returned to the available pool.`}</p></div>
            <strong>{task.progress}%</strong>
          </article>
        ))}
      </div>}
    </section>
  );
}
