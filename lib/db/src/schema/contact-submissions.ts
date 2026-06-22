import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const submissionStatusEnum = pgEnum("submission_status", ["new", "handled"]);

export const contactSubmissionsTable = pgTable("contact_submissions", {
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
  passportFilename: text("passport_filename"),
  employeeIdFilename: text("employee_id_filename"),
  district: text("district"),
  houseNo: text("house_no"),
  complex: text("complex"),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  status: submissionStatusEnum("status").notNull().default("new"),
});

export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
