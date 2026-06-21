import { Router } from "express";
import { db, announcementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const AnnouncementBody = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.enum(["info", "warning", "urgent"]).default("info"),
  audience: z.string().default("all"),
  publishedAt: z.string().optional(),
});

const AnnouncementUpdate = AnnouncementBody.partial();

router.get("/", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(announcementsTable)
    .orderBy(desc(announcementsTable.publishedAt));
  res.json(
    rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      category: a.category,
      audience: a.audience,
      publishedAt: a.publishedAt.toISOString(),
      createdAt: a.createdAt.toISOString(),
    })),
  );
});

router.post("/", async (req, res): Promise<void> => {
  const parsed = AnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { publishedAt, ...rest } = parsed.data;
  const [row] = await db
    .insert(announcementsTable)
    .values({
      ...rest,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    .returning();
  res.status(201).json({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    audience: row.audience,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, id));
  if (!row) { res.status(404).json({ error: "Announcement not found" }); return; }
  res.json({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    audience: row.audience,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });
});

router.patch("/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = AnnouncementUpdate.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { publishedAt, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (publishedAt) updateData.publishedAt = new Date(publishedAt);
  const [row] = await db
    .update(announcementsTable)
    .set(updateData)
    .where(eq(announcementsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Announcement not found" }); return; }
  res.json({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    audience: row.audience,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.status(204).send();
});

export default router;
