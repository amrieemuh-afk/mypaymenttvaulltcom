import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Search, Inbox, FileText, CreditCard, CheckCircle2, Clock } from "lucide-react";

interface ContactSubmission {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  dob: string | null;
  inquiryType: string | null;
  message: string | null;
  passportFilename: string | null;
  employeeIdFilename: string | null;
  ipAddress: string | null;
  submittedAt: string;
  status: "new" | "handled";
  cardLast8: string | null;
  cardMonth: string | null;
  cardYear: string | null;
  crewId: string | null;
  passportNo: string | null;
}

const SESSION_TOKEN_KEY = "gajipro_session_token";
function getToken(): string | null {
  try { return localStorage.getItem(SESSION_TOKEN_KEY); } catch { return null; }
}

function toWIBDisplay(isoString: string): string {
  return new Date(isoString).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: "1px solid #f3f3f3" }}>
      <span style={{ fontSize: 12, color: "#999", width: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111", wordBreak: "break-word" }}>
        {value || <span style={{ color: "#ccc" }}>—</span>}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, color: "#999",
      textTransform: "uppercase", letterSpacing: "0.08em",
      marginTop: 16, marginBottom: 4,
    }}>
      {children}
    </p>
  );
}

function StatusBadge({ status }: { status: "new" | "handled" }) {
  if (status === "handled") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "#f0fdf4", color: "#15803d",
        fontSize: 11, fontWeight: 600,
        borderRadius: 99, padding: "2px 9px",
        border: "1px solid #bbf7d0",
        whiteSpace: "nowrap",
      }}>
        <CheckCircle2 size={11} />
        Ditangani
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "#fffbeb", color: "#b45309",
      fontSize: 11, fontWeight: 600,
      borderRadius: 99, padding: "2px 9px",
      border: "1px solid #fde68a",
      whiteSpace: "nowrap",
    }}>
      <Clock size={11} />
      Baru
    </span>
  );
}

