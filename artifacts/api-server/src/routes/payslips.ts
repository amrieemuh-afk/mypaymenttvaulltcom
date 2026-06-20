import { Router } from "express";
import { db, payslipsTable, employeesTable, departmentsTable, payrollPeriodsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreatePayslipBody,
  UpdatePayslipBody,
  GetPayslipParams,
  UpdatePayslipParams,
  DeletePayslipParams,
  ListPayslipsQueryParams,
} from "@workspace/api-zod";
import { requireRole } from "../middleware/require-role";

const router = Router();

async function enrichPayslip(p: typeof payslipsTable.$inferSelect) {
  const [emp] = await db
    .select({
      name: employeesTable.name,
      employeeCode: employeesTable.employeeCode,
      position: employeesTable.position,
      departmentName: departmentsTable.name,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.id, p.employeeId));

  const [period] = await db.select({ month: payrollPeriodsTable.month, year: payrollPeriodsTable.year })
    .from(payrollPeriodsTable).where(eq(payrollPeriodsTable.id, p.periodId));

  return {
    ...p,
    employeeName: emp?.name ?? null,
    employeeCode: emp?.employeeCode ?? null,
    position: emp?.position ?? null,
    departmentName: emp?.departmentName ?? null,
    periodMonth: period?.month ?? null,
    periodYear: period?.year ?? null,
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
}

router.get("/", requireRole("admin"), async (req, res) => {
  const query = ListPayslipsQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query" });

  const conditions = [];
  if (query.data.periodId) conditions.push(eq(payslipsTable.periodId, query.data.periodId));
  if (query.data.employeeId) conditions.push(eq(payslipsTable.employeeId, query.data.employeeId));

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(payslipsTable.createdAt);

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

router.post("/", requireRole("admin"), async (req, res) => {
  const parsed = CreatePayslipBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });

  const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, parsed.data.employeeId));
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  const base = Number(emp.baseSalary);
  const transport = Number(emp.transportAllowance);
  const meal = Number(emp.mealAllowance);
  const gross = base + transport + meal;
  const bpjsTK = Math.round(base * 0.02);
  const bpjsKes = Math.round(base * 0.01);
  const pph21 = gross > 5000000 ? Math.round((gross - 5000000) * 0.05) : 0;
  const totalDed = bpjsTK + bpjsKes + pph21;
  const net = gross - totalDed;

  const [p] = await db.insert(payslipsTable).values({
    ...parsed.data,
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
  }).returning();

  res.status(201).json(await enrichPayslip(p));
});

router.get("/:id", requireRole("admin"), async (req, res) => {
  const params = GetPayslipParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const [p] = await db.select().from(payslipsTable).where(eq(payslipsTable.id, params.data.id));
  if (!p) return res.status(404).json({ error: "Payslip not found" });
  res.json(await enrichPayslip(p));
});

router.patch("/:id", requireRole("admin"), async (req, res) => {
  const params = UpdatePayslipParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdatePayslipBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  const [p] = await db.update(payslipsTable).set(parsed.data).where(eq(payslipsTable.id, params.data.id)).returning();
  if (!p) return res.status(404).json({ error: "Payslip not found" });
  res.json(await enrichPayslip(p));
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const params = DeletePayslipParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(payslipsTable).where(eq(payslipsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
