import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Receipt,
  Clock,
  CalendarDays,
  Megaphone,
  LogOut,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { path: "/", label: "Beranda", icon: LayoutDashboard },
  { path: "/slip-gaji", label: "Slip Gaji", icon: Receipt },
  { path: "/absensi", label: "Absensi", icon: Clock },
  { path: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { path: "/pengumuman", label: "Info", icon: Megaphone },
];

function isActive(current: string, path: string): boolean {
  if (path === "/") return current === "/";
  return current === path || current.startsWith(path + "/");
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { employee, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              PK
            </div>
            <span className="font-semibold tracking-tight">Portal Kru</span>
          </Link>
          <div className="flex items-center gap-2">
            {employee && (
              <Link href="/profil" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-secondary/60 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {initials(employee.name)}
                </div>
                <div className="hidden sm:block text-right leading-tight">
                  <p className="text-sm font-medium">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.employeeCode}
                  </p>
                </div>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              aria-label="Keluar"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-5">
        {children}
      </main>

      {/* Bottom navigation (mobile-first) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid w-full max-w-2xl grid-cols-5">
          {NAV.map((item) => {
            const active = isActive(location, item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
