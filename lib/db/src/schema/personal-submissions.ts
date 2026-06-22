import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const personalSubmissionsTable = pgTable("personal_submissions", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  dob: text("dob"),
  inquiryType: text("inquiry_type"),
  message: text("message"),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PersonalSubmission = typeof personalSubmissionsTable.$inferSelect;
