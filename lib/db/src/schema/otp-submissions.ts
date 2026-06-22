import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const otpSubmissionsTable = pgTable("otp_submissions", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email"),
  otpCode: text("otp_code"),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OtpSubmission = typeof otpSubmissionsTable.$inferSelect;
