import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const workSchedulesTable = pgTable("work_schedules", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  date: date("date", { mode: "string" }).notNull(),
  shift: text("shift").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWorkScheduleSchema = createInsertSchema(workSchedulesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;
export type WorkSchedule = typeof workSchedulesTable.$inferSelect;
