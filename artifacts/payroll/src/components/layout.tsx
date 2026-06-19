import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  ReceiptText,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/karyawan", label: "Employees", icon: Users },
  { href: "/departemen", label: "Departments", icon: Building2 },
  { href: "/penggajian", label: "Payroll", icon: CalendarDays },
  { href: "/slip-gaji", label: "Payslips", icon: ReceiptText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const currentPage = navItems.find((n) => isActive(n.href))?.label ?? "Dashboard";

  return (
    <div className="min-h-screen flex" style={{ background: "#f4f5f7" }}>

      {/* ═══ SIDEBAR ═══ */}
      <>
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col"
          style={{ width: 230, background: "#0c0c0c", minHeight: "100vh", flexShrink: 0 }}
        >
          {/* Brand */}
          <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #222" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "#fff", fontWeight: 600, userSelect: "none", textTransform: "uppercase" }}>
              MYPAYMENTVAULT
            </span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      marginBottom: 2,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      color: active ? "#fff" : "#888",
                      background: active ? "#222" : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = "#ccc"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = "#888"; }}
                  >
                    <Icon size={15} />
                    {label}
                    {active && <ChevronRight size={13} style={{ marginLeft: "auto", opacity: 0.5 }} />}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid #222" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "#222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <User size={14} color="#888" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#ccc", margin: 0, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.username}
                </p>
                <p style={{ fontSize: 11, color: "#555", margin: 0 }}>Administrator</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#555", borderRadius: 4 }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ccc")}
                onMouseLeave={e => (e.currentTarget.style.color = "#555")}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className="fixed top-0 left-0 bottom-0 z-50 flex flex-col md:hidden"
          style={{
            width: 220,
            background: "#0c0c0c",
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
          }}
        >
          <div style={{ padding: "18px 16px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "#fff", fontWeight: 600, textTransform: "uppercase" }}>
              MYPAYMENTVAULT
            </span>
            <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}>
              <X size={18} />
            </button>
          </div>
          <nav style={{ flex: 1, padding: "10px 8px" }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href}>
                  <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", marginBottom: 2, borderRadius: 6,
                      fontSize: 13, fontWeight: active ? 500 : 400,
                      color: active ? "#fff" : "#888",
                      background: active ? "#222" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={15} />
                    {label}
                  </div>
                </Link>
              );
            })}
          </nav>
          <div style={{ padding: "12px 8px", borderTop: "1px solid #222" }}>
            <button
              onClick={logout}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 12px", borderRadius: 6,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: "#888",
              }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </aside>
      </>

      {/* ═══ MAIN ═══ */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <header style={{
          height: 56, background: "#fff", borderBottom: "1px solid #e8e8e8",
          display: "flex", alignItems: "center", padding: "0 24px",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#555" }}
            >
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{currentPage}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#111", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 13, color: "#444", textTransform: "capitalize" }} className="hidden md:inline">
              {user?.username}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto" }} className="main-content">
          <style>{`
            .main-content { padding: 20px 16px; }
            @media (min-width: 640px) { .main-content { padding: 28px 24px; } }
          `}</style>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
