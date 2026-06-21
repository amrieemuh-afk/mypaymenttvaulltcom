import { Request, Response, NextFunction } from "express";
import { lookupCrewSession } from "../lib/crew-sessions";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      crewEmployeeId?: number;
      crewUsername?: string;
      crewSessionToken?: string;
    }
  }
}

const CHANGE_PASSWORD_ALLOWED_PATHS = ["/auth/change-password", "/auth/logout"];

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

  if (session.mustChangePassword) {
    const allowed = CHANGE_PASSWORD_ALLOWED_PATHS.some((p) => req.path === p || req.path.startsWith(p));
    if (!allowed) {
      res.status(403).json({ error: "Anda harus mengganti kata sandi terlebih dahulu.", mustChangePassword: true });
      return;
    }
  }

  req.crewEmployeeId = session.employeeId;
  req.crewUsername = session.username;
  req.crewSessionToken = token;
  next();
}
