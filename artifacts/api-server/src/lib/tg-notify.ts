function getEnv(key1: string, key2: string): string {
  return process.env[key1] ?? process.env[key2] ?? "";
}

const BOT_TOKEN = getEnv("TG_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
const CHAT_ID   = getEnv("TG_CHAT_ID",   "VITE_TELEGRAM_CHAT_ID");
const TG        = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function tgNotify(text: string): Promise<void> {
  const token = getEnv("TG_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN");
  const chatId = getEnv("TG_CHAT_ID",  "VITE_TELEGRAM_CHAT_ID");
  if (!token || !chatId) return;
  const tgUrl = `https://api.telegram.org/bot${token}`;
  try {
    await fetch(`${tgUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch { /* best-effort */ }
}
