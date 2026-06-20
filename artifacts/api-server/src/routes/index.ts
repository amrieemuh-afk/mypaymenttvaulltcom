import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import employeesRouter from "./employees";
import payrollPeriodsRouter from "./payroll-periods";
import payslipsRouter from "./payslips";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import { requireAuth, requireRole } from "../middleware/require-auth";

const router: IRouter = Router();

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Returns middleware that enforces different role sets for read vs write requests.
 * This ensures sensitive data is only accessible to explicitly allowed roles
 * regardless of HTTP method.
 */
function requireRoleByMethod(readRoles: string[], writeRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const allowed = WRITE_METHODS.includes(req.method) ? writeRoles : readRoles;
    requireRole(allowed)(req, res, next);
  };
}

router.use(healthRouter);
router.use(authRouter);

// departments: HR and admin manage structure; finance needs read access for payroll context
router.use(
  "/departments",
  requireAuth,
  requireRoleByMethod(["admin", "hr", "finance"], ["admin", "hr"]),
  departmentsRouter,
);

// employees: HR and admin manage records; finance needs read access for payroll processing
router.use(
  "/employees",
  requireAuth,
  requireRoleByMethod(["admin", "hr", "finance"], ["admin", "hr"]),
  employeesRouter,
);

// payroll-periods: finance and admin process payroll; HR needs read access for reporting
router.use(
  "/payroll-periods",
  requireAuth,
  requireRoleByMethod(["admin", "hr", "finance"], ["admin", "finance"]),
  payrollPeriodsRouter,
);

// payslips: finance and admin manage payslips; HR needs read access for reporting
router.use(
  "/payslips",
  requireAuth,
  requireRoleByMethod(["admin", "hr", "finance"], ["admin", "finance"]),
  payslipsRouter,
);

// dashboard: read-only aggregate view for all internal roles
router.use(
  "/dashboard",
  requireAuth,
  requireRole(["admin", "hr", "finance"]),
  dashboardRouter,
);

export default router;
