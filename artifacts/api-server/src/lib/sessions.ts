import { randomUUID } from "crypto";

interface Session {
  userId: number;
  username: string;
  role: string;
  expiresAt: Date;
}

const sessions = new Map<string, Session>();

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function createSession(userId: number, username: string, role: string): string {
  const token = randomUUID();
  sessions.set(token, {
    userId,
    username,
    role,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export function lookupSession(token: string): Session | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}
