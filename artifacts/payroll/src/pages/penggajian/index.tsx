import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { 
  useListPayrollPeriods, 
  getListPayrollPeriodsQueryKey,
  useCreatePayrollPeriod
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
import { Plus, Eye } from "lucide-react";
import { formatRupiah, formatMonth } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PayrollPeriodList() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: periods, isLoading } = useListPayrollPeriods(undefined, {
    query: {
      queryKey: getListPayrollPeriodsQueryKey()
    }
  });

  const createPeriod = useCreatePayrollPeriod();

  const handleCreate = () => {
    createPeriod.mutate({
      data: { month, year }
    }, {
      onSuccess: () => {
        toast({
          title: "Berhasil",
          description: "Periode penggajian baru berhasil dibuat",
        });
        queryClient.invalidateQueries({ queryKey: getListPayrollPeriodsQueryKey() });
        setOpen(false);
      },
      onError: () => {
        toast({
          title: "Gagal",
          description: "Gagal membuat periode penggajian. Mungkin periode ini sudah ada.",
          variant: "destructive"
        });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid': return <Badge className="bg-green-600 hover:bg-green-700">Dibayar</Badge>;
      case 'processed': return <Badge variant="secondary">Diproses</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Periode Penggajian</h1>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Buat Periode Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Periode Penggajian Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="month" className="text-right text-sm font-medium">Bulan</label>
                  <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={String(m)}>{formatMonth(m)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="year" className="text-right text-sm font-medium">Tahun</label>
                  <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button onClick={handleCreate} disabled={createPeriod.isPending}>
                  {createPeriod.isPending ? "Menyimpan..." : "Buat Periode"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>

        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Total Karyawan</TableHead>
                <TableHead>Total Penggajian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Memuat data periode...
                  </TableCell>
                </TableRow>
              ) : !periods?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada data periode penggajian.
                  </TableCell>
                </TableRow>
              ) : (
                periods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">
                      {formatMonth(period.month)} {period.year}
                    </TableCell>
                    <TableCell>{period.totalEmployees || 0} orang</TableCell>
                    <TableCell>{formatRupiah(period.totalPayroll)}</TableCell>
                    <TableCell>
                      {getStatusBadge(period.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/penggajian/${period.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
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
