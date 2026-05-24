import { Router, type IRouter } from "express";
import { eq, ilike, desc } from "drizzle-orm";
import { db, pharmacyStockTable, pharmacyDispensingsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

const StockInputSchema = z.object({
  drugName: z.string().min(1),
  genericName: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().int().min(0),
  unit: z.string().min(1),
  reorderLevel: z.number().int().min(0).optional(),
  expiryDate: z.string().optional(),
  buyingPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const DispenseInputSchema = z.object({
  stockId: z.number().int(),
  quantity: z.number().int().min(1),
  patientId: z.number().int().optional(),
  consultationId: z.number().int().optional(),
  notes: z.string().optional(),
});

function mapStock(s: typeof pharmacyStockTable.$inferSelect) {
  return {
    ...s,
    buyingPrice: s.buyingPrice ? String(s.buyingPrice) : null,
    sellingPrice: s.sellingPrice ? String(s.sellingPrice) : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/pharmacy/stock", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const lowStock = req.query.lowStock === "true";
  let rows = search
    ? await db.select().from(pharmacyStockTable).where(ilike(pharmacyStockTable.drugName, `%${search}%`)).orderBy(pharmacyStockTable.drugName)
    : await db.select().from(pharmacyStockTable).orderBy(pharmacyStockTable.drugName);
  if (lowStock) rows = rows.filter(r => r.quantity <= r.reorderLevel);
  res.json(rows.map(mapStock));
});

router.post("/pharmacy/stock", async (req, res): Promise<void> => {
  const parsed = StockInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(pharmacyStockTable).values({
    drugName: parsed.data.drugName,
    genericName: parsed.data.genericName ?? null,
    category: parsed.data.category ?? null,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    reorderLevel: parsed.data.reorderLevel ?? 10,
    expiryDate: parsed.data.expiryDate ?? null,
    buyingPrice: parsed.data.buyingPrice !== undefined ? String(parsed.data.buyingPrice) : null,
    sellingPrice: parsed.data.sellingPrice !== undefined ? String(parsed.data.sellingPrice) : null,
    notes: parsed.data.notes ?? null,
  }).returning();
  logAudit(req, "add_drug_stock", { entityType: "pharmacy_stock", entityId: row.id, details: `${row.drugName} — qty ${row.quantity} ${row.unit}` }).catch(() => {});
  res.status(201).json(mapStock(row));
});

router.patch("/pharmacy/stock/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = StockInputSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.drugName !== undefined) updateData.drugName = parsed.data.drugName;
  if (parsed.data.genericName !== undefined) updateData.genericName = parsed.data.genericName;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.quantity !== undefined) updateData.quantity = parsed.data.quantity;
  if (parsed.data.unit !== undefined) updateData.unit = parsed.data.unit;
  if (parsed.data.reorderLevel !== undefined) updateData.reorderLevel = parsed.data.reorderLevel;
  if (parsed.data.expiryDate !== undefined) updateData.expiryDate = parsed.data.expiryDate;
  if (parsed.data.buyingPrice !== undefined) updateData.buyingPrice = String(parsed.data.buyingPrice);
  if (parsed.data.sellingPrice !== undefined) updateData.sellingPrice = String(parsed.data.sellingPrice);
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  const [row] = await db.update(pharmacyStockTable).set(updateData).where(eq(pharmacyStockTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "update_drug_stock", { entityType: "pharmacy_stock", entityId: row.id, details: row.drugName }).catch(() => {});
  res.json(mapStock(row));
});

router.delete("/pharmacy/stock/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(pharmacyStockTable).where(eq(pharmacyStockTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "delete_drug_stock", { entityType: "pharmacy_stock", entityId: row.id, details: row.drugName }).catch(() => {});
  res.sendStatus(204);
});

router.post("/pharmacy/dispense", async (req, res): Promise<void> => {
  const parsed = DispenseInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [stock] = await db.select().from(pharmacyStockTable).where(eq(pharmacyStockTable.id, parsed.data.stockId));
  if (!stock) { res.status(404).json({ error: "Stock item not found" }); return; }
  if (stock.quantity < parsed.data.quantity) { res.status(400).json({ error: "Insufficient stock" }); return; }
  const [updated] = await db.update(pharmacyStockTable).set({ quantity: stock.quantity - parsed.data.quantity, updatedAt: new Date() }).where(eq(pharmacyStockTable.id, parsed.data.stockId)).returning();
  await db.insert(pharmacyDispensingsTable).values({
    stockId: parsed.data.stockId,
    patientId: parsed.data.patientId ?? null,
    consultationId: parsed.data.consultationId ?? null,
    quantity: parsed.data.quantity,
    notes: parsed.data.notes ?? null,
  });
  logAudit(req, "dispense_drug", { entityType: "pharmacy_stock", entityId: stock.id, details: `${stock.drugName} — qty ${parsed.data.quantity} ${stock.unit}` }).catch(() => {});
  res.json(mapStock(updated));
});

router.get("/pharmacy/stats", async (req, res): Promise<void> => {
  const rows = await db.select().from(pharmacyStockTable);
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  res.json({
    totalItems: rows.length,
    lowStockItems: rows.filter(r => r.quantity > 0 && r.quantity <= r.reorderLevel).length,
    outOfStockItems: rows.filter(r => r.quantity === 0).length,
    expiringItems: rows.filter(r => r.expiryDate && r.expiryDate <= thirtyDays).length,
  });
});

export default router;
