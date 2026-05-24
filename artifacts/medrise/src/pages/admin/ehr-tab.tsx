import React, { useState } from "react";
import { useListConsultations, useCreateConsultation, useUpdateConsultation, useDeleteConsultation, useListVitals, useCreateVitals, useDeleteVitals, useListPatients, useListStaff } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListConsultationsQueryKey, getListVitalsQueryKey } from "@workspace/api-client-react";
import { Plus, Trash2, Edit2, Stethoscope, Activity, Search, FileText, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { printPrescription } from "@/lib/print-utils";

type EhrTab = "consultations" | "vitals";

export default function EhrTab({ adminId }: { adminId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<EhrTab>("consultations");
  const [patientFilter, setPatientFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [addConsultOpen, setAddConsultOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);
  const [editConsult, setEditConsult] = useState<null | { id: number; data: { patientId: number } & Record<string, unknown> }>(null);
  const [expandedConsult, setExpandedConsult] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: consultations = [], isLoading: isConsultsLoading } = useListConsultations({} as any, { query: { enabled: activeTab === "consultations" } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vitals = [], isLoading: isVitalsLoading } = useListVitals({} as any, { query: { enabled: activeTab === "vitals" } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients = [] } = useListPatients(undefined, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffList = [] } = useListStaff({ query: {} as any });

  const createConsultMutation = useCreateConsultation();
  const updateConsultMutation = useUpdateConsultation();
  const deleteConsultMutation = useDeleteConsultation();
  const createVitalsMutation = useCreateVitals();
  const deleteVitalsMutation = useDeleteVitals();

  const filteredConsults = consultations.filter(c =>
    !patientFilter || c.patientName?.toLowerCase().includes(patientFilter.toLowerCase()) || String(c.patientId) === patientFilter
  );
  const filteredVitals = vitals.filter(v =>
    !patientFilter || v.patientName?.toLowerCase().includes(patientFilter.toLowerCase())
  );

  function handleAddConsult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patientId = parseInt(String(fd.get("patientId")), 10);
    if (!patientId) { toast({ title: "Select a patient", variant: "destructive" }); return; }
    createConsultMutation.mutate({ data: {
      patientId,
      staffId: adminId,
      visitDate: String(fd.get("visitDate") || new Date().toISOString().slice(0, 10)),
      chiefComplaint: String(fd.get("chiefComplaint") || ""),
      diagnosis: String(fd.get("diagnosis") || ""),
      treatmentPlan: String(fd.get("treatmentPlan") || ""),
      prescriptions: String(fd.get("prescriptions") || ""),
      referral: String(fd.get("referral") || ""),
      followUpDate: String(fd.get("followUpDate") || ""),
      notes: String(fd.get("notes") || ""),
    }}, {
      onSuccess: () => {
        toast({ title: "Consultation recorded" });
        setAddConsultOpen(false);
        qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  }

  function handleEditConsult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editConsult) return;
    const fd = new FormData(e.currentTarget);
    updateConsultMutation.mutate({ id: editConsult.id, data: {
      patientId: editConsult.data.patientId as number,
      visitDate: String(fd.get("visitDate") || ""),
      chiefComplaint: String(fd.get("chiefComplaint") || ""),
      diagnosis: String(fd.get("diagnosis") || ""),
      treatmentPlan: String(fd.get("treatmentPlan") || ""),
      prescriptions: String(fd.get("prescriptions") || ""),
      referral: String(fd.get("referral") || ""),
      followUpDate: String(fd.get("followUpDate") || ""),
      notes: String(fd.get("notes") || ""),
    }}, {
      onSuccess: () => {
        toast({ title: "Consultation updated" });
        setEditConsult(null);
        qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  }

  function handleDeleteConsult(id: number) {
    deleteConsultMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Deleted" });
        qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
      },
    });
  }

  function handleAddVitals(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patientId = parseInt(String(fd.get("patientId")), 10);
    if (!patientId) { toast({ title: "Select a patient", variant: "destructive" }); return; }
    createVitalsMutation.mutate({ data: {
      patientId,
      bloodPressure: String(fd.get("bloodPressure") || ""),
      temperature: String(fd.get("temperature") || ""),
      pulse: String(fd.get("pulse") || ""),
      weight: String(fd.get("weight") || ""),
      height: String(fd.get("height") || ""),
      oxygenSaturation: String(fd.get("oxygenSaturation") || ""),
      respiratoryRate: String(fd.get("respiratoryRate") || ""),
    }}, {
      onSuccess: () => {
        toast({ title: "Vitals recorded" });
        setAddVitalsOpen(false);
        qc.invalidateQueries({ queryKey: getListVitalsQueryKey() });
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  }

  const tabBtnClass = (t: EhrTab) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Electronic Health Records</h1>
          <p className="text-gray-500 text-sm">Consultation notes, diagnoses, treatment plans and vital signs.</p>
        </div>
        <div className="flex gap-2">
          <button className={tabBtnClass("consultations")} onClick={() => setActiveTab("consultations")}>
            <FileText className="h-4 w-4" /> Consultations
          </button>
          <button className={tabBtnClass("vitals")} onClick={() => setActiveTab("vitals")}>
            <Activity className="h-4 w-4" /> Vital Signs
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Filter by patient name..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setPatientFilter(searchInput)}
          />
        </div>
        <Button variant="outline" onClick={() => { setPatientFilter(searchInput); }}>Search</Button>
        {patientFilter && <Button variant="ghost" onClick={() => { setPatientFilter(""); setSearchInput(""); }}>Clear</Button>}
        <div className="ml-auto">
          {activeTab === "consultations" ? (
            <Dialog open={addConsultOpen} onOpenChange={setAddConsultOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> New Consultation</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>New Consultation</DialogTitle></DialogHeader>
                <form onSubmit={handleAddConsult} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Patient *</label>
                      <select name="patientId" required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">Select patient...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Visit Date *</label>
                      <Input name="visitDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Chief Complaint</label>
                    <Input name="chiefComplaint" placeholder="Main reason for visit" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Diagnosis</label>
                    <Textarea name="diagnosis" placeholder="Clinical diagnosis" rows={2} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Treatment Plan</label>
                    <Textarea name="treatmentPlan" placeholder="Prescribed treatment and management plan" rows={2} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Prescriptions</label>
                    <Textarea name="prescriptions" placeholder="Medications prescribed (name, dose, frequency)" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Referral</label>
                      <Input name="referral" placeholder="Referred to (if any)" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Follow-up Date</label>
                      <Input name="followUpDate" type="date" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                    <Textarea name="notes" placeholder="Additional clinical notes" rows={2} />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setAddConsultOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createConsultMutation.isPending}>
                      {createConsultMutation.isPending ? "Saving..." : "Save Consultation"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={addVitalsOpen} onOpenChange={setAddVitalsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Record Vitals</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Record Vital Signs</DialogTitle></DialogHeader>
                <form onSubmit={handleAddVitals} className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Patient *</label>
                    <select name="patientId" required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Blood Pressure</label>
                      <Input name="bloodPressure" placeholder="e.g. 120/80 mmHg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Temperature</label>
                      <Input name="temperature" placeholder="e.g. 36.5 °C" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Pulse</label>
                      <Input name="pulse" placeholder="e.g. 72 bpm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Oxygen Saturation</label>
                      <Input name="oxygenSaturation" placeholder="e.g. 98%" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Weight</label>
                      <Input name="weight" placeholder="e.g. 68 kg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Height</label>
                      <Input name="height" placeholder="e.g. 170 cm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Respiratory Rate</label>
                      <Input name="respiratoryRate" placeholder="e.g. 16 /min" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setAddVitalsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createVitalsMutation.isPending}>
                      {createVitalsMutation.isPending ? "Saving..." : "Save Vitals"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Consultations List */}
      {activeTab === "consultations" && (
        isConsultsLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filteredConsults.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No consultations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConsults.map(c => (
              <Card key={c.id} className="border border-gray-100">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">{c.patientName ?? `Patient #${c.patientId}`}</span>
                        <Badge variant="outline" className="text-xs">{c.visitDate}</Badge>
                        {c.staffName && <span className="text-xs text-gray-500">Dr. {c.staffName}</span>}
                      </div>
                      {c.chiefComplaint && <p className="text-sm text-gray-600"><span className="font-medium">Complaint:</span> {c.chiefComplaint}</p>}
                      {c.diagnosis && <p className="text-sm text-gray-700 font-medium mt-1 text-blue-700">Dx: {c.diagnosis}</p>}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        className="text-gray-400 hover:text-gray-700"
                        onClick={() => setExpandedConsult(expandedConsult === c.id ? null : c.id)}
                      >
                        {expandedConsult === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      {/* Edit */}
                      <Dialog open={editConsult?.id === c.id} onOpenChange={open => setEditConsult(open ? { id: c.id, data: { ...(c as unknown as Record<string, unknown>), patientId: c.patientId } as { patientId: number } & Record<string, unknown> } : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-blue-600">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Edit Consultation</DialogTitle></DialogHeader>
                          <form onSubmit={handleEditConsult} className="space-y-4 pt-2">
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">Visit Date</label>
                              <Input name="visitDate" type="date" defaultValue={String(c.visitDate)} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">Chief Complaint</label>
                              <Input name="chiefComplaint" defaultValue={c.chiefComplaint ?? ""} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">Diagnosis</label>
                              <Textarea name="diagnosis" defaultValue={c.diagnosis ?? ""} rows={2} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">Treatment Plan</label>
                              <Textarea name="treatmentPlan" defaultValue={c.treatmentPlan ?? ""} rows={2} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">Prescriptions</label>
                              <Textarea name="prescriptions" defaultValue={c.prescriptions ?? ""} rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Referral</label>
                                <Input name="referral" defaultValue={c.referral ?? ""} />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Follow-up Date</label>
                                <Input name="followUpDate" type="date" defaultValue={c.followUpDate ?? ""} />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                              <Textarea name="notes" defaultValue={c.notes ?? ""} rows={2} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                              <Button type="button" variant="outline" onClick={() => setEditConsult(null)}>Cancel</Button>
                              <Button type="submit" disabled={updateConsultMutation.isPending}>
                                {updateConsultMutation.isPending ? "Saving..." : "Update"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete consultation?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove this consultation record.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteConsult(c.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedConsult === c.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                        {c.treatmentPlan && <div><p className="font-medium text-gray-500 text-xs mb-0.5">Treatment Plan</p><p className="text-gray-700">{c.treatmentPlan}</p></div>}
                        {c.prescriptions && <div><p className="font-medium text-gray-500 text-xs mb-0.5">Prescriptions</p><p className="text-gray-700">{c.prescriptions}</p></div>}
                        {c.referral && <div><p className="font-medium text-gray-500 text-xs mb-0.5">Referral</p><p className="text-gray-700">{c.referral}</p></div>}
                        {c.followUpDate && <div><p className="font-medium text-gray-500 text-xs mb-0.5">Follow-up</p><p className="text-gray-700">{c.followUpDate}</p></div>}
                        {c.notes && <div className="col-span-2"><p className="font-medium text-gray-500 text-xs mb-0.5">Notes</p><p className="text-gray-700">{c.notes}</p></div>}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8 text-blue-700 border-blue-200 hover:bg-blue-50"
                        onClick={() => printPrescription({
                          patientName: c.patientName ?? `Patient #${c.patientId}`,
                          visitDate: String(c.visitDate),
                          staffName: c.staffName,
                          chiefComplaint: c.chiefComplaint,
                          diagnosis: c.diagnosis,
                          treatmentPlan: c.treatmentPlan,
                          prescriptions: c.prescriptions,
                          referral: c.referral,
                          followUpDate: c.followUpDate,
                          notes: c.notes,
                        })}
                      >
                        <Printer className="h-3.5 w-3.5" /> Print Prescription
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Vitals List */}
      {activeTab === "vitals" && (
        isVitalsLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filteredVitals.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No vitals recorded yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredVitals.map(v => (
              <Card key={v.id} className="border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">{v.patientName ?? `Patient #${v.patientId}`}</span>
                        <Badge variant="outline" className="text-xs">{new Date(v.recordedAt).toLocaleDateString()}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {v.bloodPressure && <div className="bg-red-50 rounded p-2"><p className="text-xs text-red-600 font-medium">Blood Pressure</p><p className="font-semibold">{v.bloodPressure}</p></div>}
                        {v.temperature && <div className="bg-orange-50 rounded p-2"><p className="text-xs text-orange-600 font-medium">Temperature</p><p className="font-semibold">{v.temperature}</p></div>}
                        {v.pulse && <div className="bg-pink-50 rounded p-2"><p className="text-xs text-pink-600 font-medium">Pulse</p><p className="font-semibold">{v.pulse}</p></div>}
                        {v.oxygenSaturation && <div className="bg-blue-50 rounded p-2"><p className="text-xs text-blue-600 font-medium">O₂ Sat</p><p className="font-semibold">{v.oxygenSaturation}</p></div>}
                        {v.weight && <div className="bg-green-50 rounded p-2"><p className="text-xs text-green-600 font-medium">Weight</p><p className="font-semibold">{v.weight}</p></div>}
                        {v.height && <div className="bg-purple-50 rounded p-2"><p className="text-xs text-purple-600 font-medium">Height</p><p className="font-semibold">{v.height}</p></div>}
                        {v.respiratoryRate && <div className="bg-teal-50 rounded p-2"><p className="text-xs text-teal-600 font-medium">Resp. Rate</p><p className="font-semibold">{v.respiratoryRate}</p></div>}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-red-600 ml-3">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete vitals record?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteVitalsMutation.mutate({ id: v.id }, { onSuccess: () => { toast({ title: "Deleted" }); qc.invalidateQueries({ queryKey: getListVitalsQueryKey() }); } })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
