import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, KeyRound, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profil() {
  const { employee } = useAuth();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState("");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(false);
    if (!newUsername.trim() || !usernamePassword.trim()) {
      setUsernameError("Semua kolom wajib diisi.");
      return;
    }
    setUsernameLoading(true);
    try {
      await api("/auth/change-username", {
        method: "POST",
        body: { newUsername: newUsername.trim(), currentPassword: usernamePassword },
      });
      setUsernameSuccess(true);
      setNewUsername("");
      setUsernamePassword("");
      toast({ title: "Username berhasil diubah", description: `Username baru: ${newUsername.trim()}` });
    } catch (err) {
      setUsernameError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Gagal mengubah username.",
      );
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    setPasswordLoading(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Kata sandi berhasil diubah" });
    } catch (err) {
      setPasswordError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Gagal mengubah kata sandi.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Profil Akun</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola username dan kata sandi Anda
        </p>
      </div>

      {employee && (
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
            {employee.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
          </div>
          <div>
            <p className="font-semibold">{employee.name}</p>
            <p className="text-sm text-muted-foreground">{employee.employeeCode}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleChangeUsername} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Ganti Username</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-username">Username Baru</Label>
          <Input
            id="new-username"
            type="text"
            placeholder="Contoh: budi.santoso"
            autoComplete="username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Huruf, angka, titik (.), garis bawah (_), atau tanda hubung (-). Minimal 3 karakter.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username-password">Konfirmasi dengan Kata Sandi</Label>
          <Input
            id="username-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={usernamePassword}
            onChange={(e) => setUsernamePassword(e.target.value)}
          />
        </div>

        {usernameError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{usernameError}</p>
        )}
        {usernameSuccess && (
          <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Username berhasil diubah.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={usernameLoading}>
          {usernameLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Username
        </Button>
      </form>

      <form onSubmit={handleChangePassword} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Ganti Kata Sandi</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="current-pw">Kata Sandi Saat Ini</Label>
          <Input
            id="current-pw"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-pw">Kata Sandi Baru</Label>
          <Input
            id="new-pw"
            type="password"
            placeholder="Minimal 6 karakter"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-pw">Konfirmasi Kata Sandi Baru</Label>
          <Input
            id="confirm-pw"
            type="password"
            placeholder="Ulangi kata sandi baru"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {passwordError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{passwordError}</p>
        )}
        {passwordSuccess && (
          <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Kata sandi berhasil diubah.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={passwordLoading}>
          {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Kata Sandi Baru
        </Button>
      </form>
    </div>
  );
}
