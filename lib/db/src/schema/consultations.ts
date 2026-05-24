import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { adminsTable } from "./admins";

export const consultationsTable = pgTable("consultations", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  staffId: integer("staff_id").references(() => adminsTable.id),
  visitDate: text("visit_date").notNull(),
  chiefComplaint: text("chief_complaint"),
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatment_plan"),
  prescriptions: text("prescriptions"),
  referral: text("referral"),
  followUpDate: text("follow_up_date"),
  followUpStatus: text("follow_up_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Consultation = typeof consultationsTable.$inferSelect;
