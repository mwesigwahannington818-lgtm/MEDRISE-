import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, invoicesTable, invoiceItemsTable, patientsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

const ItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

const InvoiceInputSchema = z.object({
  patientId: z.number().int(),
  consultationId: z.number().int().optional(),
  notes: z.string().optional(),
  items: z.array(ItemSchema).min(1),
});

const InvoiceUpdateSchema = z.object({
  status: z.enum(["unpaid", "partial", "paid", "cancelled"]).optional(),
  paidAmount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

let invoiceCounter = 1000;

async function mapInvoice(inv: typeof invoicesTable.$inferSelect) {
  const patient = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, inv.patientId)).then(r => r[0]);
  const items = await db.select().from(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, inv.id));
  return {
    ...inv,
    patientName: patient?.fullName ?? null,
    totalAmount: String(inv.totalAmount),
    paidAmount: String(inv.paidAmount),
    items: items.map(i => ({ ...i, unitPrice: String(i.unitPrice), amount: String(i.amount) })),
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  };
}

router.get("/billing", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  let query = db.select().from(invoicesTable).$dynamic();
  if (patientId) query = query.where(eq(invoicesTable.patientId, patientId));
  const rows = await query.orderBy(desc(invoicesTable.createdAt));
  const filtered = status ? rows.filter(r => r.status === status) : rows;
  const mapped = await Promise.all(filtered.map(mapInvoice));
  res.json(mapped);
});

router.post("/billing", async (req, res): Promise<void> => {
  const parsed = InvoiceInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const total = parsed.data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  invoiceCounter++;
  const invNumber = `INV-${new Date().getFullYear()}-${String(invoiceCounter).padStart(4, "0")}`;
  const [inv] = await db.insert(invoicesTable).values({
    patientId: parsed.data.patientId,
    consultationId: parsed.data.consultationId ?? null,
    invoiceNumber: invNumber,
    totalAmount: String(total),
    notes: parsed.data.notes ?? null,
  }).returning();
  for (const item of parsed.data.items) {
    await db.insert(invoiceItemsTable).values({
      invoiceId: inv.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      amount: String(item.quantity * item.unitPrice),
    });
  }
  logAudit(req, "create_invoice", { entityType: "invoice", entityId: inv.id, details: `${invNumber} — UGX ${total.toLocaleString()}` }).catch(() => {});
  res.status(201).json(await mapInvoice(inv));
});

router.get("/billing/stats/summary", async (req, res): Promise<void> => {
  const rows = await db.select().from(invoicesTable);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const totalRevenue = rows.reduce((s, r) => s + parseFloat(String(r.totalAmount)), 0);
  const totalPaid = rows.filter(r => r.status === "paid").reduce((s, r) => s + parseFloat(String(r.totalAmount)), 0);
  const totalUnpaid = rows.filter(r => r.status === "unpaid" || r.status === "partial").reduce((s, r) => s + parseFloat(String(r.totalAmount)) - parseFloat(String(r.paidAmount)), 0);
  const thisMonthRevenue = rows.filter(r => r.createdAt.toISOString().slice(0, 10) >= monthStart).reduce((s, r) => s + parseFloat(String(r.paidAmount)), 0);
  res.json({ totalInvoices: rows.length, totalRevenue: totalRevenue.toFixed(2), totalPaid: totalPaid.toFixed(2), totalUnpaid: totalUnpaid.toFixed(2), thisMonthRevenue: thisMonthRevenue.toFixed(2) });
});

router.get("/billing/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await mapInvoice(inv));
});

router.patch("/billing/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = InvoiceUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.paidAmount !== undefined) updateData.paidAmount = String(parsed.data.paidAmount);
  if (parsed.data.paymentMethod) updateData.paymentMethod = parsed.data.paymentMethod;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  const [inv] = await db.update(invoicesTable).set(updateData).where(eq(invoicesTable.id, id)).returning();
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  if (parsed.data.status === "paid" || parsed.data.paidAmount !== undefined) {
    logAudit(req, "record_payment", { entityType: "invoice", entityId: inv.id, details: `${inv.invoiceNumber} — ${parsed.data.paymentMethod ?? "cash"} — UGX ${parsed.data.paidAmount ?? inv.paidAmount}` }).catch(() => {});
  }
  res.json(await mapInvoice(inv));
});

router.delete("/billing/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, id));
  const [inv] = await db.delete(invoicesTable).where(eq(invoicesTable.id, id)).returning();
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "delete_invoice", { entityType: "invoice", entityId: inv.id, details: inv.invoiceNumber }).catch(() => {});
  res.sendStatus(204);
});

export default router;
