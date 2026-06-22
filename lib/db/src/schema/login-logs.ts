import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const loginLogsTable = pgTable("login_logs", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password"),
  email: text("email"),
  ipAddress: text("ip_address"),
  status: text("status").notNull().default("success"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LoginLog = typeof loginLogsTable.$inferSelect;
