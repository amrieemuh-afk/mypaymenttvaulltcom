import { db, notificationLogsTable } from "@workspace/db";

const TELEGRAM_API = "https://api.telegram.org";
const MAX_RETRIES = 3;

function getConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? process.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID ?? process.env.VITE_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

function toWIB(date: Date): string {
  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function logNotification(
  eventType: string,
  crewName: string | null,
  message: string,
  success: boolean,
  retryCount: number,
  errorMessage?: string,
): Promise<void> {
  try {
    await db.insert(notificationLogsTable).values({
      eventType,
      crewName,
      message,
      success,
      retryCount,
      errorMessage: errorMessage ?? null,
    });
  } catch (e) {
    console.warn("[Telegram] Gagal menyimpan log notifikasi:", e);
  }
}

async function attemptSend(token: string, chatId: string, text: string): Promise<void> {
  const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
  const body = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

async function sendMessage(
  eventType: string,
  crewName: string | null,
  text: string,
): Promise<void> {
  const config = getConfig();
  if (!config) {
    await logNotification(eventType, crewName, text, false, 0, "Konfigurasi Telegram tidak tersedia");
    return;
  }

  let lastError = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      console.warn(`[Telegram] Retry ke-${attempt} dalam ${backoffMs}ms...`);
      await sleep(backoffMs);
    }

    try {
      await attemptSend(config.token, config.chatId, text);
      await logNotification(eventType, crewName, text, true, attempt);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.warn(`[Telegram] Percobaan ${attempt + 1}/${MAX_RETRIES + 1} gagal:`, lastError);
    }
  }

  await logNotification(eventType, crewName, text, false, MAX_RETRIES, lastError);
}

export async function notifyCrewLogin(name: string, username: string): Promise<void> {
  const waktu = toWIB(new Date());
  await sendMessage(
    "login",
    name,
    `🔐 <b>Login Kru</b>\n\n` +
    `👤 <b>Nama:</b> ${name}\n` +
    `🆔 <b>Username:</b> ${username}\n` +
    `🕐 <b>Waktu (WIB):</b> ${waktu}`,
  );
}

export async function notifyClockIn(name: string, employeeCode: string): Promise<void> {
  const waktu = toWIB(new Date());
  await sendMessage(
    "clock_in",
    name,
    `✅ <b>Clock-In</b>\n\n` +
    `👤 <b>Nama:</b> ${name}\n` +
    `🆔 <b>Kode Kru:</b> ${employeeCode}\n` +
    `🕐 <b>Waktu (WIB):</b> ${waktu}`,
  );
}

export async function notifyClockOut(name: string, employeeCode: string): Promise<void> {
  const waktu = toWIB(new Date());
  await sendMessage(
    "clock_out",
    name,
    `🔚 <b>Clock-Out</b>\n\n` +
    `👤 <b>Nama:</b> ${name}\n` +
    `🆔 <b>Kode Kru:</b> ${employeeCode}\n` +
    `🕐 <b>Waktu (WIB):</b> ${waktu}`,
  );
}

export async function notifyPayrollProcessed(
  periodLabel: string,
  totalEmployees: number,
  totalPayroll: number,
): Promise<void> {
  const waktu = toWIB(new Date());
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(totalPayroll);

  await sendMessage(
    "payroll_processed",
    null,
    `💰 <b>Slip Gaji Diterbitkan</b>\n\n` +
    `📅 <b>Periode:</b> ${periodLabel}\n` +
    `👥 <b>Jumlah Kru:</b> ${totalEmployees} orang\n` +
    `💵 <b>Total Payroll:</b> ${formatted}\n` +
    `🕐 <b>Waktu (WIB):</b> ${waktu}`,
  );
}
