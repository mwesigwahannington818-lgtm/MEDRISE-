import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { adminsTable } from "./admins";

export const shiftsTable = pgTable("shifts", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => adminsTable.id).notNull(),
  date: text("date").notNull(),
  shift: text("shift").notNull().default("day"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  notes: text("notes"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaveRequestsTable = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => adminsTable.id).notNull(),
  leaveType: text("leave_type").notNull().default("annual"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  approvedBy: integer("approved_by"),
  approverNotes: text("approver_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Shift = typeof shiftsTable.$inferSelect;
export type LeaveRequest = typeof leaveRequestsTable.$inferSelect;
