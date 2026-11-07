"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { adminRoleLabels, adminRoles, type AdminRole } from "@/lib/admin-roles";

type StaffRecord = {
  id: string;
  name: string;
  email: string;
  role: Exclude<AdminRole, "super_admin">;
  status: "active" | "disabled";
  lastLoginAt: string | null;
  createdAt: string;
};

type PendingInvitation = {
  id: string;
  email: string;
  role: Exclude<AdminRole, "super_admin">;
  expiresAt: string;
};

async function responseJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result;
}

export function AdminStaffPanel() {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<AdminRole, "super_admin">>("editorial");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStaff = useCallback(async () => {
    const result = await responseJson(await fetch("/api/admin/staff", { cache: "no-store" }));
    setStaff(result.staff);
    setInvitations(result.invitations);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/staff", { cache: "no-store" })
      .then(responseJson)
      .then((result) => {
        if (!active) return;
        setStaff(result.staff);
        setInvitations(result.invitations);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Staff access could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function inviteStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await responseJson(await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      }));
      const invitedEmail = email.trim();
      setName("");
      setEmail("");
      setNotice(`Invitation email sent to ${invitedEmail}. The activation link expires in 48 hours and can only be used once.`);
      try {
        await loadStaff();
      } catch (loadError) {
        const detail = loadError instanceof Error ? ` ${loadError.message}` : "";
        setError(`The invitation email was sent, but the staff list could not be refreshed. Reload the page to see its status.${detail}`);
      }
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "The staff invitation could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function setStaffStatus(member: StaffRecord) {
    setError("");
    setNotice("");
    try {
      await responseJson(await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: member.status === "active" ? "disabled" : "active" }),
      }));
      setNotice(`${member.status === "active" ? "Account disabled" : "Account re-enabled"} for ${member.email}.`);
      await loadStaff();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The staff account could not be updated.");
    }
  }

  return (
    <section className="admin-workspace-panel">
      <p className="admin-panel-lede">Send a one-time activation link by email to invite people to their department. Links expire after 48 hours and never grant Super Admin privileges.</p>
      {error && <p className="form-error admin-alert" role="alert">{error}</p>}
      {notice && <p className="form-success admin-alert" role="status">{notice}</p>}
      <div className="admin-columns">
        <form className="admin-editor" onSubmit={inviteStaff}>
          <h2>Invite a team member</h2>
          <label>Full name<input autoComplete="name" minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Work email<input type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Department role<select value={role} onChange={(event) => setRole(event.target.value as Exclude<AdminRole, "super_admin">)}>
            {adminRoles.map((item) => <option value={item} key={item}>{adminRoleLabels[item]}</option>)}
          </select></label>
          <button className="button button-primary" disabled={busy}>{busy ? "Sending invitation…" : "Send email invitation"}</button>
        </form>
        <div className="admin-records">
          <h2>Active and disabled staff <span>{staff.length}</span></h2>
          {staff.length ? staff.map((member) => (
            <article className="admin-record" key={member.id}>
              <div><span className={`status-pill status-${member.status}`}>{adminRoleLabels[member.role]} · {member.status}</span><h3>{member.name}</h3><p>{member.email}</p><small>{member.lastLoginAt ? `Last sign-in ${new Date(member.lastLoginAt).toLocaleDateString()}` : "Has not signed in yet"}</small></div>
              <div className="admin-record-actions"><button className={member.status === "active" ? "danger-action" : ""} type="button" onClick={() => void setStaffStatus(member)}>{member.status === "active" ? "Disable" : "Re-enable"}</button></div>
            </article>
          )) : <p className="admin-empty">No department accounts yet. The configured Super Admin is the initial administrator.</p>}
          {invitations.length > 0 && <div className="admin-pending-invitations"><h3>Pending invitations</h3>{invitations.map((invitation) => <p key={invitation.id}><strong>{invitation.email}</strong><span>{adminRoleLabels[invitation.role]} · expires {new Date(invitation.expiresAt).toLocaleString()}</span></p>)}</div>}
        </div>
      </div>
    </section>
  );
}
