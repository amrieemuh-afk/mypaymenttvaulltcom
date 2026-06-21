import { useQuery } from "@tanstack/react-query";
import { api, type Announcement } from "@/lib/api";
import { formatPublished } from "@/lib/format";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  PageHeader,
} from "@/components/states";
import { Megaphone, AlertTriangle, Info } from "lucide-react";

function categoryStyle(category: string): {
  label: string;
  className: string;
  icon: typeof Info;
} {
  switch (category) {
    case "penting":
      return {
        label: "Penting",
        className: "bg-destructive/10 text-destructive",
        icon: AlertTriangle,
      };
    default:
      return {
        label: "Info",
        className: "bg-primary/10 text-primary",
        icon: Info,
      };
  }
}

export default function Announcements() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["crew", "announcements"],
    queryFn: () => api<Announcement[]>("/announcements"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error)?.message} />;
  if (!data || data.length === 0)
    return (
      <>
        <PageHeader title="Pengumuman" />
        <EmptyState message="Belum ada pengumuman." />
      </>
    );

  return (
    <div>
      <PageHeader title="Pengumuman" subtitle={`${data.length} pengumuman`} />
      <div className="space-y-3">
        {data.map((a) => {
          const cat = categoryStyle(a.category);
          const Icon = cat.icon;
          return (
            <article
              key={a.id}
              data-testid={`announcement-${a.id}`}
              className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.className}`}
                >
                  <Icon className="h-3 w-3" />
                  {cat.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatPublished(a.publishedAt)}
                </span>
              </div>
              <h2 className="flex items-start gap-2 font-semibold">
                <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {a.title}
              </h2>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {a.body}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
