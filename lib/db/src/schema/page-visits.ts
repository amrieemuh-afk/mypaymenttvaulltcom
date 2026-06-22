import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pageVisitsTable = pgTable("page_visits", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  visitedAt: timestamp("visited_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PageVisit = typeof pageVisitsTable.$inferSelect;
