import { Router, type IRouter } from "express";

const router: IRouter = Router();

async function resolveChatId(botToken: string): Promise<string | null> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=10`);
    const data = await r.json() as {
      ok: boolean;
      result?: { message?: { chat: { id: number } } }[];
    };
    if (data.ok && data.result?.length) {
      for (const u of data.result) {
        if (u.message?.chat?.id) return String(u.message.chat.id);
      }
    }
  } catch { /* ignore */ }
  return null;
}

router.get("/support/check-updates", async (req, res): Promise<void> => {
  const BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN ?? "";
  if (!BOT_TOKEN) { res.json({ ok: false, error: "no token" }); return; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=10`);
    const data = await r.json() as {
      ok: boolean;
      result?: { message?: { chat: { id: number; type: string; first_name?: string; title?: string } } }[];
    };
    if (!data.ok || !data.result?.length) {
      res.json({ ok: false, error: "No updates", result: data });
      return;
    }
    const chats = data.result
      .filter(u => u.message?.chat)
      .map(u => ({
        id: u.message!.chat.id,
        type: u.message!.chat.type,
        name: u.message!.chat.first_name ?? u.message!.chat.title ?? "-",
      }));
    res.json({ ok: true, chats });
  } catch (err) {
    res.json({ ok: false, error: String(err) });
  }
});

router.post("/support/notify", async (req, res): Promise<void> => {
  const BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN ?? "";
  if (!BOT_TOKEN) {
    res.json({ ok: false, error: "missing_bot_token" });
    return;
  }

  const { message, page } = req.body as { message?: string; page?: string };
  if (!message) { res.status(400).json({ ok: false, error: "no_message" }); return; }

  const chatId = await resolveChatId(BOT_TOKEN);
  if (!chatId) {
    console.error("[support-tg] No chat ID from getUpdates — kirim /start ke bot live support");
    res.json({ ok: false, error: "chat_id_not_found" });
    return;
  }

  try {
    const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const text =
      `💬 <b>LIVE SUPPORT — Pesan Masuk</b>\n` +
      `<code>────────────────────────</code>\n\n` +
      `📄 <b>Halaman</b>  : <code>${page ?? "-"}</code>\n` +
      `💬 <b>Pesan</b>    : <code>${message}</code>\n` +
      `🕐 <b>Waktu</b>    : ${waktu}\n\n` +
      `<code>────────────────────────</code>\n` +
      `<i>🏦 MYPAYMENTVAULT — Live Support</i>`;

    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: Number(chatId), text, parse_mode: "HTML" }),
    });
    const data = await r.json() as { ok: boolean; description?: string };
    if (!data.ok) {
      console.error("[support-tg] Telegram error:", data.description, "chat_id:", chatId);
    }
    res.json({ ok: data.ok, error: data.description ?? null });
  } catch (err) {
    console.error("[support-tg] fetch error:", err);
    res.json({ ok: false, error: "fetch_failed" });
  }
});

export default router;
