import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const labOrdersTable = pgTable("lab_orders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  consultationId: integer("consultation_id"),
  orderedBy: integer("ordered_by"),
  testName: text("test_name").notNull(),
  testCategory: text("test_category"),
  priority: text("priority").notNull().default("routine"),
  status: text("status").notNull().default("pending"),
  clinicalInfo: text("clinical_info"),
  notes: text("notes"),
  orderedAt: timestamp("ordered_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const labResultsTable = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  labOrderId: integer("lab_order_id").references(() => labOrdersTable.id).notNull(),
  result: text("result"),
  unit: text("unit"),
  referenceRange: text("reference_range"),
  interpretation: text("interpretation"),
  notes: text("notes"),
  recordedBy: integer("recorded_by"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type LabOrder = typeof labOrdersTable.$inferSelect;
export type LabResult = typeof labResultsTable.$inferSelect;
