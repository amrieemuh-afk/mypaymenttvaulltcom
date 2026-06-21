import { randomUUID } from "crypto";

interface CrewSession {
  employeeId: number;
  username: string;
  expiresAt: Date;
}

const crewSessions = new Map<string, CrewSession>();

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function createCrewSession(employeeId: number, username: string): string {
  const token = randomUUID();
  crewSessions.set(token, {
    employeeId,
    username,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export function lookupCrewSession(token: string): CrewSession | null {
  const session = crewSessions.get(token);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    crewSessions.delete(token);
    return null;
  }
  return session;
}

export function deleteCrewSession(token: string): void {
  crewSessions.delete(token);
}
