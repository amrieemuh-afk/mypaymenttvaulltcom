import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const submissionStatusEnum = pgEnum("submission_status", ["new", "handled"]);

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  city: text("city"),
  state: text("state"),
  inquiryType: text("inquiry_type"),
  message: text("message"),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  status: submissionStatusEnum("status").notNull().default("new"),
});

export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
