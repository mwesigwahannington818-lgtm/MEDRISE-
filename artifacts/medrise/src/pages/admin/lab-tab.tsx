import React, { useState } from "react";
import { useListLabOrders, useCreateLabOrder, useUpdateLabOrder, useDeleteLabOrder, useCreateLabResult, useListPatients, useListStaff, getListLabOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FlaskConical, CheckCircle2, Clock, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { printLabResult } from "@/lib/print-utils";

const PRIORITY_COLORS: Record<string, string> = {
  routine: "bg-gray-50 text-gray-600 border-gray-200",
  urgent: "bg-orange-50 text-orange-700 border-orange-200",
  stat: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

const LAB_TESTS = [
  "Full Blood Count (FBC)", "Blood Sugar (Fasting)", "Blood Sugar (Random)",
  "Malaria Rapid Test", "Malaria Microscopy", "HIV Rapid Test",
  "Liver Function Tests (LFTs)", "Renal Function Tests (RFTs)", "Lipid Profile",
  "Thyroid Function Tests", "Urine Analysis", "Stool Analysis",
  "HBsAg (Hepatitis B)", "Widal Test", "CD4 Count", "Pregnancy Test (urine)",
  "Blood Group & Rhesus", "ESR", "CRP", "PSA",
];

export default function LabTab({ adminId }: { adminId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState<null | { orderId: number; testName: string }>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders = [], isLoading } = useListLabOrders({} as any, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients = [] } = useListPatients(undefined, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffList = [] } = useListStaff({ query: {} as any });

  const createOrderMutation = useCreateLabOrder();
  const updateOrderMutation = useUpdateLabOrder();
  const deleteOrderMutation = useDeleteLabOrder();
  const createResultMutation = useCreateLabResult();

  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  function handleAddOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patientId = parseInt(String(fd.get("patientId")), 10);
    if (!patientId) { toast({ title: "Select a patient", variant: "destructive" }); return; }
    createOrderMutation.mutate({ data: {
      patientId,
      orderedBy: adminId,
      testName: String(fd.get("testName") || ""),
      testCategory: String(fd.get("testCategory") || "") || undefined,
      priority: (String(fd.get("priority") || "routine")) as "routine" | "urgent" | "stat",
      clinicalInfo: String(fd.get("clinicalInfo") || "") || undefined,
      notes: String(fd.get("notes") || "") || undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Lab order created" });
        setAddOpen(false);
        qc.invalidateQueries({ queryKey: getListLabOrdersQueryKey() });
      },
      onError: () => toast({ title: "Failed to create order", variant: "destructive" }),
    });
  }

  function handleRecordResult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resultOpen) return;
    const fd = new FormData(e.currentTarget);
    createResultMutation.mutate({ data: {
      labOrderId: resultOpen.orderId,
      result: String(fd.get("result") || "") || undefined,
      unit: String(fd.get("unit") || "") || undefined,
      referenceRange: String(fd.get("referenceRange") || "") || undefined,
      interpretation: String(fd.get("interpretation") || "") || undefined,
      notes: String(fd.get("notes") || "") || undefined,
      recordedBy: adminId,
    }}, {
      onSuccess: () => {
        toast({ title: "Result recorded" });
        setResultOpen(null);
        qc.invalidateQueries({ queryKey: getListLabOrdersQueryKey() });
      },
      onError: () => toast({ title: "Failed to save result", variant: "destructive" }),
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Laboratory</h1>
          <p className="text-gray-500 text-sm">Order tests, track processing status, and record results.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-sm">
            <span className="flex items-center gap-1 text-yellow-700"><Clock className="h-3.5 w-3.5" /> {orders.filter(o => o.status === "pending").length} pending</span>
            <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> {orders.filter(o => o.status === "completed").length} done</span>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Order</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Lab Order</DialogTitle></DialogHeader>
              <form onSubmit={handleAddOrder} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Patient *</label>
                    <select name="patientId" required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Priority</label>
                    <select name="priority" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT (Emergency)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Test Name *</label>
                  <select name="testName" required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select test...</option>
                    {LAB_TESTS.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="other">Other (specify in notes)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Clinical Information</label>
                  <Input name="clinicalInfo" placeholder="Brief clinical notes" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                  <Textarea name="notes" rows={2} placeholder="Additional instructions" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createOrderMutation.isPending}>{createOrderMutation.isPending ? "Ordering..." : "Place Order"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "pending", "in-progress", "completed", "cancelled"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s === "all" ? "All" : s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No lab orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <Card key={order.id} className="border border-gray-100">
              <CardContent className="p-0">
                <div className="flex items-start justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900">{order.patientName ?? `Patient #${order.patientId}`}</span>
                      <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[order.priority] ?? ""}`}>{order.priority.toUpperCase()}</Badge>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[order.status] ?? ""}`}>{order.status.replace("-", " ")}</Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{order.testName}</p>
                    {order.clinicalInfo && <p className="text-xs text-gray-500 mt-0.5">{order.clinicalInfo}</p>}
                    <p className="text-xs text-gray-400 mt-1">Ordered: {new Date(order.orderedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button className="text-gray-400 hover:text-gray-700" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                      {expanded === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {order.status === "pending" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => updateOrderMutation.mutate({ id: order.id, data: { status: "in-progress" } }, { onSuccess: () => { toast({ title: "Marked as In Progress" }); qc.invalidateQueries({ queryKey: getListLabOrdersQueryKey() }); } })}>
                        Start
                      </Button>
                    )}
                    {(order.status === "pending" || order.status === "in-progress") && (
                      <Button size="sm" className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700" onClick={() => setResultOpen({ orderId: order.id, testName: order.testName })}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Record Result
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete lab order?</AlertDialogTitle>
                          <AlertDialogDescription>This will also delete any recorded results.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteOrderMutation.mutate({ id: order.id }, { onSuccess: () => { toast({ title: "Deleted" }); qc.invalidateQueries({ queryKey: getListLabOrdersQueryKey() }); } })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {expanded === order.id && order.results && order.results.length > 0 && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Results</p>
                    {order.results.map((r, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg p-3 text-sm mb-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {r.result && <div><p className="text-xs text-gray-500">Result</p><p className="font-semibold text-green-800">{r.result} {r.unit}</p></div>}
                          {r.referenceRange && <div><p className="text-xs text-gray-500">Reference</p><p className="text-gray-700">{r.referenceRange}</p></div>}
                          {r.interpretation && <div><p className="text-xs text-gray-500">Interpretation</p><Badge variant="outline" className="text-xs">{r.interpretation}</Badge></div>}
                          {r.notes && <div><p className="text-xs text-gray-500">Notes</p><p className="text-gray-700">{r.notes}</p></div>}
                        </div>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-8 mt-1 text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => printLabResult({
                        patientName: order.patientName ?? `Patient #${order.patientId}`,
                        testName: order.testName,
                        orderedAt: String(order.orderedAt),
                        priority: order.priority,
                        clinicalInfo: order.clinicalInfo,
                        results: order.results ?? [],
                      })}
                    >
                      <Printer className="h-3.5 w-3.5" /> Print Lab Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Record result dialog */}
      {resultOpen && (
        <Dialog open={!!resultOpen} onOpenChange={() => setResultOpen(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Result — {resultOpen.testName}</DialogTitle></DialogHeader>
            <form onSubmit={handleRecordResult} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Result Value</label>
                  <Input name="result" placeholder="e.g. 5.4, Positive, Normal" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Unit</label>
                  <Input name="unit" placeholder="e.g. mmol/L, g/dL" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Reference Range</label>
                  <Input name="referenceRange" placeholder="e.g. 3.5–5.0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Interpretation</label>
                  <select name="interpretation" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select...</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                    <option value="Critical">Critical</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                <Textarea name="notes" rows={2} placeholder="Additional comments" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setResultOpen(null)}>Cancel</Button>
                <Button type="submit" disabled={createResultMutation.isPending}>{createResultMutation.isPending ? "Saving..." : "Submit Result"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
