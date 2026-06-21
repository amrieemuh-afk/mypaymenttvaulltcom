import { Request, Response, NextFunction } from "express";
import { lookupCrewSession } from "../lib/crew-sessions";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      crewEmployeeId?: number;
      crewUsername?: string;
    }
  }
}

export function requireCrewAuth(req: Request, res: Response, next: NextFunction): void {
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

  const session = lookupCrewSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.crewEmployeeId = session.employeeId;
  req.crewUsername = session.username;
  next();
}
