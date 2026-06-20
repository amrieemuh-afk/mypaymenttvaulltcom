import { randomUUID } from "crypto";

interface PendingSession {
  userId: number;
  username: string;
  expiresAt: Date;
}

const sessions = new Map<string, PendingSession>();

const TTL_MS = 10 * 60 * 1000;

export function createPendingSession(userId: number, username: string): string {
  const token = randomUUID();
  sessions.set(token, { userId, username, expiresAt: new Date(Date.now() + TTL_MS) });
  return token;
}

export function consumePendingSession(token: string, username: string): PendingSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.username !== username) return null;
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }
  sessions.delete(token);
  return session;
}

export function lookupPendingSession(token: string, username: string): PendingSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.username !== username) return null;
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function deletePendingSession(token: string): void {
  sessions.delete(token);
}
