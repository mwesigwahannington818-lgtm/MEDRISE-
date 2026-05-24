import { pgTable, serial, integer, text, timestamp, date } from "drizzle-orm/pg-core";
import { adminsTable } from "./admins";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => adminsTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  shift: text("shift").notNull().default("day"),
  status: text("status").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  notes: text("notes"),
  recordedBy: integer("recorded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
