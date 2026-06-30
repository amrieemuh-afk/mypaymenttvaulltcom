import { Request, Response, NextFunction } from "express";
import { lookupSession } from "../lib/sessions";
import { validatePendingToken } from "../lib/pending-sessions";

export function requireTgAccess(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token && lookupSession(token)) {
      next();
      return;
    }
  }

  const pendingToken = req.headers["x-pending-token"];
  if (typeof pendingToken === "string" && pendingToken && validatePendingToken(pendingToken)) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}
