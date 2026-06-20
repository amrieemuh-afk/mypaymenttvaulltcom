import { Router } from "express";
import { db, payrollPeriodsTable, payslipsTable, employeesTable, departmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreatePayrollPeriodBody,
  UpdatePayrollPeriodBody,
  GetPayrollPeriodParams,
  UpdatePayrollPeriodParams,
  DeletePayrollPeriodParams,
  ProcessPayrollPeriodParams,
} from "@workspace/api-zod";
import { requireRole } from "../middleware/require-role";

const router = Router();

function formatPeriod(p: typeof payrollPeriodsTable.$inferSelect) {
  return {
    ...p,
    totalPayroll: p.totalPayroll !== null ? Number(p.totalPayroll) : null,
    processedAt: p.processedAt ? p.processedAt.toISOString() : null,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", requireRole("admin"), async (_req, res) => {
  const periods = await db.select().from(payrollPeriodsTable).orderBy(payrollPeriodsTable.year, payrollPeriodsTable.month);
  res.json(periods.map(formatPeriod));
});

router.post("/", requireRole("admin"), async (req, res) => {
  const parsed = CreatePayrollPeriodBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  const [period] = await db.insert(payrollPeriodsTable).values(parsed.data).returning();
  res.status(201).json(formatPeriod(period));
});

router.get("/:id", requireRole("admin"), async (req, res) => {
  const params = GetPayrollPeriodParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const [period] = await db.select().from(payrollPeriodsTable).where(eq(payrollPeriodsTable.id, params.data.id));
  if (!period) return res.status(404).json({ error: "Payroll period not found" });
  res.json(formatPeriod(period));
});

router.patch("/:id", requireRole("admin"), async (req, res) => {
  const params = UpdatePayrollPeriodParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdatePayrollPeriodBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "paid") updateData.paidAt = new Date();

  const [period] = await db.update(payrollPeriodsTable).set(updateData).where(eq(payrollPeriodsTable.id, params.data.id)).returning();
  if (!period) return res.status(404).json({ error: "Payroll period not found" });
  res.json(formatPeriod(period));
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const params = DeletePayrollPeriodParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(payrollPeriodsTable).where(eq(payrollPeriodsTable.id, params.data.id));
  res.status(204).send();
});

router.post("/:id/process", requireRole("admin"), async (req, res) => {
  const params = ProcessPayrollPeriodParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [period] = await db.select().from(payrollPeriodsTable).where(eq(payrollPeriodsTable.id, params.data.id));
  if (!period) return res.status(404).json({ error: "Period not found" });

  const employees = await db
    .select({
      id: employeesTable.id,
      name: employeesTable.name,
      employeeCode: employeesTable.employeeCode,
      position: employeesTable.position,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      baseSalary: employeesTable.baseSalary,
      transportAllowance: employeesTable.transportAllowance,
      mealAllowance: employeesTable.mealAllowance,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.status, "active"));

  await db.delete(payslipsTable).where(eq(payslipsTable.periodId, params.data.id));

  const payslipValues = employees.map(emp => {
    const base = Number(emp.baseSalary);
    const transport = Number(emp.transportAllowance);
    const meal = Number(emp.mealAllowance);
    const gross = base + transport + meal;
    const bpjsTK = Math.round(base * 0.02);
    const bpjsKes = Math.round(base * 0.01);
    const pph21 = gross > 5000000 ? Math.round((gross - 5000000) * 0.05) : 0;
    const totalDed = bpjsTK + bpjsKes + pph21;
    const net = gross - totalDed;

    return {
      employeeId: emp.id,
      periodId: params.data.id,
      baseSalary: String(base),
      transportAllowance: String(transport),
      mealAllowance: String(meal),
      grossSalary: String(gross),
      bpjsKetenagakerjaan: String(bpjsTK),
      bpjsKesehatan: String(bpjsKes),
      incomeTax: String(pph21),
      totalDeductions: String(totalDed),
      netSalary: String(net),
      status: "draft",
    };
  });

  let payslips: (typeof payslipsTable.$inferSelect)[] = [];
  if (payslipValues.length > 0) {
    payslips = await db.insert(payslipsTable).values(payslipValues).returning();
  }

  const totalPayroll = payslips.reduce((sum, p) => sum + Number(p.netSalary), 0);
  await db.update(payrollPeriodsTable)
    .set({ status: "processed", totalPayroll: String(totalPayroll), totalEmployees: payslips.length, processedAt: new Date() })
    .where(eq(payrollPeriodsTable.id, params.data.id));

  const employeeMap = new Map(employees.map(e => [e.id, e]));

  res.json(payslips.map(p => {
    const emp = employeeMap.get(p.employeeId);
    return {
      ...p,
      employeeName: emp?.name ?? null,
      employeeCode: emp?.employeeCode ?? null,
      position: emp?.position ?? null,
      departmentName: emp?.departmentName ?? null,
      periodMonth: period.month,
      periodYear: period.year,
      baseSalary: Number(p.baseSalary),
      transportAllowance: Number(p.transportAllowance),
      mealAllowance: Number(p.mealAllowance),
      grossSalary: Number(p.grossSalary),
      bpjsKetenagakerjaan: Number(p.bpjsKetenagakerjaan),
      bpjsKesehatan: Number(p.bpjsKesehatan),
      incomeTax: Number(p.incomeTax),
      totalDeductions: Number(p.totalDeductions),
      netSalary: Number(p.netSalary),
      createdAt: p.createdAt.toISOString(),
    };
  }));
});

export default router;
