import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const patientQueueTable = pgTable("patient_queue", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id"),
  patientName: text("patient_name").notNull(),
  queueDate: text("queue_date").notNull(),
  status: text("status").notNull().default("waiting"),
  arrivalOrder: integer("arrival_order").notNull(),
  staffId: integer("staff_id"),
  staffName: text("staff_name"),
  priority: text("priority").notNull().default("normal"),
  notes: text("notes"),
  referralSource: text("referral_source").default("home"),
  referralFacility: text("referral_facility"),
  department: text("department").default("general"),
  transferNote: text("transfer_note"),
  diagnosis: text("diagnosis"),
  labInvestigations: text("lab_investigations"),
  imagingInvestigations: text("imaging_investigations"),
  managementPlan: text("management_plan"),
  vitalsSnapshot: text("vitals_snapshot"),
  notificationPhone: text("notification_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PatientQueue = typeof patientQueueTable.$inferSelect;
