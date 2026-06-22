import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function getStoredUsername(): string | null {
  try {
    const raw = localStorage.getItem("gajipro_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { username?: string };
    return parsed?.username ?? null;
  } catch { return null; }
}

export function usePageTracker() {
  const [location] = useLocation();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (lastTracked.current === location) return;
    lastTracked.current = location;

    const username = getStoredUsername();

    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location,
        referrer: document.referrer || "",
        username: username ?? undefined,
      }),
    }).catch(() => {});
  }, [location]);
}
