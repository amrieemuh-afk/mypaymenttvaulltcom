import { pgTable, serial, text, numeric, integer, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { departmentsTable } from "./departments";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeCode: text("employee_code").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  position: text("position").notNull(),
  departmentId: integer("department_id").notNull().references(() => departmentsTable.id),
  baseSalary: numeric("base_salary", { precision: 15, scale: 2 }).notNull().default("0"),
  transportAllowance: numeric("transport_allowance", { precision: 15, scale: 2 }).notNull().default("0"),
  mealAllowance: numeric("meal_allowance", { precision: 15, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"),
  profileVerified: boolean("profile_verified").notNull().default(false),
  joinDate: date("join_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
