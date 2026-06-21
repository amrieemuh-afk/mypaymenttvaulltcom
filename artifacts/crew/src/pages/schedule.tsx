import { useQuery } from "@tanstack/react-query";
import { api, type WorkSchedule } from "@/lib/api";
import { formatDateOnly, todayIso } from "@/lib/format";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  PageHeader,
} from "@/components/states";
import { Clock, MapPin, StickyNote } from "lucide-react";

export default function Schedule() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["crew", "schedules"],
    queryFn: () => api<WorkSchedule[]>("/schedules"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error)?.message} />;
  if (!data || data.length === 0)
    return (
      <>
        <PageHeader title="Jadwal Kerja" />
        <EmptyState message="Belum ada jadwal kerja." />
      </>
    );

  const today = todayIso();

  return (
    <div>
      <PageHeader title="Jadwal Kerja" subtitle={`${data.length} jadwal terjadwal`} />
      <div className="space-y-2.5">
        {data.map((s) => {
          const isToday = s.date === today;
          return (
            <div
              key={s.id}
              data-testid={`schedule-${s.id}`}
              className={`rounded-xl border bg-card p-4 shadow-sm ${
                isToday ? "border-primary ring-1 ring-primary/30" : "border-card-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{s.title}</p>
                    {isToday && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Hari ini
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatDateOnly(s.date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-sm font-medium tabular-nums">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {s.shift}
                </div>
              </div>
              {(s.location || s.notes) && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {s.location && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {s.location}
                    </div>
                  )}
                  {s.notes && (
                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{s.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
