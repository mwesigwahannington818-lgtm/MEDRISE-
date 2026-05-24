import { Router, type IRouter } from "express";
import { db, patientsTable, consultationsTable, appointmentsTable, invoicesTable, labOrdersTable, pharmacyStockTable, attendanceTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/reports/summary", async (req, res): Promise<void> => {
  const month = typeof req.query.month === "string" ? req.query.month : new Date().toISOString().slice(0, 7);
  const monthStart = `${month}-01`;
  const nextMonth = new Date(monthStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const monthEnd = nextMonth.toISOString().slice(0, 10);

  const [
    allPatients,
    consultations,
    appointments,
    invoices,
    labOrders,
    stockItems,
    attendanceRecords,
  ] = await Promise.all([
    db.select().from(patientsTable),
    db.select().from(consultationsTable),
    db.select().from(appointmentsTable),
    db.select().from(invoicesTable),
    db.select().from(labOrdersTable),
    db.select().from(pharmacyStockTable),
    db.select().from(attendanceTable),
  ]);

  const newPatients = allPatients.filter(p => p.createdAt.toISOString().slice(0, 10) >= monthStart && p.createdAt.toISOString().slice(0, 10) < monthEnd).length;
  const monthConsultations = consultations.filter(c => c.visitDate >= monthStart && c.visitDate < monthEnd).length;
  const monthAppointments = appointments.filter(a => a.preferredDate >= monthStart && a.preferredDate < monthEnd);
  const completedAppts = monthAppointments.filter(a => a.status === "completed").length;
  const monthInvoices = invoices.filter(i => i.createdAt.toISOString().slice(0, 10) >= monthStart && i.createdAt.toISOString().slice(0, 10) < monthEnd);
  const totalRevenue = monthInvoices.reduce((s, i) => s + parseFloat(String(i.paidAmount)), 0);
  const monthLabOrders = labOrders.filter(l => l.orderedAt.toISOString().slice(0, 10) >= monthStart && l.orderedAt.toISOString().slice(0, 10) < monthEnd);
  const completedLab = monthLabOrders.filter(l => l.status === "completed").length;
  const lowStock = stockItems.filter(s => s.quantity <= s.reorderLevel).length;
  const monthAttendance = attendanceRecords.filter(a => {
    const d = typeof a.date === "string" ? a.date : a.date;
    return String(d) >= monthStart && String(d) < monthEnd;
  });
  const staffPresent = monthAttendance.filter(a => a.status === "present" || a.status === "late").length;
  const staffAbsent = monthAttendance.filter(a => a.status === "absent").length;

  res.json({
    month,
    totalPatients: allPatients.length,
    newPatients,
    totalConsultations: monthConsultations,
    totalAppointments: monthAppointments.length,
    completedAppointments: completedAppts,
    totalRevenue: totalRevenue.toFixed(2),
    totalLabOrders: monthLabOrders.length,
    completedLabOrders: completedLab,
    lowStockDrugs: lowStock,
    staffPresent,
    staffAbsent,
  });
});

export default router;
