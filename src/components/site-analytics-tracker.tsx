"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const visitorStorageKey = "elliottask-visitor-id";

function getVisitorId() {
  try {
    let visitorId = window.localStorage.getItem(visitorStorageKey);
    if (!visitorId) {
      visitorId = window.crypto.randomUUID();
      window.localStorage.setItem(visitorStorageKey, visitorId);
    }
    return visitorId;
  } catch {
    return window.crypto.randomUUID();
  }
}

export function SiteAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api/")) return;
    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId(), path: pathname }),
      keepalive: true,
    }).then((response) => {
      if (!response.ok) console.warn("elliottask visitor analytics could not record this page view.");
    }).catch((error: unknown) => {
      console.warn("elliottask visitor analytics request failed:", error);
    });
  }, [pathname]);

  return null;
}
