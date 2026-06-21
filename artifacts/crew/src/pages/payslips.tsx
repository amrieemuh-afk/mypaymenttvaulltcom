import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api, type PayslipSummary } from "@/lib/api";
import { formatCurrency, periodLabel } from "@/lib/format";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  PageHeader,
} from "@/components/states";
import { ChevronRight, Receipt } from "lucide-react";

function groupByYear(items: PayslipSummary[]): [number, PayslipSummary[]][] {
  const map = new Map<number, PayslipSummary[]>();
  for (const p of items) {
    const y = p.periodYear ?? 0;
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(p);
  }
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
}

export default function Payslips() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["crew", "payslips"],
    queryFn: () => api<PayslipSummary[]>("/payslips"),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error)?.message} />;
  if (!data || data.length === 0)
    return (
      <>
        <PageHeader title="Slip Gaji" />
        <EmptyState message="Belum ada slip gaji." />
      </>
    );

  const groups = groupByYear(data);

  return (
    <div>
      <PageHeader title="Slip Gaji" subtitle={`${data.length} slip gaji tersedia`} />
      <div className="space-y-6">
        {groups.map(([year, items]) => (
          <div key={year}>
            <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
              {year || "Lainnya"}
            </h2>
            <div className="space-y-2">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/slip-gaji/${p.id}`}
                  data-testid={`payslip-${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-4 shadow-sm hover-elevate"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {periodLabel(p.periodMonth, p.periodYear)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gaji bersih
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-primary">
                      {formatCurrency(p.netSalary)}
                    </p>
                    <span className="text-xs capitalize text-muted-foreground">
                      {p.status === "paid" ? "Dibayar" : p.status}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
