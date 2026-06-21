const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function monthName(month: number | null | undefined): string {
  if (!month || month < 1 || month > 12) return "-";
  return MONTHS_ID[month - 1];
}

export function periodLabel(
  month: number | null | undefined,
  year: number | null | undefined,
): string {
  if (!month || !year) return "-";
  return `${monthName(month)} ${year}`;
}

/** Format an ISO date-only string (YYYY-MM-DD) into a readable Indonesian date. */
export function formatDateOnly(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return `${DAYS_ID[date.getDay()]}, ${d} ${MONTHS_ID[m - 1]} ${y}`;
}

/** Short date: 21 Jun 2026 */
export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

/** Format an ISO timestamp into HH:mm (24h, WIB-local from the browser). */
export function formatTime(iso: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Relative-ish published date for announcements. */
export function formatPublished(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
