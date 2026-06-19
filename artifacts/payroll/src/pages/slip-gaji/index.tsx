import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { 
  useListPayslips, 
  getListPayslipsQueryKey,
  useListPayrollPeriods,
  getListPayrollPeriodsQueryKey
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
import { Eye, Printer } from "lucide-react";
import { formatRupiah, formatMonth } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function PayslipList() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const { data: periods } = useListPayrollPeriods(undefined, {
    query: {
      queryKey: getListPayrollPeriodsQueryKey()
    }
  });

  const periodId = selectedPeriod !== "all" ? Number(selectedPeriod) : undefined;
  
  const { data: payslips, isLoading } = useListPayslips(
    { periodId },
    {
      query: {
        queryKey: getListPayslipsQueryKey({ periodId })
      }
    }
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid': return <Badge className="bg-green-600 hover:bg-green-700">Dibayar</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Slip Gaji</h1>
          
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Semua Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Periode</SelectItem>
                {periods?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {formatMonth(p.month)} {p.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Karyawan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead className="text-right">Gaji Bersih</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Memuat slip gaji...
                  </TableCell>
                </TableRow>
              ) : !payslips?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada slip gaji.
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatMonth(slip.periodMonth || 1)} {slip.periodYear}
                    </TableCell>
                    <TableCell>{slip.employeeCode}</TableCell>
                    <TableCell>{slip.employeeName}</TableCell>
                    <TableCell>{slip.departmentName}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(slip.netSalary)}</TableCell>
                    <TableCell>
                      {getStatusBadge(slip.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/slip-gaji/${slip.id}`}>
                        <Button variant="ghost" size="sm" title="Lihat">
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
