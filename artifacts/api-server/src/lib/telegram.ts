const TELEGRAM_API = "https://api.telegram.org";

function getConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
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

async function sendMessage(text: string): Promise<void> {
  const config = getConfig();
  if (!config) return;

  try {
    const url = `${TELEGRAM_API}/bot${config.token}/sendMessage`;
    const body = JSON.stringify({
      chat_id: config.chatId,
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
      console.warn("[Telegram] Gagal mengirim pesan:", err);
    }
  } catch (e) {
    console.warn("[Telegram] Error saat mengirim pesan:", e);
  }
}

export async function notifyCrewLogin(name: string, username: string): Promise<void> {
  const waktu = toWIB(new Date());
  await sendMessage(
    `🔐 <b>Login Kru</b>\n\n` +
    `👤 <b>Nama:</b> ${name}\n` +
    `🆔 <b>Username:</b> ${username}\n` +
    `🕐 <b>Waktu (WIB):</b> ${waktu}`,
  );
}

export async function notifyClockIn(name: string, employeeCode: string): Promise<void> {
  const waktu = toWIB(new Date());
  await sendMessage(
    `✅ <b>Clock-In</b>\n\n` +
    `👤 <b>Nama:</b> ${name}\n` +
    `🆔 <b>Kode Kru:</b> ${employeeCode}\n` +
    `🕐 <b>Waktu (WIB):</b> ${waktu}`,
  );
}

export async function notifyClockOut(name: string, employeeCode: string): Promise<void> {
  const waktu = toWIB(new Date());
  await sendMessage(
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
    `💰 <b>Slip Gaji Diterbitkan</b>\n\n` +
    `📅 <b>Periode:</b> ${periodLabel}\n` +
    `👥 <b>Jumlah Kru:</b> ${totalEmployees} orang\n` +
    `💵 <b>Total Payroll:</b> ${formatted}\n` +
    `🕐 <b>Waktu (WIB):</b> ${waktu}`,
  );
}
