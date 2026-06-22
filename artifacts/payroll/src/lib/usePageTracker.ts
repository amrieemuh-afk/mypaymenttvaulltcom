import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export function usePageTracker() {
  const [location] = useLocation();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (lastTracked.current === location) return;
    lastTracked.current = location;

    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location,
        referrer: document.referrer || "",
      }),
    }).catch(() => {});
  }, [location]);
}
