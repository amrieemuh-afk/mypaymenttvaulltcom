import { Router, type IRouter } from "express";
import multer from "multer";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID   = process.env.VITE_TELEGRAM_CHAT_ID   ?? "";
const TG        = `https://api.telegram.org/bot${BOT_TOKEN}`;

/* Debug: test bot token + chat ID */
router.get("/tg/test", async (_req, res): Promise<void> => {
  const getMeRes  = await fetch(`${TG}/getMe`);
  const getMe     = await getMeRes.json();
  const sendRes   = await fetch(`${TG}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: "✅ Test koneksi MyPaymentVault OK" }),
  });
  const send = await sendRes.json();
  res.json({ tokenLoaded: !!BOT_TOKEN, chatIdLoaded: !!CHAT_ID, getMe, send });
});

/* Forward a sendMessage payload (body already built by frontend) */
router.post("/tg/send-message", async (req, res): Promise<void> => {
  if (!BOT_TOKEN || !CHAT_ID) { res.json({ ok: false, messageId: null }); return; }
  try {
    const payload = { chat_id: CHAT_ID, ...req.body };
    const r    = await fetch(`${TG}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json() as { ok: boolean; result?: { message_id: number } };
    res.json({ ok: data.ok, messageId: data.result?.message_id ?? null });
  } catch {
    res.json({ ok: false, messageId: null });
  }
});

/* Forward a sendDocument (multipart) — parse with multer, inject chat_id, relay to Telegram */
router.post("/tg/send-document", upload.single("document"), async (req, res): Promise<void> => {
  if (!BOT_TOKEN || !CHAT_ID) { res.json({ ok: false }); return; }
  try {
    const file    = req.file;
    const caption = (req.body as Record<string, string>).caption ?? "";

    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    if (caption) form.append("caption", caption);
    if (file) {
      const blob = new Blob([file.buffer], { type: file.mimetype });
      form.append("document", blob, file.originalname);
    }

    const r    = await fetch(`${TG}/sendDocument`, { method: "POST", body: form });
    const data = await r.json();
    res.json(data);
  } catch {
    res.json({ ok: false });
  }
});

/* Proxy getUpdates */
router.get("/tg/updates", async (req, res): Promise<void> => {
  if (!BOT_TOKEN) { res.json({ ok: true, result: [] }); return; }
  const { offset = "0", timeout = "2" } = req.query as Record<string, string>;
  try {
    const r    = await fetch(`${TG}/getUpdates?offset=${offset}&timeout=${timeout}&limit=50`);
    const data = await r.json();
    res.json(data);
  } catch {
    res.json({ ok: true, result: [] });
  }
});

/* Proxy getUpdates for latest offset only */
router.get("/tg/latest-offset", async (req, res): Promise<void> => {
  if (!BOT_TOKEN) { res.json({ offset: 0 }); return; }
  try {
    const r    = await fetch(`${TG}/getUpdates?offset=-1&limit=1`);
    const data = await r.json() as { ok: boolean; result: { update_id: number }[] };
    const last = data.result?.at(-1);
    res.json({ offset: last ? last.update_id + 1 : 0 });
  } catch {
    res.json({ offset: 0 });
  }
});

/* Proxy answerCallbackQuery */
router.post("/tg/answer-callback", async (req, res): Promise<void> => {
  if (!BOT_TOKEN) { res.json({ ok: true }); return; }
  try {
    const { callbackQueryId, text } = req.body;
    await fetch(`${TG}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

export default router;
