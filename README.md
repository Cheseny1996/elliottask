# Elliottask

Elliottask is an original talent and project-work platform built with Next.js, React, TypeScript, and MongoDB. It supports opportunity listings, hiring and talent inquiries, editorial articles with search metadata, and a protected content administration area.

The visual language is independently authored. The public site uses original CSS illustrations and editorial content rather than copied third-party branding, photographs, or page text. Listings marked as examples are not confirmed jobs.

## Local development

1. Install Node.js 20.9 or newer.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env.local`.
4. Configure MongoDB and the session and administrator secrets described below.
5. Run `npm run dev`, then visit `http://localhost:3000`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string for articles, opportunities, and private requests |
| `SESSION_SECRET` | Random secret of at least 32 characters used to sign administrator sessions |
| `ADMIN_EMAIL` | Email address permitted to sign in to `/admin` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the administrator password; never store the raw password in source control |
| `RESEND_API_KEY` | Optional Resend API key for administrator-to-applicant email replies |
| `CONTACT_FROM_EMAIL` | Verified sender address for outgoing replies |
| `NEXT_PUBLIC_SITE_URL` | Canonical production origin, for example `https://elliottask.vercel.app` |

Generate a password hash with `npm run admin:hash`; the script prompts for the password without echoing it. Generate a session secret with `openssl rand -base64 32`. Keep `.env.local` and all production values in the deployment provider’s encrypted environment-variable settings.

MongoDB Atlas must allow connections from the deployment environment. Use a least-privilege database user and a dedicated database for Elliottask.

## Features

- Responsive marketing site and opportunity board for full-time, project, and AI-task engagements.
- Talent application and client hiring/quote request forms with validation, privacy acknowledgement, and a spam honeypot.
- MongoDB-backed article and opportunity CRUD from the protected `/admin` dashboard.
- Article drafts and publication status, URL slugs, canonical URLs, search titles/descriptions, keywords, Open Graph metadata, JSON-LD, `sitemap.xml`, and `robots.txt`.
- Private incoming requests with administrator-only review and status updates.
- Optional admin email replies through Resend; message records are saved only after the provider confirms delivery.
- Public requests and administrator operations fail explicitly when MongoDB or required secrets are not configured.

## Quality checks

```sh
npm run lint
npm run typecheck
npm run build
```

Set all production environment variables in Vercel before enabling public forms or administrator access. Replace or close illustrative sample opportunities before advertising the board as live hiring.
