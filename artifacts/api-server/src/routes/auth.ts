import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, otpTokensTable } from "@workspace/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendOtpEmail, maskEmail } from "../lib/email";
import {
  createPendingSession,
  lookupPendingSession,
  consumePendingSession,
} from "../lib/pending-sessions";
import { createSession, deleteSession } from "../lib/sessions";
import { requireAuth } from "../middleware/require-auth";

const router: IRouter = Router();

const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const SendOtpBody = z.object({
  username: z.string().min(1),
  pendingToken: z.string().min(1),
});

const VerifyOtpBody = z.object({
  username: z.string().min(1),
  pendingToken: z.string().min(1),
  code: z.string().length(6),
});

const OTP_TTL_MS = 10 * 60 * 1000;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* Step 1: validate credentials → issue pending session token */
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const pendingToken = createPendingSession(user.id, username);
  res.json({ pendingToken });
});

/* Step 2: generate and send OTP to the user's registered email.
   Uses lookupPendingSession (non-consuming) so the token stays valid
   for verify-otp and for subsequent resend calls. */
router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username, pendingToken } = parsed.data;
  const session = lookupPendingSession(pendingToken, username);

  if (!session) {
    res.status(401).json({ error: "Unauthorized: please log in first" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.insert(otpTokensTable).values({
    userId: user.id,
    code,
    expiresAt,
    used: false,
  });

  await sendOtpEmail(user.email, code);

  res.json({ maskedEmail: maskEmail(user.email) });
});

/* Step 3: verify OTP against stored record → issue session token.
   consumePendingSession atomically removes the pending token to
   prevent replay on verify-otp. */
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username, pendingToken, code } = parsed.data;
  const session = consumePendingSession(pendingToken, username);

  if (!session) {
    res.status(401).json({ error: "Unauthorized: please log in first" });
    return;
  }

  const now = new Date();

  const [otpRecord] = await db
    .select()
    .from(otpTokensTable)
    .where(
      and(
        eq(otpTokensTable.userId, session.userId),
        eq(otpTokensTable.code, code),
        eq(otpTokensTable.used, false),
        gt(otpTokensTable.expiresAt, now)
      )
    )
    .orderBy(otpTokensTable.createdAt)
    .limit(1);

  if (!otpRecord) {
    res.status(401).json({ error: "Invalid or expired OTP code" });
    return;
  }

  await db
    .update(otpTokensTable)
    .set({ used: true })
    .where(eq(otpTokensTable.id, otpRecord.id));

  const [user] = await db
    .select({ username: usersTable.username, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const sessionToken = createSession(session.userId, user.username, user.role);
  res.json({ sessionToken });
});

/* Logout: invalidate the session token */
router.post("/auth/logout", requireAuth, (req, res): void => {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    deleteSession(token);
  }
  res.status(204).send();
});

export default router;
