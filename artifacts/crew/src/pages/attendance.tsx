import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AttendanceResponse, type AttendanceRecord } from "@/lib/api";
import { formatTime, formatDateOnly, todayIso } from "@/lib/format";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  PageHeader,
} from "@/components/states";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LogIn, LogOut, Loader2, CheckCircle2 } from "lucide-react";

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    present: "Hadir",
    late: "Terlambat",
    absent: "Tidak Hadir",
    leave: "Cuti",
  };
  return map[status] ?? status;
}

export default function Attendance() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["crew", "attendance"],
    queryFn: () => api<AttendanceResponse>("/attendance"),
  });

  const clockIn = useMutation({
    mutationFn: () => api<AttendanceRecord>("/attendance/clock-in", { method: "POST" }),
    onSuccess: () => {
      setError(null);
      toast({ title: "Berhasil clock-in", description: "Selamat bekerja!" });
      qc.invalidateQueries({ queryKey: ["crew", "attendance"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const clockOut = useMutation({
    mutationFn: () => api<AttendanceRecord>("/attendance/clock-out", { method: "POST" }),
    onSuccess: () => {
      setError(null);
      toast({ title: "Berhasil clock-out", description: "Sampai jumpa besok!" });
      qc.invalidateQueries({ queryKey: ["crew", "attendance"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(queryError as Error)?.message} />;

  const today = data?.today ?? null;
  const hasClockIn = !!today?.clockIn;
  const hasClockOut = !!today?.clockOut;
  const history = (data?.history ?? []).filter((r) => r.date !== todayIso());

  return (
    <div>
      <PageHeader title="Absensi" subtitle={formatDateOnly(todayIso())} />

      {/* Today's clock card */}
      <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-secondary p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
              <LogIn className="h-3.5 w-3.5" /> Masuk
            </div>
            <p className="text-2xl font-bold tabular-nums" data-testid="text-clockin">
              {formatTime(today?.clockIn ?? null)}
            </p>
          </div>
          <div className="rounded-xl bg-secondary p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" /> Pulang
            </div>
            <p className="text-2xl font-bold tabular-nums" data-testid="text-clockout">
              {formatTime(today?.clockOut ?? null)}
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-4">
          {!hasClockIn && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => clockIn.mutate()}
              disabled={clockIn.isPending}
              data-testid="button-clockin"
            >
              {clockIn.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Clock In
            </Button>
          )}
          {hasClockIn && !hasClockOut && (
            <Button
              className="w-full"
              size="lg"
              variant="destructive"
              onClick={() => clockOut.mutate()}
              disabled={clockOut.isPending}
              data-testid="button-clockout"
            >
              {clockOut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Clock Out
            </Button>
          )}
          {hasClockIn && hasClockOut && (
            <div className="flex items-center justify-center gap-2 rounded-md bg-primary/10 py-3 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Absensi hari ini selesai
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <h2 className="mb-2 mt-6 px-1 text-sm font-semibold text-muted-foreground">
        Riwayat Absensi
      </h2>
      {history.length === 0 ? (
        <EmptyState message="Belum ada riwayat absensi." />
      ) : (
        <div className="space-y-2">
          {history.map((r) => (
            <div
              key={r.id}
              data-testid={`attendance-${r.id}`}
              className="flex items-center justify-between rounded-xl border border-card-border bg-card p-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{formatDateOnly(r.date)}</p>
                <span className="text-xs text-muted-foreground">
                  {statusLabel(r.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm tabular-nums">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <LogIn className="h-3.5 w-3.5" />
                  {formatTime(r.clockIn)}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <LogOut className="h-3.5 w-3.5" />
                  {formatTime(r.clockOut)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
