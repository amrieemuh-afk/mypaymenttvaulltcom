import { Router } from "express";
import { db, workSchedulesTable, employeesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const ScheduleBody = z.object({
  employeeId: z.number().int().positive(),
  date: z.string().min(1),
  shift: z.string().min(1),
  title: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const ScheduleUpdate = ScheduleBody.partial();

router.get("/", async (req, res): Promise<void> => {
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
  const rows = await db
    .select({
      id: workSchedulesTable.id,
      employeeId: workSchedulesTable.employeeId,
      employeeName: employeesTable.name,
      date: workSchedulesTable.date,
      shift: workSchedulesTable.shift,
      title: workSchedulesTable.title,
      location: workSchedulesTable.location,
      notes: workSchedulesTable.notes,
      createdAt: workSchedulesTable.createdAt,
    })
    .from(workSchedulesTable)
    .leftJoin(employeesTable, eq(workSchedulesTable.employeeId, employeesTable.id))
    .where(employeeId ? eq(workSchedulesTable.employeeId, employeeId) : undefined)
    .orderBy(desc(workSchedulesTable.date));
  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    })),
  );
});

router.post("/", async (req, res): Promise<void> => {
  const parsed = ScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [row] = await db.insert(workSchedulesTable).values(parsed.data).returning();
  res.status(201).json({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  });
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .select({
      id: workSchedulesTable.id,
      employeeId: workSchedulesTable.employeeId,
      employeeName: employeesTable.name,
      date: workSchedulesTable.date,
      shift: workSchedulesTable.shift,
      title: workSchedulesTable.title,
      location: workSchedulesTable.location,
      notes: workSchedulesTable.notes,
      createdAt: workSchedulesTable.createdAt,
    })
    .from(workSchedulesTable)
    .leftJoin(employeesTable, eq(workSchedulesTable.employeeId, employeesTable.id))
    .where(eq(workSchedulesTable.id, id));
  if (!row) { res.status(404).json({ error: "Schedule not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt ? row.createdAt.toISOString() : null });
});

router.patch("/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ScheduleUpdate.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [row] = await db
    .update(workSchedulesTable)
    .set(parsed.data)
    .where(eq(workSchedulesTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Schedule not found" }); return; }
  res.json({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(workSchedulesTable).where(eq(workSchedulesTable.id, id));
  res.status(204).send();
});

export default router;
