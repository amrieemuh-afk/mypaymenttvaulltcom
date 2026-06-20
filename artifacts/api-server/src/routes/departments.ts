import { Router } from "express";
import { db, departmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDepartmentBody, UpdateDepartmentBody, GetDepartmentParams, UpdateDepartmentParams, DeleteDepartmentParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const departments = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(departments.map(d => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }
  const [dept] = await db.insert(departmentsTable).values(parsed.data).returning();
  res.status(201).json({ ...dept, createdAt: dept.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const params = GetDepartmentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, params.data.id));
  if (!dept) return res.status(404).json({ error: "Department not found" });
  res.json({ ...dept, createdAt: dept.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const params = UpdateDepartmentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateDepartmentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  const [dept] = await db.update(departmentsTable).set(parsed.data).where(eq(departmentsTable.id, params.data.id)).returning();
  if (!dept) return res.status(404).json({ error: "Department not found" });
  res.json({ ...dept, createdAt: dept.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const params = DeleteDepartmentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(departmentsTable).where(eq(departmentsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
