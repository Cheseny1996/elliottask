import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://elliottask.vercel.app"),
  title: {
    default: "Elliottask | Thoughtful Technology Talent and Project Work",
    template: "%s | Elliottask",
  },
  description:
    "A people-first network connecting technology teams with specialists for full-time roles, focused projects, and AI evaluation work.",
  applicationName: "Elliottask",
  openGraph: {
    type: "website",
    siteName: "Elliottask",
    title: "Elliottask | Thoughtful Technology Talent and Project Work",
    description:
      "Find a long-term role, take on a focused project, or bring in the right technology specialist.",
  },
  twitter: {
    card: "summary",
    title: "Elliottask | Thoughtful Technology Talent and Project Work",
    description:
      "A people-first network for technology teams and independent talent.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
