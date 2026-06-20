import { Router } from "express";
import { db, employeesTable, departmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
  ListEmployeesQueryParams,
} from "@workspace/api-zod";
import { requireRole } from "../middleware/require-role";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListEmployeesQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: "Invalid query params" });

  const conditions = [];
  if (query.data.departmentId) {
    conditions.push(eq(employeesTable.departmentId, query.data.departmentId));
  }
  if (query.data.status) {
    conditions.push(eq(employeesTable.status, query.data.status));
  }

  const rows = await db
    .select({
      id: employeesTable.id,
      employeeCode: employeesTable.employeeCode,
      name: employeesTable.name,
      email: employeesTable.email,
      phone: employeesTable.phone,
      position: employeesTable.position,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      baseSalary: employeesTable.baseSalary,
      transportAllowance: employeesTable.transportAllowance,
      mealAllowance: employeesTable.mealAllowance,
      status: employeesTable.status,
      joinDate: employeesTable.joinDate,
      createdAt: employeesTable.createdAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(employeesTable.name);

  res.json(rows.map(r => ({
    ...r,
    baseSalary: Number(r.baseSalary),
    transportAllowance: Number(r.transportAllowance),
    mealAllowance: Number(r.mealAllowance),
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/", requireRole("admin"), async (req, res) => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });

  const [emp] = await db.insert(employeesTable).values({
    ...parsed.data,
    baseSalary: String(parsed.data.baseSalary ?? 0),
    transportAllowance: String(parsed.data.transportAllowance ?? 0),
    mealAllowance: String(parsed.data.mealAllowance ?? 0),
    status: parsed.data.status ?? "active",
  }).returning();

  const [dept] = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, emp.departmentId));

  res.status(201).json({
    ...emp,
    departmentName: dept?.name ?? null,
    baseSalary: Number(emp.baseSalary),
    transportAllowance: Number(emp.transportAllowance),
    mealAllowance: Number(emp.mealAllowance),
    createdAt: emp.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const params = GetEmployeeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db
    .select({
      id: employeesTable.id,
      employeeCode: employeesTable.employeeCode,
      name: employeesTable.name,
      email: employeesTable.email,
      phone: employeesTable.phone,
      position: employeesTable.position,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      baseSalary: employeesTable.baseSalary,
      transportAllowance: employeesTable.transportAllowance,
      mealAllowance: employeesTable.mealAllowance,
      status: employeesTable.status,
      joinDate: employeesTable.joinDate,
      createdAt: employeesTable.createdAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.id, params.data.id));

  if (!row) return res.status(404).json({ error: "Employee not found" });

  res.json({
    ...row,
    baseSalary: Number(row.baseSalary),
    transportAllowance: Number(row.transportAllowance),
    mealAllowance: Number(row.mealAllowance),
    createdAt: row.createdAt.toISOString(),
  });
});

router.patch("/:id", requireRole("admin"), async (req, res) => {
  const params = UpdateEmployeeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.baseSalary !== undefined) updateData.baseSalary = String(parsed.data.baseSalary);
  if (parsed.data.transportAllowance !== undefined) updateData.transportAllowance = String(parsed.data.transportAllowance);
  if (parsed.data.mealAllowance !== undefined) updateData.mealAllowance = String(parsed.data.mealAllowance);

  const [emp] = await db.update(employeesTable).set(updateData).where(eq(employeesTable.id, params.data.id)).returning();
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  const [dept] = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, emp.departmentId));

  res.json({
    ...emp,
    departmentName: dept?.name ?? null,
    baseSalary: Number(emp.baseSalary),
    transportAllowance: Number(emp.transportAllowance),
    mealAllowance: Number(emp.mealAllowance),
    createdAt: emp.createdAt.toISOString(),
  });
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const params = DeleteEmployeeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(employeesTable).where(eq(employeesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
