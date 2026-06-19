import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";
import { payrollPeriodsTable } from "./payroll-periods";

export const payslipsTable = pgTable("payslips", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  periodId: integer("period_id").notNull().references(() => payrollPeriodsTable.id),
  baseSalary: numeric("base_salary", { precision: 15, scale: 2 }).notNull().default("0"),
  transportAllowance: numeric("transport_allowance", { precision: 15, scale: 2 }).notNull().default("0"),
  mealAllowance: numeric("meal_allowance", { precision: 15, scale: 2 }).notNull().default("0"),
  grossSalary: numeric("gross_salary", { precision: 15, scale: 2 }).notNull().default("0"),
  bpjsKetenagakerjaan: numeric("bpjs_ketenagakerjaan", { precision: 15, scale: 2 }).notNull().default("0"),
  bpjsKesehatan: numeric("bpjs_kesehatan", { precision: 15, scale: 2 }).notNull().default("0"),
  incomeTax: numeric("income_tax", { precision: 15, scale: 2 }).notNull().default("0"),
  totalDeductions: numeric("total_deductions", { precision: 15, scale: 2 }).notNull().default("0"),
  netSalary: numeric("net_salary", { precision: 15, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPayslipSchema = createInsertSchema(payslipsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayslip = z.infer<typeof insertPayslipSchema>;
export type Payslip = typeof payslipsTable.$inferSelect;
