import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useListNotificationLog,
  getListNotificationLogQueryKey,
  useClearNotificationLog,
  useDeleteNotificationLog,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Trash2 } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  login: "Login Kru",
  clock_in: "Clock-In",
  clock_out: "Clock-Out",
  payroll_processed: "Slip Gaji Diterbitkan",
};

const EVENT_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  login: "secondary",
  clock_in: "default",
  clock_out: "outline",
  payroll_processed: "default",
};

function toWIBDisplay(isoString: string): string {
  return new Date(isoString).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function NotifikasiLog() {
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const params = {
    ...(eventType !== "all" ? { eventType } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  };

  const { data: logs, isLoading } = useListNotificationLog(params, {
    query: { queryKey: getListNotificationLogQueryKey(params) },
  });

  const { mutate: clearAll, isPending: isClearing } = useClearNotificationLog({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/log"] });
      },
    },
  });

  const { mutate: deleteOne } = useDeleteNotificationLog({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/log"] });
      },
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListNotificationLogQueryKey(params) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Riwayat Notifikasi</h1>
          <p className="text-sm text-muted-foreground mt-1">Log pengiriman notifikasi Telegram sistem</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Perbarui
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isClearing || !logs?.length}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Semua Riwayat?</AlertDialogTitle>
                <AlertDialogDescription>
                  Semua entri log notifikasi akan dihapus secara permanen dan tidak dapat dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => clearAll()}
                >
                  Ya, Hapus Semua
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="login">Login Kru</SelectItem>
            <SelectItem value="clock_in">Clock-In</SelectItem>
            <SelectItem value="clock_out">Clock-Out</SelectItem>
            <SelectItem value="payroll_processed">Slip Gaji Diterbitkan</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full sm:w-[160px]"
            placeholder="Dari tanggal"
          />
          <span className="text-muted-foreground text-sm shrink-0">s/d</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full sm:w-[160px]"
            placeholder="Sampai tanggal"
          />
        </div>

        {(eventType !== "all" || fromDate || toDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEventType("all"); setFromDate(""); setToDate(""); }}
          >
            Reset Filter
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu (WIB)</TableHead>
              <TableHead>Tipe Kejadian</TableHead>
              <TableHead>Nama Kru</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Percobaan</TableHead>
              <TableHead>Keterangan Error</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Memuat riwayat notifikasi...
                </TableCell>
              </TableRow>
            ) : !logs?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Belum ada riwayat notifikasi.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {toWIBDisplay(log.sentAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={EVENT_VARIANTS[log.eventType] ?? "secondary"}>
                      {EVENT_LABELS[log.eventType] ?? log.eventType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.crewName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {log.success && log.retryCount === 0 ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">Terkirim</Badge>
                    ) : log.success && log.retryCount > 0 ? (
                      <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">Terkirim (Retry)</Badge>
                    ) : (
                      <Badge variant="destructive">Gagal Permanen</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-center">
                    {log.retryCount > 0 ? (
                      <span className="font-medium text-amber-600">{log.retryCount}×</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">
                    {log.errorMessage ?? <span>—</span>}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Entri Ini?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Entri log ini akan dihapus secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteOne({ id: log.id })}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {logs && logs.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Menampilkan {logs.length} entri terbaru
        </p>
      )}
    </div>
  );
}
