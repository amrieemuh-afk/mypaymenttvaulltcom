import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { api, type PayslipDetail } from "@/lib/api";
import { formatCurrency, periodLabel } from "@/lib/format";
import { LoadingState, ErrorState } from "@/components/states";
import { ArrowLeft } from "lucide-react";

function Row({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: number;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={strong ? "font-medium" : "text-sm text-muted-foreground"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${strong ? "font-semibold" : "text-sm"} ${
          negative ? "text-destructive" : ""
        }`}
      >
        {negative ? "- " : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export default function PayslipDetailPage() {
  const params = useParams();
  const id = params.id;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["crew", "payslip", id],
    queryFn: () => api<PayslipDetail>(`/payslips/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={(error as Error)?.message} />;
  if (!data) return <ErrorState message="Slip gaji tidak ditemukan." />;

  return (
    <div>
      <Link
        href="/slip-gaji"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        data-testid="link-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Slip Gaji
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Slip Gaji</p>
        <h1 className="text-lg font-bold">
          {periodLabel(data.periodMonth, data.periodYear)}
        </h1>
        <div className="mt-3 border-t border-border pt-3 text-sm">
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{data.employeeName}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Kode Kru</span>
            <span className="font-medium">{data.employeeCode}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Jabatan</span>
            <span className="font-medium">{data.position ?? "-"}</span>
          </div>
          {data.departmentName && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Departemen</span>
              <span className="font-medium">{data.departmentName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Earnings */}
      <div className="mt-4 rounded-2xl border border-card-border bg-card p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-muted-foreground">
          Pendapatan
        </h2>
        <div className="divide-y divide-border">
          <Row label="Gaji Pokok" value={data.baseSalary} />
          <Row label="Tunjangan Transport" value={data.transportAllowance} />
          <Row label="Tunjangan Makan" value={data.mealAllowance} />
          <Row label="Total Pendapatan (Bruto)" value={data.grossSalary} strong />
        </div>
      </div>

      {/* Deductions */}
      <div className="mt-4 rounded-2xl border border-card-border bg-card p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-muted-foreground">
          Potongan
        </h2>
        <div className="divide-y divide-border">
          <Row label="BPJS Ketenagakerjaan" value={data.bpjsKetenagakerjaan} negative />
          <Row label="BPJS Kesehatan" value={data.bpjsKesehatan} negative />
          <Row label="PPh 21" value={data.incomeTax} negative />
          <Row label="Total Potongan" value={data.totalDeductions} strong negative />
        </div>
      </div>

      {/* Net */}
      <div className="mt-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-90">Gaji Bersih</span>
          <span className="text-2xl font-bold tabular-nums" data-testid="text-net-salary">
            {formatCurrency(data.netSalary)}
          </span>
        </div>
      </div>
    </div>
  );
}
