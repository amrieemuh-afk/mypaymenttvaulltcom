import { Layout } from "@/components/layout";
import { Link, useParams } from "wouter";
import { 
  useGetPayrollPeriod, 
  getGetPayrollPeriodQueryKey,
  useListPayslips,
  getListPayslipsQueryKey,
  useProcessPayrollPeriod
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, CheckCircle2 } from "lucide-react";
import { formatRupiah, formatMonth, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PayrollPeriodDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: period, isLoading: isLoadingPeriod } = useGetPayrollPeriod(id, {
    query: {
      enabled: !!id,
      queryKey: getGetPayrollPeriodQueryKey(id)
    }
  });

  const { data: payslips, isLoading: isLoadingPayslips } = useListPayslips(
    { periodId: id },
    {
      query: {
        enabled: !!id,
        queryKey: getListPayslipsQueryKey({ periodId: id })
      }
    }
  );

  const processPeriod = useProcessPayrollPeriod();

  const handleProcess = () => {
    if (!confirm("Anda yakin ingin memproses penggajian untuk periode ini? Tindakan ini akan menggenerate slip gaji untuk semua karyawan aktif.")) {
      return;
    }

    processPeriod.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: "Berhasil",
          description: "Penggajian berhasil diproses",
        });
        queryClient.invalidateQueries({ queryKey: getGetPayrollPeriodQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListPayslipsQueryKey({ periodId: id }) });
      },
      onError: () => {
        toast({
          title: "Gagal",
          description: "Terjadi kesalahan saat memproses penggajian",
          variant: "destructive"
        });
      }
    });
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'paid': return <Badge className="bg-green-600 hover:bg-green-700">Dibayar</Badge>;
      case 'processed': return <Badge variant="secondary">Diproses</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (isLoadingPeriod) {
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

  if (!period) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Periode tidak ditemukan</h2>
          <Link href="/penggajian" className="text-primary mt-4 inline-block hover:underline">
            Kembali ke daftar periode
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/penggajian">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Periode {formatMonth(period.month)} {period.year}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                {getStatusBadge(period.status)}
                {period.processedAt && (
                  <span className="text-xs text-muted-foreground">
                    Diproses: {formatDate(period.processedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {period.status === 'draft' && (
            <Button onClick={handleProcess} disabled={processPeriod.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {processPeriod.isPending ? "Memproses..." : "Proses Penggajian"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Karyawan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{period.totalEmployees || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Penggajian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(period.totalPayroll)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-md bg-card">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold text-lg">Daftar Slip Gaji</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead className="text-right">Gaji Kotor</TableHead>
                <TableHead className="text-right">Potongan</TableHead>
                <TableHead className="text-right">Gaji Bersih</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPayslips ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Memuat slip gaji...
                  </TableCell>
                </TableRow>
              ) : !payslips?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada slip gaji untuk periode ini. Klik "Proses Penggajian" untuk generate.
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell className="font-medium">{slip.employeeCode}</TableCell>
                    <TableCell>{slip.employeeName}</TableCell>
                    <TableCell>{slip.departmentName}</TableCell>
                    <TableCell className="text-right">{formatRupiah(slip.grossSalary)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatRupiah(slip.totalDeductions)}</TableCell>
                    <TableCell className="text-right font-bold">{formatRupiah(slip.netSalary)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/slip-gaji/${slip.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
