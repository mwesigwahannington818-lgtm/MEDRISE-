import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";

export const pharmacyStockTable = pgTable("pharmacy_stock", {
  id: serial("id").primaryKey(),
  drugName: text("drug_name").notNull(),
  genericName: text("generic_name"),
  category: text("category"),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull().default("units"),
  reorderLevel: integer("reorder_level").notNull().default(10),
  expiryDate: text("expiry_date"),
  buyingPrice: numeric("buying_price", { precision: 12, scale: 2 }),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pharmacyDispensingsTable = pgTable("pharmacy_dispensings", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").references(() => pharmacyStockTable.id).notNull(),
  patientId: integer("patient_id"),
  consultationId: integer("consultation_id"),
  quantity: integer("quantity").notNull(),
  dispensedBy: integer("dispensed_by"),
  dispensedAt: timestamp("dispensed_at").defaultNow().notNull(),
  notes: text("notes"),
});

export type PharmacyStock = typeof pharmacyStockTable.$inferSelect;
export type PharmacyDispensing = typeof pharmacyDispensingsTable.$inferSelect;
