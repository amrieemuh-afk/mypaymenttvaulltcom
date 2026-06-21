import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const crewCredentialsTable = pgTable("crew_credentials", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().unique().references(() => employeesTable.id),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCrewCredentialSchema = createInsertSchema(crewCredentialsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrewCredential = z.infer<typeof insertCrewCredentialSchema>;
export type CrewCredential = typeof crewCredentialsTable.$inferSelect;
