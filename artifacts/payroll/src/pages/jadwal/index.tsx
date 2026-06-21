import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSchedules,
  getListSchedulesQueryKey,
  useDeleteSchedule,
} from "@workspace/api-client-react";

export default function ScheduleList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: schedules, isLoading } = useListSchedules(undefined, {
    query: { queryKey: getListSchedulesQueryKey() },
  });

  const deleteSchedule = useDeleteSchedule();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteSchedule.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Jadwal berhasil dihapus" });
        queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Gagal", description: "Terjadi kesalahan saat menghapus jadwal", variant: "destructive" });
        setDeleteId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Jadwal Kerja</h1>
        <Link href="/jadwal/tambah">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Jadwal
          </Button>
        </Link>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kru</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Memuat data jadwal...
                </TableCell>
              </TableRow>
            ) : !schedules?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Belum ada jadwal kerja.
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.employeeName ?? `Kru #${s.employeeId}`}</TableCell>
                  <TableCell>{new Date(s.date).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>{s.shift}</TableCell>
                  <TableCell>{s.title ?? "-"}</TableCell>
                  <TableCell>{s.location ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/jadwal/${s.id}`}>
                        <Button variant="outline" size="icon" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Hapus"
                        onClick={() => setDeleteId(s.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Jadwal akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
