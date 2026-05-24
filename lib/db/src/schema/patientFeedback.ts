import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const patientFeedbackTable = pgTable("patient_feedback", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  phone: text("phone"),
  service: text("service"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  wouldRecommend: text("would_recommend"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PatientFeedback = typeof patientFeedbackTable.$inferSelect;
