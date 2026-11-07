"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Brand } from "@/components/site-shell";

type TalentPortalHeaderProps = {
  active: "jobs" | "profile" | "tasks";
  name?: string | null;
};

export function TalentPortalHeader({ active, name }: TalentPortalHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";

  return (
    <header className="talent-portal-header">
      <div className="talent-portal-header-inner">
        <Brand />
        <nav className="talent-portal-nav" aria-label="Talent portal">
          <Link className={active === "jobs" ? "is-active" : ""} href="/talent/jobs">Jobs</Link>
          <Link className={active === "tasks" ? "is-active" : ""} href="/talent/tasks">My tasks</Link>
          <Link className={active === "profile" ? "is-active" : ""} href="/talent/profile">My profile</Link>
        </nav>
        <div className="talent-portal-actions">
          <details className="talent-account-menu" open={menuOpen} onToggle={(event) => setMenuOpen(event.currentTarget.open)}>
            <summary aria-label="Account menu">
              <span aria-hidden="true">{initials}</span>
            </summary>
            <div className="talent-account-menu-panel">
              <p>{name || "Your account"}</p>
              <Link href="/talent/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link href="/talent/jobs" onClick={() => setMenuOpen(false)}>Jobs</Link>
              <Link href="/talent/tasks" onClick={() => setMenuOpen(false)}>My tasks</Link>
              <button type="button" onClick={() => void signOut({ callbackUrl: "/" })}>Sign out</button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
