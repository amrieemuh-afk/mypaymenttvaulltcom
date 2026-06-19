import { Router, type IRouter } from "express";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import employeesRouter from "./employees";
import payrollPeriodsRouter from "./payroll-periods";
import payslipsRouter from "./payslips";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import { requireAuth, requireWriteRole } from "../middleware/require-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use("/departments", requireAuth, requireWriteRole, departmentsRouter);
router.use("/employees", requireAuth, requireWriteRole, employeesRouter);
router.use("/payroll-periods", requireAuth, requireWriteRole, payrollPeriodsRouter);
router.use("/payslips", requireAuth, requireWriteRole, payslipsRouter);
router.use("/dashboard", requireAuth, dashboardRouter);

export default router;
