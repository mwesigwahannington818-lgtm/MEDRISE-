import React, { useState } from "react";
import { useListPharmacyStock, useCreatePharmacyStock, useUpdatePharmacyStock, useDeletePharmacyStock, useDispensePharmacy, useGetPharmacyStats, getListPharmacyStockQueryKey, getGetPharmacyStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Pill, AlertTriangle, Search, Package } from "lucide-react";

export default function PharmacyTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<null | { id: number }>(null);
  const [dispenseOpen, setDispenseOpen] = useState<null | { id: number; name: string; qty: number }>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stock = [], isLoading } = useListPharmacyStock({ search: search || undefined, lowStock: showLowStock || undefined } as any, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stats } = useGetPharmacyStats({ query: {} as any });

  const createMutation = useCreatePharmacyStock();
  const updateMutation = useUpdatePharmacyStock();
  const deleteMutation = useDeletePharmacyStock();
  const dispenseMutation = useDispensePharmacy();

  const currentEdit = editItem ? stock.find(s => s.id === editItem.id) : null;

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({ data: {
      drugName: String(fd.get("drugName") || ""),
      genericName: String(fd.get("genericName") || ""),
      category: String(fd.get("category") || ""),
      quantity: parseInt(String(fd.get("quantity") || "0"), 10),
      unit: String(fd.get("unit") || "units"),
      reorderLevel: parseInt(String(fd.get("reorderLevel") || "10"), 10),
      expiryDate: String(fd.get("expiryDate") || ""),
      buyingPrice: parseFloat(String(fd.get("buyingPrice") || "0")) || undefined,
      sellingPrice: parseFloat(String(fd.get("sellingPrice") || "0")) || undefined,
      notes: String(fd.get("notes") || ""),
    }}, {
      onSuccess: () => {
        toast({ title: "Drug added to stock" });
        setAddOpen(false);
        qc.invalidateQueries({ queryKey: getListPharmacyStockQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPharmacyStatsQueryKey() });
      },
      onError: () => toast({ title: "Failed to add", variant: "destructive" }),
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editItem) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({ id: editItem.id, data: {
      drugName: String(fd.get("drugName") || ""),
      genericName: String(fd.get("genericName") || ""),
      category: String(fd.get("category") || ""),
      quantity: parseInt(String(fd.get("quantity") || "0"), 10),
      unit: String(fd.get("unit") || "units"),
      reorderLevel: parseInt(String(fd.get("reorderLevel") || "10"), 10),
      expiryDate: String(fd.get("expiryDate") || "") || undefined,
      buyingPrice: parseFloat(String(fd.get("buyingPrice") || "0")) || undefined,
      sellingPrice: parseFloat(String(fd.get("sellingPrice") || "0")) || undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Updated" });
        setEditItem(null);
        qc.invalidateQueries({ queryKey: getListPharmacyStockQueryKey() });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  }

  function handleDispense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dispenseOpen) return;
    const fd = new FormData(e.currentTarget);
    const qty = parseInt(String(fd.get("quantity") || "1"), 10);
    if (qty > dispenseOpen.qty) { toast({ title: "Insufficient stock", variant: "destructive" }); return; }
    dispenseMutation.mutate({ data: { stockId: dispenseOpen.id, quantity: qty, notes: String(fd.get("notes") || "") } }, {
      onSuccess: () => {
        toast({ title: "Dispensed successfully" });
        setDispenseOpen(null);
        qc.invalidateQueries({ queryKey: getListPharmacyStockQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPharmacyStatsQueryKey() });
      },
      onError: (err: Error) => toast({ title: err.message || "Failed to dispense", variant: "destructive" }),
    });
  }

  const StockForm = ({ defaultValues }: { defaultValues?: Record<string, unknown> }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Drug Name *</label>
          <Input name="drugName" defaultValue={String(defaultValues?.drugName ?? "")} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Generic Name</label>
          <Input name="genericName" defaultValue={String(defaultValues?.genericName ?? "")} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
          <select name="category" defaultValue={String(defaultValues?.category ?? "")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">Select...</option>
            <option value="antibiotic">Antibiotic</option>
            <option value="analgesic">Analgesic</option>
            <option value="antimalaria">Antimalaria</option>
            <option value="antihypertensive">Antihypertensive</option>
            <option value="antiretroviral">Antiretroviral</option>
            <option value="vaccine">Vaccine</option>
            <option value="supplement">Supplement/Vitamin</option>
            <option value="consumable">Consumable</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Unit</label>
          <Input name="unit" defaultValue={String(defaultValues?.unit ?? "units")} placeholder="e.g. tablets, bottles, vials" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Quantity *</label>
          <Input name="quantity" type="number" min="0" defaultValue={String(defaultValues?.quantity ?? "0")} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Reorder Level</label>
          <Input name="reorderLevel" type="number" min="0" defaultValue={String(defaultValues?.reorderLevel ?? "10")} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Expiry Date</label>
          <Input name="expiryDate" type="date" defaultValue={String(defaultValues?.expiryDate ?? "")} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Buying Price (UGX)</label>
          <Input name="buyingPrice" type="number" min="0" step="0.01" defaultValue={String(defaultValues?.buyingPrice ?? "")} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Selling Price (UGX)</label>
          <Input name="sellingPrice" type="number" min="0" step="0.01" defaultValue={String(defaultValues?.sellingPrice ?? "")} />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Pharmacy & Drug Inventory</h1>
          <p className="text-gray-500 text-sm">Track medicines, stock levels, expiry dates and dispensing.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Drug</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Drug to Stock</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="pt-2">
              <StockForm />
              <div className="flex justify-end gap-3 pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Saving..." : "Add to Stock"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 bg-blue-50"><CardContent className="p-4"><p className="text-xs text-blue-600 font-medium mb-1">Total Items</p><p className="text-2xl font-bold text-blue-900">{stats.totalItems}</p></CardContent></Card>
          <Card className="border-0 bg-yellow-50"><CardContent className="p-4"><p className="text-xs text-yellow-600 font-medium mb-1">Low Stock</p><p className="text-2xl font-bold text-yellow-900">{stats.lowStockItems}</p></CardContent></Card>
          <Card className="border-0 bg-red-50"><CardContent className="p-4"><p className="text-xs text-red-600 font-medium mb-1">Out of Stock</p><p className="text-2xl font-bold text-red-900">{stats.outOfStockItems}</p></CardContent></Card>
          <Card className="border-0 bg-orange-50"><CardContent className="p-4"><p className="text-xs text-orange-600 font-medium mb-1">Expiring (30d)</p><p className="text-2xl font-bold text-orange-900">{stats.expiringItems}</p></CardContent></Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search drugs..." value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && setSearch(searchInput)} />
        </div>
        <Button variant="outline" onClick={() => setSearch(searchInput)}>Search</Button>
        {search && <Button variant="ghost" onClick={() => { setSearch(""); setSearchInput(""); }}>Clear</Button>}
        <button onClick={() => setShowLowStock(!showLowStock)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showLowStock ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <AlertTriangle className="inline h-4 w-4 mr-1" /> Low Stock Only
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : stock.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Pill className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No drugs in stock</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Drug Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Expiry</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Sell Price</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stock.map(s => {
                const isLow = s.quantity <= s.reorderLevel && s.quantity > 0;
                const isOut = s.quantity === 0;
                const now = new Date().toISOString().slice(0, 10);
                const soon = s.expiryDate && s.expiryDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
                const expired = s.expiryDate && s.expiryDate < now;
                return (
                  <tr key={s.id} className={`${isOut ? "bg-red-50/30" : isLow ? "bg-yellow-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.drugName}</p>
                      {s.genericName && <p className="text-xs text-gray-500">{s.genericName}</p>}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600 text-xs">{s.category || "—"}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{s.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{s.unit}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {s.expiryDate ? (
                        <span className={expired ? "text-red-600 font-medium" : soon ? "text-orange-600 font-medium" : ""}>{s.expiryDate}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {s.sellingPrice ? `UGX ${parseFloat(s.sellingPrice).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={`text-xs ${isOut ? "bg-red-50 text-red-700 border-red-200" : isLow ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                        {isOut ? "Out" : isLow ? "Low" : "OK"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setDispenseOpen({ id: s.id, name: s.drugName, qty: s.quantity })} disabled={isOut}>
                          <Package className="h-3 w-3" /> Dispense
                        </Button>
                        <Dialog open={editItem?.id === s.id} onOpenChange={open => setEditItem(open ? { id: s.id } : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Edit — {s.drugName}</DialogTitle></DialogHeader>
                            <form onSubmit={handleEdit} className="pt-2">
                              <StockForm defaultValues={s as unknown as Record<string, unknown>} />
                              <div className="flex justify-end gap-3 pt-4 mt-4">
                                <Button type="button" variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
                                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Update"}</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {s.drugName}?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove this drug from inventory.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteMutation.mutate({ id: s.id }, { onSuccess: () => { toast({ title: "Removed" }); qc.invalidateQueries({ queryKey: getListPharmacyStockQueryKey() }); qc.invalidateQueries({ queryKey: getGetPharmacyStatsQueryKey() }); } })}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dispense dialog */}
      {dispenseOpen && (
        <Dialog open={!!dispenseOpen} onOpenChange={() => setDispenseOpen(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Dispense — {dispenseOpen.name}</DialogTitle></DialogHeader>
            <form onSubmit={handleDispense} className="space-y-4 pt-2">
              <p className="text-sm text-gray-600">Available: <strong>{dispenseOpen.qty} units</strong></p>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Quantity to Dispense *</label>
                <Input name="quantity" type="number" min="1" max={dispenseOpen.qty} defaultValue="1" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                <Input name="notes" placeholder="Patient name or other notes" />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDispenseOpen(null)}>Cancel</Button>
                <Button type="submit" disabled={dispenseMutation.isPending}>{dispenseMutation.isPending ? "Processing..." : "Dispense"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
