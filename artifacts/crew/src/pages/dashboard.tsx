import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  api,
  type Profile,
  type AttendanceResponse,
  type WorkSchedule,
  type PayslipSummary,
  type Announcement,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatCurrency,
  periodLabel,
  formatTime,
  todayIso,
  formatDateOnly,
  formatPublished,
} from "@/lib/format";
import { LoadingState, ErrorState } from "@/components/states";
import {
  Receipt,
  Clock,
  CalendarDays,
  Megaphone,
  ChevronRight,
  LogIn,
  LogOut,
} from "lucide-react";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function Dashboard() {
  const { employee } = useAuth();

  const profileQ = useQuery({
    queryKey: ["crew", "me"],
    queryFn: () => api<Profile>("/me"),
  });
  const attendanceQ = useQuery({
    queryKey: ["crew", "attendance"],
    queryFn: () => api<AttendanceResponse>("/attendance"),
  });
  const schedulesQ = useQuery({
    queryKey: ["crew", "schedules"],
    queryFn: () => api<WorkSchedule[]>("/schedules"),
  });
  const payslipsQ = useQuery({
    queryKey: ["crew", "payslips"],
    queryFn: () => api<PayslipSummary[]>("/payslips"),
  });
  const announcementsQ = useQuery({
    queryKey: ["crew", "announcements"],
    queryFn: () => api<Announcement[]>("/announcements"),
  });

  if (profileQ.isLoading) return <LoadingState />;
  if (profileQ.isError) return <ErrorState message={(profileQ.error as Error)?.message} />;

  const today = todayIso();
  const todayAtt = attendanceQ.data?.today ?? null;
  const upcoming = (schedulesQ.data ?? [])
    .filter((s) => s.date >= today)
    .slice(0, 1)[0];
  const latestPayslip = payslipsQ.data?.[0];
  const latestAnnouncement = announcementsQ.data?.[0];

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground">{greeting()},</p>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-greeting-name">
          {employee?.name ?? profileQ.data?.name}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {profileQ.data?.position}
          {profileQ.data?.departmentName ? ` · ${profileQ.data.departmentName}` : ""}
        </p>
      </div>

      {/* Attendance card */}
      <Link
        href="/absensi"
        className="block rounded-2xl border border-card-border bg-card p-5 shadow-sm hover-elevate"
        data-testid="card-attendance"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Absensi Hari Ini</p>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <LogIn className="h-4 w-4 text-primary" />
                <span className="text-lg font-semibold tabular-nums">
                  {formatTime(todayAtt?.clockIn ?? null)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <LogOut className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold tabular-nums">
                  {formatTime(todayAtt?.clockOut ?? null)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
        </div>
      </Link>

      {/* Latest payslip */}
      {latestPayslip && (
        <Link
          href={`/slip-gaji/${latestPayslip.id}`}
          className="block rounded-2xl border border-card-border bg-card p-5 shadow-sm hover-elevate"
          data-testid="card-latest-payslip"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Slip Gaji Terbaru
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {periodLabel(latestPayslip.periodMonth, latestPayslip.periodYear)}
              </p>
              <p className="mt-2 text-xl font-bold text-primary tabular-nums">
                {formatCurrency(latestPayslip.netSalary)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Link>
      )}

      {/* Upcoming schedule */}
      {upcoming && (
        <Link
          href="/jadwal"
          className="block rounded-2xl border border-card-border bg-card p-5 shadow-sm hover-elevate"
          data-testid="card-upcoming-schedule"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Jadwal Berikutnya
              </p>
              <p className="mt-1 truncate text-base font-semibold">
                {upcoming.title} · {upcoming.shift}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateOnly(upcoming.date)}
                {upcoming.location ? ` · ${upcoming.location}` : ""}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Link>
      )}

      {/* Latest announcement */}
      {latestAnnouncement && (
        <Link
          href="/pengumuman"
          className="block rounded-2xl border border-card-border bg-card p-5 shadow-sm hover-elevate"
          data-testid="card-latest-announcement"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Pengumuman Terbaru
              </p>
              <p className="mt-1 truncate text-base font-semibold">
                {latestAnnouncement.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {latestAnnouncement.body}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatPublished(latestAnnouncement.publishedAt)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Link>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <QuickLink href="/slip-gaji" icon={Receipt} label="Slip Gaji" />
        <QuickLink href="/jadwal" icon={CalendarDays} label="Jadwal Kerja" />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Receipt;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3.5 shadow-sm hover-elevate"
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
