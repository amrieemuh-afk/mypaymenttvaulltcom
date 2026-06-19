import { Layout } from "@/components/layout";
import { Link, useParams } from "wouter";
import { 
  useGetPayslip, 
  getGetPayslipQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, Download } from "lucide-react";
import { formatRupiah, formatMonth, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PayslipDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: payslip, isLoading } = useGetPayslip(id, {
    query: {
      enabled: !!id,
      queryKey: getGetPayslipQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        </div>
      </Layout>
    );
  }

  if (!payslip) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Slip gaji tidak ditemukan</h2>
          <Link href="/slip-gaji" className="text-primary mt-4 inline-block hover:underline">
            Kembali ke daftar slip gaji
          </Link>
        </div>
      </Layout>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="space-y-6 print:space-y-0">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/slip-gaji">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Detail Slip Gaji</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-3xl shadow-lg print:shadow-none print:border-none">
            <CardContent className="p-8 md:p-12 space-y-8">
              {/* Header */}
              <div className="text-center border-b pb-8">
                <h1 className="text-2xl font-bold uppercase tracking-widest text-primary">SLIP GAJI</h1>
                <p className="text-lg mt-2 text-muted-foreground">
                  Periode {formatMonth(payslip.periodMonth || 1)} {payslip.periodYear}
                </p>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Karyawan</p>
                  <p className="font-semibold text-lg">{payslip.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Karyawan</p>
                  <p className="font-medium">{payslip.employeeCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jabatan</p>
                  <p className="font-medium">{payslip.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departemen</p>
                  <p className="font-medium">{payslip.departmentName}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Penerimaan */}
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">PENERIMAAN</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gaji Pokok</span>
                      <span className="font-medium">{formatRupiah(payslip.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tunjangan Transport</span>
                      <span className="font-medium">{formatRupiah(payslip.transportAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tunjangan Makan</span>
                      <span className="font-medium">{formatRupiah(payslip.mealAllowance)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Penerimaan</span>
                    <span className="text-primary">{formatRupiah(payslip.grossSalary)}</span>
                  </div>
                </div>

                {/* Potongan */}
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">POTONGAN</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BPJS Ketenagakerjaan</span>
                      <span className="font-medium">{formatRupiah(payslip.bpjsKetenagakerjaan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BPJS Kesehatan</span>
                      <span className="font-medium">{formatRupiah(payslip.bpjsKesehatan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pajak Penghasilan (PPh 21)</span>
                      <span className="font-medium">{formatRupiah(payslip.incomeTax)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Potongan</span>
                    <span className="text-destructive">{formatRupiah(payslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Total Bersih */}
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <span className="text-xl font-bold uppercase tracking-wider text-primary">Gaji Bersih</span>
                  <span className="text-3xl font-black text-primary">{formatRupiah(payslip.netSalary)}</span>
                </div>
              </div>

              {/* Footer / Signature */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-muted-foreground mb-16">Penerima,</p>
                  <p className="font-semibold underline decoration-dotted underline-offset-4">{payslip.employeeName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-16">Mengetahui,</p>
                  <p className="font-semibold underline decoration-dotted underline-offset-4">Finance & HR Dept</p>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-8 border-t mt-12">
                Dokumen ini dicetak secara otomatis dan sah meskipun tanpa tanda tangan basah.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
