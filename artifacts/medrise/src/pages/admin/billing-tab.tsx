import React, { useState } from "react";
import { useListInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice, useGetBillingStats, useListPatients, getListInvoicesQueryKey, getGetBillingStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Receipt, TrendingUp, DollarSign, Clock, CheckCircle2, X } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700 border-red-200",
  partial: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

type InvoiceItem = { description: string; quantity: number; unitPrice: number };

export default function BillingTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<null | { id: number; total: string; paid: string }>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoices = [], isLoading } = useListInvoices({} as any, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stats } = useGetBillingStats({ query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients = [] } = useListPatients(undefined, { query: {} as any });

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();

  const filtered = statusFilter === "all" ? invoices : invoices.filter(i => i.status === statusFilter);

  function handleAddInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patientId = parseInt(String(fd.get("patientId")), 10);
    if (!patientId) { toast({ title: "Select a patient", variant: "destructive" }); return; }
    if (items.some(i => !i.description)) { toast({ title: "Fill all item descriptions", variant: "destructive" }); return; }
    createMutation.mutate({ data: {
      patientId,
      notes: String(fd.get("notes") || ""),
      items: items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
    }}, {
      onSuccess: () => {
        toast({ title: "Invoice created" });
        setAddOpen(false);
        setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetBillingStatsQueryKey() });
      },
      onError: () => toast({ title: "Failed to create invoice", variant: "destructive" }),
    });
  }

  function handlePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!payOpen) return;
    const fd = new FormData(e.currentTarget);
    const paidAmount = parseFloat(String(fd.get("paidAmount") || "0"));
    const paymentMethod = String(fd.get("paymentMethod") || "cash");
    const total = parseFloat(payOpen.total);
    const status = paidAmount >= total ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
    updateMutation.mutate({ id: payOpen.id, data: { paidAmount, paymentMethod, status } }, {
      onSuccess: () => {
        toast({ title: "Payment recorded" });
        setPayOpen(null);
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetBillingStatsQueryKey() });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  }

  const addItem = () => setItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, val: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing & Invoices</h1>
          <p className="text-gray-500 text-sm">Manage patient bills, payments and revenue tracking.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
            <form onSubmit={handleAddInvoice} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Patient *</label>
                  <select name="patientId" required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                  <Input name="notes" placeholder="Optional note" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Invoice Items</label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3 w-3" /> Add Item</Button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <Input placeholder="Description" value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" min="0" step="0.01" placeholder="Unit price" value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="col-span-1">
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-400 hover:text-red-600" onClick={() => removeItem(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <p className="text-sm text-gray-500">Total:</p>
                  <p className="text-xl font-bold text-primary">UGX {total.toLocaleString("en-UG", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 bg-blue-50"><CardContent className="p-4"><p className="text-xs text-blue-600 font-medium mb-1">Total Invoices</p><p className="text-2xl font-bold text-blue-900">{stats.totalInvoices}</p></CardContent></Card>
          <Card className="border-0 bg-green-50"><CardContent className="p-4"><p className="text-xs text-green-600 font-medium mb-1">Revenue Collected</p><p className="text-lg font-bold text-green-900">UGX {parseFloat(stats.totalPaid).toLocaleString()}</p></CardContent></Card>
          <Card className="border-0 bg-red-50"><CardContent className="p-4"><p className="text-xs text-red-600 font-medium mb-1">Outstanding</p><p className="text-lg font-bold text-red-900">UGX {parseFloat(stats.totalUnpaid).toLocaleString()}</p></CardContent></Card>
          <Card className="border-0 bg-purple-50"><CardContent className="p-4"><p className="text-xs text-purple-600 font-medium mb-1">This Month</p><p className="text-lg font-bold text-purple-900">UGX {parseFloat(stats.thisMonthRevenue).toLocaleString()}</p></CardContent></Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "unpaid", "partial", "paid", "cancelled"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${statusFilter === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <Card key={inv.id} className="border border-gray-100">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{inv.invoiceNumber}</span>
                      <span className="font-semibold text-gray-900">{inv.patientName ?? `Patient #${inv.patientId}`}</span>
                      <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[inv.status] ?? ""}`}>{inv.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Total: <strong>UGX {parseFloat(inv.totalAmount).toLocaleString()}</strong></span>
                      <span>Paid: <strong className="text-green-700">UGX {parseFloat(inv.paidAmount).toLocaleString()}</strong></span>
                      {inv.paymentMethod && <span className="capitalize text-xs bg-gray-100 px-2 py-0.5 rounded">{inv.paymentMethod}</span>}
                    </div>
                    {inv.notes && <p className="text-xs text-gray-500 mt-1">{inv.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {inv.status !== "paid" && inv.status !== "cancelled" && (
                      <Button size="sm" variant="outline" className="gap-1 text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => setPayOpen({ id: inv.id, total: inv.totalAmount, paid: inv.paidAmount })}>
                        <DollarSign className="h-3.5 w-3.5" /> Record Payment
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete invoice {inv.invoiceNumber}?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the invoice and all its line items.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteMutation.mutate({ id: inv.id }, { onSuccess: () => { toast({ title: "Deleted" }); qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }); qc.invalidateQueries({ queryKey: getGetBillingStatsQueryKey() }); } })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Dialog */}
      {payOpen && (
        <Dialog open={!!payOpen} onOpenChange={() => setPayOpen(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <form onSubmit={handlePayment} className="space-y-4 pt-2">
              <div>
                <p className="text-sm text-gray-600 mb-3">Invoice total: <strong>UGX {parseFloat(payOpen.total).toLocaleString()}</strong></p>
                <label className="text-sm font-medium text-gray-700 block mb-1">Amount Paid (UGX) *</label>
                <Input name="paidAmount" type="number" min="0" step="0.01" defaultValue={payOpen.paid} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Payment Method</label>
                <select name="paymentMethod" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="cash">Cash</option>
                  <option value="mtn-mobile-money">MTN Mobile Money — 0770 775268 / 0751 527730</option>
                  <option value="airtel-money">Airtel Money — 0770 775268 / 0751 527730</option>
                  <option value="visa-card">Visa Card (Merchant)</option>
                  <option value="atm-card">ATM Card (Merchant)</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="insurance">Insurance</option>
                  <option value="nhis">NHIS</option>
                </select>
                {/* Payment tip */}
                <p className="text-xs text-gray-400 mt-1.5">
                  Mobile Money: Send to <strong>0770 775268</strong> or <strong>0751 527730</strong> (MedRise Medical Centre)
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setPayOpen(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Confirm Payment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
