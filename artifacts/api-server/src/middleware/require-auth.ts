import { Request, Response, NextFunction } from "express";
import { lookupSession } from "../lib/sessions";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const session = lookupSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.locals.userId = session.userId;
  res.locals.username = session.username;
  res.locals.role = session.role;

  next();
}

const PRIVILEGED_ROLES = new Set(["admin", "hr", "finance"]);

/**
 * Blocks ALL requests (reads and writes) for users without a privileged role.
 * Use on routes that expose org-wide PII or financial data.
 */
export function requirePrivilegedRole(req: Request, res: Response, next: NextFunction): void {
  const role = res.locals.role as string | undefined;
  if (!role || !PRIVILEGED_ROLES.has(role)) {
    res.status(403).json({ error: "Forbidden: insufficient permissions" });
    return;
  }
  next();
}
