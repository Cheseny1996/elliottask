import Link from "next/link";

const footerLinks = [
  { href: "/opportunities", label: "Find opportunities" },
  { href: "/hire", label: "Hire a specialist" },
  { href: "/articles", label: "Field notes" },
  { href: "/privacy", label: "Privacy" },
  { href: "/admin", label: "Admin" },
];

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link className={`brand${light ? " brand-light" : ""}`} href="/" aria-label="elliottask home">
      <BrandMark />
      <span>elliottask</span>
    </Link>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand light />
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/opportunities">Find work</Link>
          <Link href="/for-talent">Careers</Link>
          <details className="company-menu">
            <summary>For experts <span aria-hidden="true">⌄</span></summary>
            <div className="company-menu-panel">
              <Link href="/for-talent">Join elliottask</Link>
              <Link href="/talent/auth?mode=signup">Create your profile</Link>
              <Link href="/talent/auth?mode=login">Talent sign in</Link>
            </div>
          </details>
          <details className="company-menu">
            <summary>For companies <span aria-hidden="true">⌄</span></summary>
            <div className="company-menu-panel">
              <Link href="/hire?type=team">Hire a team</Link>
              <Link href="/hire?type=developer">Hire a developer</Link>
            </div>
          </details>
          <Link href="/articles">Insights</Link>
        </nav>
        <div className="header-actions">
          <Link className="header-login" href="/talent/auth?mode=login">Sign in</Link>
          <Link className="button button-outline button-small" href="/hire">
            Hire talent <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Brand light />
          <p>Thoughtful people. Useful work. Better outcomes.</p>
        </div>
        <div className="footer-links">
          {footerLinks.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} elliottask</span>
        <span>Remote-first talent and project work</span>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
