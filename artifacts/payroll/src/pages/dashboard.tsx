import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetPayrollByDepartment,
  getGetPayrollByDepartmentQueryKey,
  useGetRecentPayslips,
  getGetRecentPayslipsQueryKey,
} from "@workspace/api-client-react";
import { formatRupiah } from "@/lib/format";
import { Users, UserCheck, Banknote, Clock, TrendingUp, ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "#111",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ebebeb",
        borderRadius: 10,
        padding: "20px 22px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: accent + "12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={accent} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px", fontWeight: 400 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 2px", lineHeight: 1.1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const [countdown, setCountdown] = useState(3);

  /* Auto-logout setelah 3 detik */
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          logout();
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [logout, navigate]);

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const { data: payrollByDept, isLoading: isLoadingChart } = useGetPayrollByDepartment({
    query: { queryKey: getGetPayrollByDepartmentQueryKey() },
  });
  const { data: recentPayslips, isLoading: isLoadingRecent } = useGetRecentPayslips({
    query: { queryKey: getGetRecentPayslipsQueryKey() },
  });

  if (isLoadingSummary || !summary) {
    return (
      <Layout>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 96, borderRadius: 10, background: "#fff", border: "1px solid #ebebeb" }} className="animate-pulse" />
          ))}
        </div>
      </Layout>
    );
  }

  const periodStatus =
    summary.currentPeriodStatus === "paid"
      ? "Paid"
      : summary.currentPeriodStatus === "processed"
      ? "Processed"
      : summary.currentPeriodStatus === "draft"
      ? "Draft"
      : "No period";

  return (
    <Layout>
      {/* ── Greeting ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: "0 0 4px" }}>
          Overview
        </h1>
        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          Current payroll period status: <strong style={{ color: "#111" }}>{periodStatus}</strong>
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Payroll This Month"
          value={formatRupiah(summary.totalPayrollThisMonth)}
          sub="Current period"
          icon={Banknote}
          accent="#111"
        />
        <StatCard
          label="Total Employees"
          value={summary.totalEmployees}
          sub={`${summary.totalDepartments} department${summary.totalDepartments !== 1 ? "s" : ""}`}
          icon={Users}
          accent="#2563eb"
        />
        <StatCard
          label="Active Employees"
          value={summary.activeEmployees}
          sub={`${Math.round((summary.activeEmployees / Math.max(summary.totalEmployees, 1)) * 100)}% of total`}
          icon={UserCheck}
          accent="#16a34a"
        />
        <StatCard
          label="Pending Payslips"
          value={summary.pendingPayslips}
          sub="Awaiting processing"
          icon={Clock}
          accent="#d97706"
        />
      </div>

      {/* ── Charts + Recent ── */}
      <div className="dashboard-charts-grid" style={{ display: "grid", gap: 16, alignItems: "start" }}>
        <style>{`
          .dashboard-charts-grid { grid-template-columns: 1fr; }
          @media (min-width: 900px) { .dashboard-charts-grid { grid-template-columns: 1fr 380px; } }
        `}</style>

        {/* Bar chart */}
        <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: 10, padding: "20px 20px 14px" }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 2px" }}>Payroll by Department</p>
            <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>Total payout this month per department</p>
          </div>
          {isLoadingChart ? (
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, color: "#bbb" }}>Loading chart…</span>
            </div>
          ) : !payrollByDept?.length ? (
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <TrendingUp size={32} color="#ddd" />
                <p style={{ fontSize: 13, color: "#bbb", marginTop: 8 }}>No payroll data yet.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={payrollByDept} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="departmentName"
                  stroke="#ccc"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#ccc"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000000}M`}
                />
                <Tooltip
                  formatter={(value: number) => [formatRupiah(value), "Total"]}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e8e8e8" }}
                />
                <Bar dataKey="totalPayroll" fill="#111" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent payslips */}
        <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: 10, padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 2px" }}>Recent Payslips</p>
              <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>Latest generated payslips</p>
            </div>
            <button
              onClick={() => navigate("/slip-gaji")}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#555", background: "none", border: "none", cursor: "pointer" }}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {isLoadingRecent ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#bbb", fontSize: 13 }}>Loading…</div>
          ) : !recentPayslips?.length ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <ReceiptText size={28} color="#ddd" />
              <p style={{ fontSize: 13, color: "#bbb", marginTop: 8 }}>No payslips yet.</p>
            </div>
          ) : (
            <div>
              {recentPayslips.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: idx < recentPayslips.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#111", margin: "0 0 2px" }}>{p.employeeName}</p>
                    <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>
                      {p.departmentName} · {p.periodMonth}/{p.periodYear}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "0 0 3px" }}>{formatRupiah(p.netSalary)}</p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        padding: "2px 7px",
                        borderRadius: 20,
                        background: p.status === "paid" ? "#111" : "#f0f0f0",
                        color: p.status === "paid" ? "#fff" : "#888",
                      }}
                    >
                      {p.status === "paid" ? "Paid" : "Draft"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Add Employee", href: "/karyawan/tambah" },
          { label: "Manage Payroll", href: "/penggajian" },
          { label: "View Payslips", href: "/slip-gaji" },
        ].map(({ label, href }) => (
          <button
            key={href}
            onClick={() => navigate(href)}
            style={{
              padding: "9px 18px",
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 7,
              fontSize: 13,
              color: "#333",
              cursor: "pointer",
              fontWeight: 400,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#111"; (e.currentTarget as HTMLButtonElement).style.color = "#111"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ddd"; (e.currentTarget as HTMLButtonElement).style.color = "#333"; }}
          >
            {label} <ArrowRight size={13} />
          </button>
        ))}
      </div>
    </Layout>
  );
}

function ReceiptText({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M14 8H8M16 12H8M11 16H8"/>
    </svg>
  );
}
