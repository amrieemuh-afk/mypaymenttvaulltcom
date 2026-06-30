import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const personalSubmissionsTable = pgTable("personal_submissions", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  city: text("city"),
  state: text("state"),
  inquiryType: text("inquiry_type"),
  message: text("message"),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PersonalSubmission = typeof personalSubmissionsTable.$inferSelect;
