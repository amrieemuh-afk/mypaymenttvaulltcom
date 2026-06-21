import { Router } from "express";
import { db, notificationLogsTable } from "@workspace/db";
import { desc, and, gte, lte, eq } from "drizzle-orm";

const router = Router();

router.get("/log", async (req, res): Promise<void> => {
  const { eventType, from, to, limit: limitParam } = req.query;

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
      sentAt: r.sentAt.toISOString(),
    })),
  );
});

export default router;
