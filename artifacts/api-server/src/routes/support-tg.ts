import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/support/notify", async (req, res): Promise<void> => {
  const BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN ?? "";
  const CHAT_ID   = process.env.SUPPORT_CHAT_ID   ?? "";

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("[support-tg] Missing SUPPORT_BOT_TOKEN or SUPPORT_CHAT_ID");
    res.json({ ok: false, error: "missing_config" });
    return;
  }

  try {
    const { message, page } = req.body as { message?: string; page?: string };
    if (!message) { res.status(400).json({ ok: false, error: "no_message" }); return; }

    const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const text =
      `💬 <b>LIVE SUPPORT — Pesan Masuk</b>\n` +
      `<code>────────────────────────</code>\n\n` +
      `📄 <b>Halaman</b>  : <code>${page ?? "-"}</code>\n` +
      `💬 <b>Pesan</b>    : <code>${message}</code>\n` +
      `🕐 <b>Waktu</b>    : ${waktu}\n\n` +
      `<code>────────────────────────</code>\n` +
      `<i>🏦 MYPAYMENTVAULT — Live Support</i>`;

    const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
    const r = await fetch(`${TG}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
    });
    const data = await r.json() as { ok: boolean; description?: string; error_code?: number };
    if (!data.ok) {
      console.error("[support-tg] Telegram error:", data.error_code, data.description);
    }
    res.json({ ok: data.ok, error: data.description ?? null });
  } catch (err) {
    console.error("[support-tg] fetch error:", err);
    res.json({ ok: false, error: "fetch_failed" });
  }
});

export default router;
