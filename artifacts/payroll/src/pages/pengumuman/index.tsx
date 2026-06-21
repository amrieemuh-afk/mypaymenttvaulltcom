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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAnnouncements,
  getListAnnouncementsQueryKey,
  useDeleteAnnouncement,
} from "@workspace/api-client-react";

const CATEGORY_LABELS: Record<string, string> = {
  info: "Info",
  warning: "Peringatan",
  urgent: "Mendesak",
};

const CATEGORY_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  info: "secondary",
  warning: "default",
  urgent: "destructive",
};

export default function AnnouncementList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: announcements, isLoading } = useListAnnouncements({
    query: { queryKey: getListAnnouncementsQueryKey() },
  });

  const deleteAnnouncement = useDeleteAnnouncement();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteAnnouncement.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Pengumuman berhasil dihapus" });
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Gagal", description: "Terjadi kesalahan saat menghapus pengumuman", variant: "destructive" });
        setDeleteId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Pengumuman</h1>
        <Link href="/pengumuman/tambah">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pengumuman
          </Button>
        </Link>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Audiens</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Memuat data pengumuman...
                </TableCell>
              </TableRow>
            ) : !announcements?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada pengumuman.
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((ann) => (
                <TableRow key={ann.id}>
                  <TableCell className="font-medium max-w-[220px] truncate">{ann.title}</TableCell>
                  <TableCell>
                    <Badge variant={CATEGORY_VARIANTS[ann.category] ?? "secondary"}>
                      {CATEGORY_LABELS[ann.category] ?? ann.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{ann.audience === "all" ? "Semua Kru" : ann.audience}</TableCell>
                  <TableCell>{new Date(ann.publishedAt).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/pengumuman/${ann.id}`}>
                        <Button variant="outline" size="icon" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Hapus"
                        onClick={() => setDeleteId(ann.id)}
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
            <AlertDialogTitle>Hapus Pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengumuman akan dihapus secara permanen.
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
