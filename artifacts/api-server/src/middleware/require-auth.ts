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

  next();
}
