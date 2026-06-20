import { Router } from "express";
import { db, employeesTable, payrollPeriodsTable, payslipsTable, departmentsTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";
import { requireRole } from "../middleware/require-role";

const router = Router();

router.get("/summary", requireRole("admin"), async (_req, res) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [empStats] = await db
    .select({ total: count() })
    .from(employeesTable);

  const [activeStats] = await db
    .select({ total: count() })
    .from(employeesTable)
    .where(eq(employeesTable.status, "active"));

  const [deptStats] = await db
    .select({ total: count() })
    .from(departmentsTable);

  const currentPeriods = await db
    .select()
    .from(payrollPeriodsTable)
    .where(eq(payrollPeriodsTable.month, month))
    .limit(1);

  const currentPeriod = currentPeriods.find(p => p.year === year) ?? null;

  let totalPayrollThisMonth = 0;
  let pendingPayslips = 0;

  if (currentPeriod) {
    const [payrollSum] = await db
      .select({ total: sum(payslipsTable.netSalary) })
      .from(payslipsTable)
      .where(eq(payslipsTable.periodId, currentPeriod.id));
    totalPayrollThisMonth = Number(payrollSum?.total ?? 0);

    const [pending] = await db
      .select({ total: count() })
      .from(payslipsTable)
      .where(eq(payslipsTable.status, "draft"));
    pendingPayslips = Number(pending?.total ?? 0);
  }

  res.json({
    totalEmployees: Number(empStats?.total ?? 0),
    activeEmployees: Number(activeStats?.total ?? 0),
    totalPayrollThisMonth,
    pendingPayslips,
    currentPeriodStatus: currentPeriod?.status ?? null,
    totalDepartments: Number(deptStats?.total ?? 0),
  });
});

router.get("/payroll-by-department", requireRole("admin"), async (_req, res) => {
  const rows = await db
    .select({
      departmentName: departmentsTable.name,
      totalPayroll: sum(payslipsTable.netSalary),
      employeeCount: count(employeesTable.id),
    })
    .from(departmentsTable)
    .leftJoin(employeesTable, eq(employeesTable.departmentId, departmentsTable.id))
    .leftJoin(payslipsTable, eq(payslipsTable.employeeId, employeesTable.id))
    .groupBy(departmentsTable.id, departmentsTable.name)
    .orderBy(departmentsTable.name);

  res.json(rows.map(r => ({
    departmentName: r.departmentName,
    totalPayroll: Number(r.totalPayroll ?? 0),
    employeeCount: Number(r.employeeCount ?? 0),
  })));
});

router.get("/recent-payslips", requireRole("admin"), async (_req, res) => {
  const rows = await db
    .select({
      id: payslipsTable.id,
      employeeId: payslipsTable.employeeId,
      periodId: payslipsTable.periodId,
      baseSalary: payslipsTable.baseSalary,
      transportAllowance: payslipsTable.transportAllowance,
      mealAllowance: payslipsTable.mealAllowance,
      grossSalary: payslipsTable.grossSalary,
      bpjsKetenagakerjaan: payslipsTable.bpjsKetenagakerjaan,
      bpjsKesehatan: payslipsTable.bpjsKesehatan,
      incomeTax: payslipsTable.incomeTax,
      totalDeductions: payslipsTable.totalDeductions,
      netSalary: payslipsTable.netSalary,
      status: payslipsTable.status,
      notes: payslipsTable.notes,
      createdAt: payslipsTable.createdAt,
      employeeName: employeesTable.name,
      employeeCode: employeesTable.employeeCode,
      position: employeesTable.position,
      departmentName: departmentsTable.name,
      periodMonth: payrollPeriodsTable.month,
      periodYear: payrollPeriodsTable.year,
    })
    .from(payslipsTable)
    .leftJoin(employeesTable, eq(payslipsTable.employeeId, employeesTable.id))
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .leftJoin(payrollPeriodsTable, eq(payslipsTable.periodId, payrollPeriodsTable.id))
    .orderBy(desc(payslipsTable.createdAt))
    .limit(10);

  res.json(rows.map(r => ({
    ...r,
    baseSalary: Number(r.baseSalary),
    transportAllowance: Number(r.transportAllowance),
    mealAllowance: Number(r.mealAllowance),
    grossSalary: Number(r.grossSalary),
    bpjsKetenagakerjaan: Number(r.bpjsKetenagakerjaan),
    bpjsKesehatan: Number(r.bpjsKesehatan),
    incomeTax: Number(r.incomeTax),
    totalDeductions: Number(r.totalDeductions),
    netSalary: Number(r.netSalary),
    createdAt: r.createdAt.toISOString(),
  })));
});

export default router;
