import { useEffect, useState } from "react";
import { useListNotificationLog, getListNotificationLogQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "notifikasi_last_seen_at";

function getLastSeenAt(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString();
}

export function useNotificationBadge() {
  const [since, setSince] = useState<string>(() => getLastSeenAt());
  const queryClient = useQueryClient();

  const params = { since };
  const { data } = useListNotificationLog(params, {
    query: {
      queryKey: getListNotificationLogQueryKey(params),
      refetchInterval: 60_000,
    },
  });

  const badgeCount = data?.length ?? 0;

  const markAsSeen = () => {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, now);
    setSince(now);
    queryClient.invalidateQueries({ queryKey: getListNotificationLogQueryKey({ since: now }) });
  };

  useEffect(() => {
    setSince(getLastSeenAt());
  }, []);

  return { badgeCount, markAsSeen };
}
