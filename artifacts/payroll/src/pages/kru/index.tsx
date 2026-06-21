import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListEmployees, getListEmployeesQueryKey } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, UserPlus, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const SESSION_TOKEN_KEY = "gajipro_session_token";

function getToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

interface CrewCredential {
  employeeId: number;
  username: string;
  mustChangePassword: boolean;
  name: string | null;
  employeeCode: string | null;
  position: string | null;
  status: string | null;
}

async function fetchCrewCredentials(): Promise<CrewCredential[]> {
  const token = getToken();
  const res = await fetch("/api/crew/admin/credentials", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Gagal memuat data akun kru");
  return res.json();
}

async function deleteCrewCredential(employeeId: number): Promise<void> {
  const token = getToken();
  const res = await fetch(`/api/crew/admin/credentials/${employeeId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Gagal menghapus akun kru");
  }
}

async function setCrewCredential(
  employeeId: number,
  data: { username: string; password: string; mustChangePassword: boolean }
): Promise<void> {
  const token = getToken();
  const res = await fetch(`/api/crew/admin/credentials/${employeeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Gagal menyimpan akun kru");
  }
}

interface DialogState {
  employeeId: number;
  name: string;
  existingUsername?: string;
}

function accountStatus(cred: CrewCredential | undefined) {
  if (!cred) return "no-account";
  if (cred.mustChangePassword) return "must-change";
  return "active";
}

function StatusBadge({ status }: { status: "active" | "must-change" | "no-account" }) {
  if (status === "active")
    return <Badge style={{ background: "#166534", color: "#fff" }}>Aktif</Badge>;
  if (status === "must-change")
    return <Badge style={{ background: "#92400e", color: "#fff" }}>Perlu Ganti Password</Badge>;
  return <Badge variant="secondary">Belum Ada Akun</Badge>;
}

export default function KruManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employees, isLoading: empLoading } = useListEmployees(undefined, {
    query: { queryKey: getListEmployeesQueryKey() },
  });

  const { data: credentials, isLoading: credLoading } = useQuery({
    queryKey: ["crew-credentials"],
    queryFn: fetchCrewCredentials,
  });

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ employeeId: number; name: string } | null>(null);

  const mutation = useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: number; data: { username: string; password: string; mustChangePassword: boolean } }) =>
      setCrewCredential(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-credentials"] });
      toast({ title: "Berhasil", description: "Akun kru berhasil disimpan." });
      closeDialog();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (employeeId: number) => deleteCrewCredential(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-credentials"] });
      toast({ title: "Berhasil", description: "Akun kru berhasil dihapus." });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  const credMap = new Map<number, CrewCredential>();
  credentials?.forEach((c) => credMap.set(c.employeeId, c));

  function openDialog(employeeId: number, name: string, existingUsername?: string) {
    setDialog({ employeeId, name, existingUsername });
    setUsername(existingUsername ?? "");
    setPassword("");
    setConfirmPassword("");
    setFormError("");
  }

  function closeDialog() {
    setDialog(null);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setFormError("");
  }

  function handleSubmit() {
    setFormError("");
    if (!username.trim() || username.trim().length < 3) {
      setFormError("Username minimal 3 karakter.");
      return;
    }
    if (!password || password.length < 6) {
      setFormError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (!dialog) return;
    mutation.mutate({
      employeeId: dialog.employeeId,
      data: { username: username.trim(), password, mustChangePassword: true },
    });
  }

  const isLoading = empLoading || credLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Manajemen Akun Kru</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buat atau reset akun login kru untuk Portal Kru.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Badge style={{ background: "#166534", color: "#fff" }}>Aktif</Badge>
          <span className="text-muted-foreground">Akun aktif</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge style={{ background: "#92400e", color: "#fff" }}>Perlu Ganti Password</Badge>
          <span className="text-muted-foreground">Wajib ganti saat login pertama</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Belum Ada Akun</Badge>
          <span className="text-muted-foreground">Kru belum bisa login</span>
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Posisi</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Status Akun</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : !employees?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Belum ada data karyawan.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => {
                const cred = credMap.get(emp.id);
                const status = accountStatus(cred);
                const hasAccount = status !== "no-account";
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.employeeCode}</TableCell>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.position ?? "-"}</TableCell>
                    <TableCell>
                      {cred?.username ? (
                        <span className="font-mono text-sm">{cred.username}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant={hasAccount ? "outline" : "default"}
                          size="sm"
                          onClick={() => openDialog(emp.id, emp.name, cred?.username)}
                        >
                          {hasAccount ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              Reset
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                              Buat Akun
                            </>
                          )}
                        </Button>
                        {hasAccount && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget({ employeeId: emp.id, name: emp.name })}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Kru</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus akun login untuk <strong>{deleteTarget?.name}</strong>? Kru tidak akan bisa login ke Portal Kru setelah ini. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.employeeId); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus Akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credential Dialog */}
      <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {dialog?.existingUsername ? "Reset Akun Kru" : "Buat Akun Kru"}
            </DialogTitle>
          </DialogHeader>

          {dialog && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Kru: <strong>{dialog.name}</strong>
              </p>

              <div className="space-y-2">
                <Label htmlFor="crew-username">Username</Label>
                <Input
                  id="crew-username"
                  placeholder="Minimal 3 karakter"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crew-password">Password Baru</Label>
                <Input
                  id="crew-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crew-confirm-password">Konfirmasi Password</Label>
                <Input
                  id="crew-confirm-password"
                  type="password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div
                className="rounded-md text-sm px-3 py-2"
                style={{ background: "#fefce8", color: "#713f12", border: "1px solid #fde68a" }}
              >
                Kru akan <strong>wajib ganti password</strong> saat pertama login.
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
