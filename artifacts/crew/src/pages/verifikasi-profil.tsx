import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";

export default function VerifikasiProfil() {
  const { employee, verifyProfile, logout } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState(employee?.name ?? "");
  const [position, setPosition] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !position.trim() || !departmentName.trim()) {
      setError("Nama, jabatan, dan nama kapal/unit wajib diisi.");
      return;
    }

    setLoading(true);
    const res = await verifyProfile({
      name: name.trim(),
      position: position.trim(),
      departmentName: departmentName.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    setLoading(false);

    if (res.ok) {
      navigate("/");
    } else {
      setError(res.error ?? "Gagal memverifikasi profil. Coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Verifikasi Data Akun</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selamat datang, <span className="font-medium text-foreground">{employee?.name}</span>!
            Mohon periksa dan lengkapi data Anda sebelum melanjutkan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-card-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nama sesuai identitas"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Jabatan</Label>
              <Input
                id="position"
                type="text"
                placeholder="Contoh: Nahkoda, Masinis, ABK"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="department">Nama Kapal / Unit</Label>
              <Input
                id="department"
                type="text"
                placeholder="Contoh: KM Bahari Jaya"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Nomor Telepon <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan & Lanjutkan
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => logout()}
            >
              Keluar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
