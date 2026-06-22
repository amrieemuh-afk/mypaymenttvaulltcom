import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const notificationLogsTable = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  crewName: text("crew_name"),
  message: text("message").notNull(),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NotificationLog = typeof notificationLogsTable.$inferSelect;