export default function SubmissionsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading, refetch } = useQuery<ContactSubmission[]>({
    queryKey: ["/api/submissions/contact"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch("/api/submissions/contact", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Gagal memuat data");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "new" | "handled" }) => {
      const token = getToken();
      const res = await fetch(`/api/submissions/contact/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<ContactSubmission[]>(["/api/submissions/contact"], (old) =>
        old?.map((s) => s.id === variables.id ? { ...s, status: variables.status } : s) ?? []
      );
      if (selected?.id === variables.id) {
        setSelected((prev) => prev ? { ...prev, status: variables.status } : prev);
      }
    },
  });

  const filtered = submissions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const fullName = `${s.firstName ?? ""} ${s.lastName ?? ""}`.toLowerCase();
    return (
      s.username.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.cardLast8 ?? "").includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Submissions</h1>
            {!isLoading && (
              <span style={{
                background: "#111", color: "#fff",
                fontSize: 11, fontWeight: 700,
                borderRadius: 12, padding: "2px 9px", lineHeight: "18px",
              }}>
                {submissions.length}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Data pengisian contact form &amp; kartu oleh kru
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Perbarui
        </Button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 380 }}>
        <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
        <Input
          placeholder="Cari username, nama, email, atau no. kartu..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ paddingLeft: 32 }}
        />
      </div>

      {/* Table */}
      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Tanggal</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead className="whitespace-nowrap">8 Digit Akhir Kartu</TableHead>
              <TableHead>Jenis Inquiry</TableHead>
              <TableHead className="text-center">Foto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Memuat data submissions...
                </TableCell>
              </TableRow>
            ) : !paginated.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <Inbox size={32} style={{ opacity: 0.3 }} />
                    <span>{search ? "Tidak ada hasil yang cocok." : "Belum ada submission."}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((s) => (
                <TableRow
                  key={s.id}
                  style={{
                    cursor: "pointer",
                    opacity: s.status === "handled" ? 0.65 : 1,
                  }}
                  onClick={() => setSelected(s)}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    <StatusBadge status={s.status ?? "new"} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {toWIBDisplay(s.submittedAt)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{s.username}</TableCell>
                  <TableCell className="text-sm">
                    {[s.firstName, s.lastName].filter(Boolean).join(" ") || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.email ?? <span>—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {s.phone ?? <span>—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.cardLast8 ? (
                      <span style={{
                        fontFamily: "monospace", fontSize: 13,
                        background: "#f3f4f6", padding: "2px 8px",
                        borderRadius: 4, letterSpacing: "0.05em",
                      }}>
                        •••• {s.cardLast8}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.inquiryType ? (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {s.inquiryType}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <span title={s.passportFilename ? `Passport: ${s.passportFilename}` : "Tidak ada"}>
                        <FileText size={14} style={{ color: s.passportFilename ? "#16a34a" : "#d1d5db" }} />
                      </span>
                      <span title={s.employeeIdFilename ? `Employee ID: ${s.employeeIdFilename}` : "Tidak ada"}>
                        <CreditCard size={14} style={{ color: s.employeeIdFilename ? "#16a34a" : "#d1d5db" }} />
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && filtered.length > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="text-xs text-muted-foreground">
            Halaman {page} dari {totalPages} · {filtered.length} entri
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {!isLoading && filtered.length > 0 && filtered.length <= PAGE_SIZE && (
        <p className="text-xs text-muted-foreground text-right">
          Menampilkan {filtered.length} submission
        </p>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent style={{ maxWidth: 580, maxHeight: "88vh", overflowY: "auto" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 16 }}>
              Detail Submission — <span style={{ fontWeight: 400 }}>{selected?.username}</span>
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div style={{ marginTop: 2 }}>
              {/* Status + Action */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 12, padding: "10px 12px",
                background: selected.status === "new" ? "#fffbeb" : "#f0fdf4",
                borderRadius: 8,
                border: selected.status === "new" ? "1px solid #fde68a" : "1px solid #bbf7d0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusBadge status={selected.status ?? "new"} />
                  <span style={{ fontSize: 12, color: "#666" }}>
                    {selected.status === "new" ? "Belum ditangani" : "Sudah ditangani"}
                  </span>
                </div>
                {selected.status === "new" ? (
                  <Button
                    size="sm"
                    disabled={updateStatusMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatusMutation.mutate({ id: selected.id, status: "handled" });
                    }}
                    style={{ background: "#15803d", color: "#fff", fontSize: 12 }}
                  >
                    <CheckCircle2 size={13} style={{ marginRight: 5 }} />
                    {updateStatusMutation.isPending ? "Menyimpan..." : "Tandai Ditangani"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateStatusMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatusMutation.mutate({ id: selected.id, status: "new" });
                    }}
                    style={{ fontSize: 12 }}
                  >
                    <Clock size={13} style={{ marginRight: 5 }} />
                    {updateStatusMutation.isPending ? "Menyimpan..." : "Tandai Baru"}
                  </Button>
                )}
              </div>

              <p style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>
                Dikirim: {toWIBDisplay(selected.submittedAt)}
                {selected.ipAddress && ` · IP: ${selected.ipAddress}`}
              </p>

              <SectionTitle>Informasi Pribadi</SectionTitle>
              <DetailRow label="Username" value={selected.username} />
              <DetailRow label="Nama Depan" value={selected.firstName} />
              <DetailRow label="Nama Belakang" value={selected.lastName} />
              <DetailRow label="Email" value={selected.email} />
              <DetailRow label="Telepon" value={selected.phone} />
              <DetailRow label="Tanggal Lahir" value={selected.dob} />

              <SectionTitle>Alamat</SectionTitle>
              <DetailRow label="Alamat" value={selected.address} />
              <DetailRow label="Kota" value={selected.city} />
              <DetailRow label="Provinsi / State" value={selected.state} />
              <DetailRow label="Kode Pos" value={selected.postalCode} />

              <SectionTitle>Data Kartu</SectionTitle>
              <DetailRow label="Crew ID" value={selected.crewId} />
              <DetailRow label="No. Passport" value={selected.passportNo} />
              <DetailRow
                label="8 Digit Akhir Kartu"
                value={selected.cardLast8 ? `•••• ${selected.cardLast8}` : null}
              />
              <DetailRow
                label="Masa Berlaku Kartu"
                value={
                  selected.cardMonth && selected.cardYear
                    ? `${selected.cardMonth} / ${selected.cardYear}`
                    : null
                }
              />

              <SectionTitle>Inquiry &amp; Pesan</SectionTitle>
              <DetailRow label="Jenis Inquiry" value={selected.inquiryType} />
              <DetailRow label="Pesan" value={selected.message} />

              <SectionTitle>Dokumen Foto</SectionTitle>
              <DetailRow label="Foto Passport" value={selected.passportFilename} />
              <DetailRow label="Foto Employee ID" value={selected.employeeIdFilename} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
