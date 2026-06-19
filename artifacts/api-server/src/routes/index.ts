import { Router, type IRouter } from "express";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import employeesRouter from "./employees";
import payrollPeriodsRouter from "./payroll-periods";
import payslipsRouter from "./payslips";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import { requireAuth, requirePrivilegedRole } from "../middleware/require-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use("/departments", requireAuth, requirePrivilegedRole, departmentsRouter);
router.use("/employees", requireAuth, requirePrivilegedRole, employeesRouter);
router.use("/payroll-periods", requireAuth, requirePrivilegedRole, payrollPeriodsRouter);
router.use("/payslips", requireAuth, requirePrivilegedRole, payslipsRouter);
router.use("/dashboard", requireAuth, requirePrivilegedRole, dashboardRouter);

export default router;
