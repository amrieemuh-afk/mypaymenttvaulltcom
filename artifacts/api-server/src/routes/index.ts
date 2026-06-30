import { Router, type IRouter } from "express";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import employeesRouter from "./employees";
import payrollPeriodsRouter from "./payroll-periods";
import payslipsRouter from "./payslips";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import crewRouter from "./crew";
import announcementsRouter from "./announcements";
import schedulesRouter from "./schedules";
import notificationsRouter from "./notifications";
import submissionsRouter from "./submissions";
import tgRouter from "./tg";
import supportTgRouter from "./support-tg";
import trackRouter from "./track";
import { requireAuth } from "../middleware/require-auth";
import { requireTgAccess } from "../middleware/require-tg-access";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(submissionsRouter);
router.use("/tg", requireTgAccess, tgRouter);
router.use(supportTgRouter);
router.use(trackRouter);
router.use("/crew", crewRouter);

router.use("/departments", requireAuth, departmentsRouter);
router.use("/employees", requireAuth, employeesRouter);
router.use("/payroll-periods", requireAuth, payrollPeriodsRouter);
router.use("/payslips", requireAuth, payslipsRouter);
router.use("/dashboard", requireAuth, dashboardRouter);
router.use("/announcements", requireAuth, announcementsRouter);
router.use("/schedules", requireAuth, schedulesRouter);
router.use("/notifications", requireAuth, notificationsRouter);

export default router;
