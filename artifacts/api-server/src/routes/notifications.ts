import { Router } from "express";
import { db, notificationLogsTable } from "@workspace/db";
import { desc, and, gte, lte, eq } from "drizzle-orm";

const router = Router();

router.get("/log", async (req, res): Promise<void> => {
  const { eventType, from, to, limit: limitParam, since } = req.query;

  const conditions = [];

  if (typeof eventType === "string" && eventType) {
    conditions.push(eq(notificationLogsTable.eventType, eventType));
  }

  if (typeof from === "string" && from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      conditions.push(gte(notificationLogsTable.sentAt, fromDate));
    }
  }

  if (typeof to === "string" && to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(notificationLogsTable.sentAt, toDate));
    }
  }

  if (typeof since === "string" && since) {
    const sinceDate = new Date(since);
    if (!isNaN(sinceDate.getTime())) {
      conditions.push(gte(notificationLogsTable.sentAt, sinceDate));
    }
  }

  const limit = Math.min(Number(limitParam) || 100, 500);

  const rows = await db
    .select()
    .from(notificationLogsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(notificationLogsTable.sentAt))
    .limit(limit);

  res.json(
    rows.map((r) => ({
      id: r.id,
      eventType: r.eventType,
      crewName: r.crewName,
      message: r.message,
      success: r.success,
      errorMessage: r.errorMessage,
      retryCount: r.retryCount,
      sentAt: r.sentAt.toISOString(),
    })),
  );
});

router.delete("/log", async (_req, res): Promise<void> => {
  await db.delete(notificationLogsTable);
  res.status(204).end();
});

router.delete("/log/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(notificationLogsTable).where(eq(notificationLogsTable.id, id));
  res.status(204).end();
});

export default router;
