"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { AdminRole } from "@/lib/admin-roles";
import { opportunityTypeLabels, type OpportunityType } from "@/lib/opportunity-categories";

type TalentProfile = {
  headline?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  yearsExperience?: string;
  workPreference?: string;
  availability?: string;
  completed?: boolean;
};

type Candidate = { id: string; name: string; profile: TalentProfile };
type Opportunity = { id: string; title: string; type: OpportunityType; location: string; skills: string[] };
type ProjectManager = { id: string; name: string; email: string };
type MatchRecord = {
  id: string;
  status: "shortlisted" | "inviting" | "invited";
  notes: string;
  invitedAt: string | null;
  opportunity: { id: string; title: string; type: OpportunityType; status: string } | null;
  talent: { id: string; name: string; profile: TalentProfile } | null;
  projectManager: { id: string; name: string } | null;
};

async function responseJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result;
}

export function AdminMatchingPanel({ role }: { role: AdminRole }) {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [talentUserId, setTalentUserId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [projectManagerStaffId, setProjectManagerStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canCreateMatches = role === "matching" || role === "super_admin";
  const canInvite = role === "project_manager" || role === "super_admin";

  const loadMatches = useCallback(async () => {
    const result = await responseJson(await fetch("/api/admin/matches", { cache: "no-store" }));
    setMatches(result.matches);
    setCandidates(result.candidates ?? []);
    setOpportunities(result.opportunities ?? []);
    setProjectManagers(result.projectManagers ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/matches", { cache: "no-store" })
      .then(responseJson)
      .then((result) => {
        if (!active) return;
        setMatches(result.matches);
        setCandidates(result.candidates ?? []);
        setOpportunities(result.opportunities ?? []);
        setProjectManagers(result.projectManagers ?? []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "The matching workspace could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function createMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await responseJson(await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ talentUserId, opportunityId, projectManagerStaffId, notes }),
      }));
      setTalentUserId("");
      setOpportunityId("");
      setProjectManagerStaffId("");
      setNotes("");
      setNotice("Talent has been shortlisted and assigned to the selected Project Manager.");
      await loadMatches();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The shortlist could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function sendInvitation(match: MatchRecord) {
    setSendingId(match.id);
    setError("");
    setNotice("");
    try {
      await responseJson(await fetch(`/api/admin/matches/${match.id}/invite`, { method: "POST" }));
      setNotice(`Invitation sent to ${match.talent?.name ?? "the matched talent"}.`);
      await loadMatches();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "The invitation could not be sent.");
      await loadMatches();
    } finally {
      setSendingId("");
    }
  }

  return (
    <section className="admin-workspace-panel">
      <p className="admin-panel-lede">Match talent to published opportunities, assign each shortlist to an active Project Manager, then let that manager send a personal invitation. Shortlisting never sends a message.</p>
      {error && <p className="form-error admin-alert" role="alert">{error}</p>}
      {notice && <p className="form-success admin-alert" role="status">{notice}</p>}
      {canCreateMatches && (
        <div className="admin-columns">
          <form className="admin-editor" onSubmit={createMatch}>
            <h2>Create a talent shortlist</h2>
            <label>Published opportunity<select required value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)}><option value="">Select an open opportunity</option>{opportunities.map((item) => <option value={item.id} key={item.id}>{item.title} · {opportunityTypeLabels[item.type]}</option>)}</select></label>
            <label>Talent profile<select required value={talentUserId} onChange={(event) => setTalentUserId(event.target.value)}><option value="">Select talent</option>{candidates.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name}{candidate.profile.headline ? ` · ${candidate.profile.headline}` : ""}</option>)}</select></label>
            <label>Assigned Project Manager<select required value={projectManagerStaffId} onChange={(event) => setProjectManagerStaffId(event.target.value)}><option value="">Select an active manager</option>{projectManagers.map((manager) => <option value={manager.id} key={manager.id}>{manager.name}</option>)}</select></label>
            <label>Internal match notes<textarea maxLength={1000} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Explain the relevant skills and experience for the assigned manager." /></label>
            <button className="button button-primary" disabled={busy || !candidates.length || !opportunities.length || !projectManagers.length}>{busy ? "Saving shortlist…" : "Create shortlist"}</button>
            {!candidates.length && <p className="admin-empty">No talent profiles are available yet.</p>}
            {!opportunities.length && <p className="admin-empty">No open opportunities are available to match.</p>}
            {!projectManagers.length && <p className="admin-empty">Invite an active Project Manager before creating a shortlist.</p>}
          </form>
          <div className="admin-records"><h2>Matching guidance</h2><p className="admin-panel-lede">Review the candidate&apos;s profile and the opportunity requirements before shortlisting. Keep notes relevant to the role; do not include sensitive personal information.</p><div className="admin-matching-summary"><strong>{candidates.length}</strong><span>talent profiles</span><strong>{opportunities.length}</strong><span>open opportunities</span><strong>{projectManagers.length}</strong><span>active Project Managers</span></div></div>
        </div>
      )}
      <div className="admin-records admin-match-list">
        <h2>{canCreateMatches ? "Shortlists and invitations" : "Your assigned matches"} <span>{matches.length}</span></h2>
        {matches.length ? matches.map((match) => (
          <article className="admin-match-record" key={match.id}>
            <div className="admin-match-overview">
              <span className={`status-pill status-${match.status}`}>{match.status}</span>
              <h3>{match.talent?.name ?? "Talent profile unavailable"}</h3>
              {match.talent?.profile.headline && <p>{match.talent.profile.headline}</p>}
              <p>{match.talent?.profile.location || "Location not provided"}{match.talent?.profile.workPreference ? ` · ${match.talent.profile.workPreference}` : ""}</p>
              {match.talent?.profile.skills?.length ? <div className="admin-skill-list">{match.talent.profile.skills.slice(0, 8).map((skill) => <span key={skill}>{skill}</span>)}</div> : null}
            </div>
            <div className="admin-match-details">
              <strong>{match.opportunity?.title ?? "Opportunity unavailable"}</strong>
              {match.opportunity && <p>{opportunityTypeLabels[match.opportunity.type]} · {match.opportunity.status}</p>}
              <p>Project Manager: {match.projectManager?.name ?? "Not assigned"}</p>
              {match.notes && <p className="admin-match-notes">{match.notes}</p>}
              {match.invitedAt && <small>Invitation sent {new Date(match.invitedAt).toLocaleString()}</small>}
              {canInvite && match.status === "shortlisted" && <button className="button button-primary button-small" disabled={sendingId === match.id || match.opportunity?.status !== "Open"} onClick={() => void sendInvitation(match)}>{sendingId === match.id ? "Sending invitation…" : "Send talent invitation"}</button>}
              {canInvite && match.status === "shortlisted" && match.opportunity?.status !== "Open" && <small>This opportunity is no longer open; the invitation cannot be sent.</small>}
            </div>
          </article>
        )) : <p className="admin-empty">{canCreateMatches ? "No talent has been shortlisted yet." : "No matches have been assigned to you yet."}</p>}
      </div>
    </section>
  );
}
