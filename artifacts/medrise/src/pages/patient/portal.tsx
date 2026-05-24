import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useListConsultations, useListVitals, useListInvoices, useListLabOrders, useListAppointments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Activity, Receipt, FlaskConical, Calendar, LogOut, ChevronDown, ChevronUp, User, Printer } from "lucide-react";
import logoBannerPath from "@assets/1778193288147[1]_1779241918471.jpg";
import { printPrescription, printLabResult } from "@/lib/print-utils";

type PatientSession = { id: number; name: string; phone: string };
type PortalTab = "overview" | "consultations" | "vitals" | "billing" | "lab" | "appointments";

const STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700 border-red-200",
  partial: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
};

export default function PatientPortal() {
  const [, setLocation] = useLocation();
  const { patientSession, setPatientSession } = useAuth();
  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [expanded, setExpanded] = useState<number | null>(null);

  const pid = patientSession?.id;

  if (!patientSession) {
    setLocation("/patient/login");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: consultations = [] } = useListConsultations({ patientId: pid } as any, { query: { enabled: !!pid } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vitals = [] } = useListVitals({ patientId: pid } as any, { query: { enabled: !!pid } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoices = [] } = useListInvoices({ patientId: pid } as any, { query: { enabled: !!pid } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: labOrders = [] } = useListLabOrders({ patientId: pid } as any, { query: { enabled: !!pid } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments = [] } = useListAppointments({ query: { enabled: !!pid } as any });

  const myAppointments = appointments.filter(a =>
    patientSession && (a.phone === patientSession.phone || a.patientName.toLowerCase().includes(patientSession.name.split(" ")[0].toLowerCase()))
  );

  function handleLogout() {
    setPatientSession(null);
    setLocation("/patient/login");
  }

  if (!patientSession) return null;

  const navItems: { tab: PortalTab; label: string; icon: React.ElementType; count?: number }[] = [
    { tab: "overview", label: "Overview", icon: User },
    { tab: "consultations", label: "Consultations", icon: Stethoscope, count: consultations.length },
    { tab: "vitals", label: "Vital Signs", icon: Activity, count: vitals.length },
    { tab: "billing", label: "Billing", icon: Receipt, count: invoices.length },
    { tab: "lab", label: "Lab Results", icon: FlaskConical, count: labOrders.length },
    { tab: "appointments", label: "Appointments", icon: Calendar, count: myAppointments.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <img src={logoBannerPath} alt="MedRise" className="h-8 rounded" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{patientSession.name}</p>
            <p className="text-xs text-gray-500">{patientSession.phone}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-gray-500 hover:text-red-600">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
        {/* Tab nav */}
        <div className="container mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {navItems.map(({ tab, label, icon: Icon, count }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {typeof count === "number" && count > 0 && (
                  <span className="ml-1 bg-gray-100 text-gray-600 rounded-full text-xs px-1.5 py-0.5">{count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-3xl">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white mb-6">
              <p className="text-sm opacity-80 mb-1">Welcome back,</p>
              <h2 className="text-2xl font-bold">{patientSession.name}</h2>
              <p className="text-sm opacity-70 mt-1">{patientSession.phone}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {[
                { label: "Consultations", value: consultations.length, icon: Stethoscope, tab: "consultations" as PortalTab, color: "text-teal-600" },
                { label: "Vitals Recorded", value: vitals.length, icon: Activity, tab: "vitals" as PortalTab, color: "text-pink-600" },
                { label: "Lab Tests", value: labOrders.length, icon: FlaskConical, tab: "lab" as PortalTab, color: "text-orange-600" },
                { label: "Invoices", value: invoices.length, icon: Receipt, tab: "billing" as PortalTab, color: "text-blue-600" },
                { label: "Appointments", value: myAppointments.length, icon: Calendar, tab: "appointments" as PortalTab, color: "text-purple-600" },
                { label: "Outstanding Bills", value: invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").length, icon: Receipt, tab: "billing" as PortalTab, color: "text-red-600" },
              ].map(s => (
                <Card key={s.label} className="border border-gray-100 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveTab(s.tab)}>
                  <CardContent className="p-4">
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Latest consultation */}
            {consultations[0] && (
              <Card className="border border-gray-100 mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">Last Consultation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600"><span className="font-medium">Date:</span> {consultations[0].visitDate}</p>
                  {consultations[0].diagnosis && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Diagnosis:</span> {consultations[0].diagnosis}</p>}
                  {consultations[0].followUpDate && <p className="text-sm text-primary mt-1 font-medium">Follow-up: {consultations[0].followUpDate}</p>}
                </CardContent>
              </Card>
            )}
            <div className="text-center mt-6">
              <Link href="/appointment">
                <Button className="gap-2"><Calendar className="h-4 w-4" /> Book New Appointment</Button>
              </Link>
            </div>
          </div>
        )}

        {/* CONSULTATIONS */}
        {activeTab === "consultations" && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Consultations</h2>
            {consultations.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No consultations recorded</p></div>
            ) : (
              <div className="space-y-3">
                {consultations.map(c => (
                  <Card key={c.id} className="border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline" className="text-xs">{c.visitDate}</Badge>
                            {c.staffName && <span className="text-xs text-gray-500">Dr. {c.staffName}</span>}
                          </div>
                          {c.chiefComplaint && <p className="text-sm text-gray-700"><span className="font-medium">Complaint:</span> {c.chiefComplaint}</p>}
                          {c.diagnosis && <p className="text-sm text-blue-700 font-medium mt-1">Diagnosis: {c.diagnosis}</p>}
                        </div>
                        <button className="text-gray-400 hover:text-gray-700" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                          {expanded === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                      {expanded === c.id && (
                        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2 text-sm">
                          {c.treatmentPlan && <div><p className="text-xs font-medium text-gray-500">Treatment Plan</p><p className="text-gray-700">{c.treatmentPlan}</p></div>}
                          {c.prescriptions && <div><p className="text-xs font-medium text-gray-500">Prescriptions</p><p className="text-gray-700">{c.prescriptions}</p></div>}
                          {c.followUpDate && <div><p className="text-xs font-medium text-gray-500">Follow-up</p><p className="text-primary font-medium">{c.followUpDate}</p></div>}
                          {c.notes && <div><p className="text-xs font-medium text-gray-500">Notes</p><p className="text-gray-700">{c.notes}</p></div>}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-8 mt-2 text-blue-700 border-blue-200 hover:bg-blue-50"
                            onClick={() => printPrescription({
                              patientName: patientSession.name,
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
                            <Printer className="h-3.5 w-3.5" /> Download / Print Prescription
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VITALS */}
        {activeTab === "vitals" && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Vital Signs</h2>
            {vitals.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><Activity className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No vitals recorded</p></div>
            ) : (
              <div className="space-y-3">
                {vitals.map(v => (
                  <Card key={v.id} className="border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">{new Date(v.recordedAt).toLocaleDateString()}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {v.bloodPressure && <div className="bg-red-50 rounded p-2"><p className="text-xs text-red-600 font-medium">Blood Pressure</p><p className="font-semibold">{v.bloodPressure}</p></div>}
                        {v.temperature && <div className="bg-orange-50 rounded p-2"><p className="text-xs text-orange-600 font-medium">Temperature</p><p className="font-semibold">{v.temperature}</p></div>}
                        {v.pulse && <div className="bg-pink-50 rounded p-2"><p className="text-xs text-pink-600 font-medium">Pulse</p><p className="font-semibold">{v.pulse}</p></div>}
                        {v.oxygenSaturation && <div className="bg-blue-50 rounded p-2"><p className="text-xs text-blue-600 font-medium">O₂ Saturation</p><p className="font-semibold">{v.oxygenSaturation}</p></div>}
                        {v.weight && <div className="bg-green-50 rounded p-2"><p className="text-xs text-green-600 font-medium">Weight</p><p className="font-semibold">{v.weight}</p></div>}
                        {v.height && <div className="bg-purple-50 rounded p-2"><p className="text-xs text-purple-600 font-medium">Height</p><p className="font-semibold">{v.height}</p></div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BILLING */}
        {activeTab === "billing" && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Bills & Payments</h2>
            {invoices.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No invoices found</p></div>
            ) : (
              <div className="space-y-3">
                {invoices.map(inv => (
                  <Card key={inv.id} className="border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{inv.invoiceNumber}</span>
                            <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[inv.status] ?? ""}`}>{inv.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-700">Total: <strong>UGX {parseFloat(inv.totalAmount).toLocaleString()}</strong></p>
                          {parseFloat(inv.paidAmount) > 0 && <p className="text-sm text-green-700">Paid: UGX {parseFloat(inv.paidAmount).toLocaleString()}</p>}
                          {inv.status !== "paid" && inv.status !== "cancelled" && (
                            <p className="text-sm text-red-600 font-medium">Balance: UGX {(parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount)).toLocaleString()}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{new Date(inv.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {inv.items && inv.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <p className="text-xs font-medium text-gray-500 mb-2">Items</p>
                          {inv.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{item.description} ×{item.quantity}</span>
                              <span>UGX {parseFloat(item.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
              <p className="font-medium mb-1">Need to clear a balance?</p>
              <p>Visit us at MEDRISE MEDICAL CENTRE or call <a href="tel:+256770775268" className="font-semibold">+256 770 775268</a> for payment arrangements.</p>
            </div>
          </div>
        )}

        {/* LAB */}
        {activeTab === "lab" && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Lab Results</h2>
            {labOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No lab tests ordered</p></div>
            ) : (
              <div className="space-y-3">
                {labOrders.map(order => (
                  <Card key={order.id} className="border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{order.testName}</p>
                            <Badge variant="outline" className={`text-xs ${order.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>{order.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(order.orderedAt).toLocaleDateString()}</p>
                        </div>
                        {order.results && order.results.length > 0 && (
                          <button className="text-gray-400 hover:text-gray-700" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                            {expanded === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                      {expanded === order.id && order.results && order.results.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          {order.results.map((r, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-2 text-sm mb-2">
                              {r.result && <div><p className="text-xs text-gray-500">Result</p><p className="font-semibold text-green-800">{r.result} {r.unit}</p></div>}
                              {r.referenceRange && <div><p className="text-xs text-gray-500">Reference Range</p><p>{r.referenceRange}</p></div>}
                              {r.interpretation && <div><p className="text-xs text-gray-500">Interpretation</p><Badge variant="outline" className="text-xs mt-0.5">{r.interpretation}</Badge></div>}
                              {r.notes && <div><p className="text-xs text-gray-500">Notes</p><p className="text-gray-700">{r.notes}</p></div>}
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-8 mt-2 text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => printLabResult({
                              patientName: patientSession.name,
                              testName: order.testName,
                              orderedAt: String(order.orderedAt),
                              priority: order.priority,
                              clinicalInfo: order.clinicalInfo,
                              results: order.results ?? [],
                            })}
                          >
                            <Printer className="h-3.5 w-3.5" /> Download / Print Lab Report
                          </Button>
                        </div>
                      )}
                      {order.status === "pending" && (
                        <p className="text-xs text-yellow-600 mt-2 bg-yellow-50 rounded px-2 py-1">Results are being processed. Please check back later.</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Appointments</h2>
            {myAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="mb-4">No appointments found</p>
                <Link href="/appointment">
                  <Button className="gap-2"><Calendar className="h-4 w-4" /> Book an Appointment</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {myAppointments.map(a => (
                    <Card key={a.id} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[a.status] ?? ""}`}>{a.status}</Badge>
                              <span className="text-sm font-medium text-gray-800">{a.service}</span>
                            </div>
                            <p className="text-sm text-gray-600">{a.preferredDate} at {a.preferredTime}</p>
                            {a.message && <p className="text-xs text-gray-500 mt-1">{a.message}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Link href="/appointment">
                  <Button variant="outline" className="gap-2 w-full"><Calendar className="h-4 w-4" /> Book Another Appointment</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
