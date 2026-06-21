import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, otpTokensTable } from "@workspace/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendOtpEmail, maskEmail } from "../lib/email";
import {
  createPendingSession,
  lookupPendingSession,
  deletePendingSession,
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

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* Step 1: validate credentials → issue pending session token (demo: any credentials accepted) */
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username } = parsed.data;

  // Demo mode: accept any username/password — use a fixed demo user ID
  const DEMO_USER_ID = 0;
  const pendingToken = createPendingSession(DEMO_USER_ID, username);
  res.json({ pendingToken });
});

/* Step 2: send OTP — demo mode: always succeeds, no real email sent */
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

  // Demo mode: return a masked placeholder email, no real OTP sent
  res.json({ maskedEmail: "****@****.com" });
});

/* Step 3: verify OTP — demo mode: any 6-digit code accepted */
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
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

  deletePendingSession(pendingToken);

  // Demo mode: accept any 6-digit code, issue session token
  const sessionToken = createSession(session.userId, username);
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
