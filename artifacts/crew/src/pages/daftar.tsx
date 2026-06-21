import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { api, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function Daftar() {
  const { isAuthenticated, login } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !username.trim() || !password || !confirmPassword) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await api<{ sessionToken: string; employee: { id: number; name: string; employeeCode: string }; mustChangePassword: boolean }>(
        "/auth/register",
        { method: "POST", body: { name: name.trim(), username: username.trim(), password }, auth: false },
      );

      const loginRes = await login(username.trim(), password);
      if (loginRes.ok) {
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Gagal mendaftar. Coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-lg shadow-primary/20">
            PK
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Akun</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftar dengan username pilihan Anda sendiri
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-card-border bg-card p-6 shadow-sm space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="Contoh: Budi Santoso"
              autoCapitalize="words"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Contoh: budi.santoso"
              autoCapitalize="none"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Huruf, angka, titik, _ atau -. Minimal 3 karakter.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Ulangi kata sandi"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Buat Akun
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
