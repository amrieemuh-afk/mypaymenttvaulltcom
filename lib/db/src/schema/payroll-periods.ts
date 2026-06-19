import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const payrollPeriodsTable = pgTable("payroll_periods", {
  id: serial("id").primaryKey(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull().default("draft"),
  totalPayroll: numeric("total_payroll", { precision: 15, scale: 2 }),
  totalEmployees: integer("total_employees"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriodsTable).omit({ id: true, createdAt: true, updatedAt: true, processedAt: true, paidAt: true });
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type PayrollPeriod = typeof payrollPeriodsTable.$inferSelect;
