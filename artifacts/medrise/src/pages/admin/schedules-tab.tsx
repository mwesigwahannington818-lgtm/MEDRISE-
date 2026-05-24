import React, { useState } from "react";
import { useListShifts, useCreateShift, useDeleteShift, useListLeaveRequests, useCreateLeaveRequest, useUpdateLeaveRequest, useDeleteLeaveRequest, useListStaff, getListShiftsQueryKey, getListLeaveRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Calendar, Umbrella, CheckCircle2, XCircle } from "lucide-react";

type ScheduleTab = "shifts" | "leave";

const LEAVE_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const SHIFT_COLORS: Record<string, string> = {
  day: "bg-blue-50 text-blue-700",
  morning: "bg-amber-50 text-amber-700",
  afternoon: "bg-orange-50 text-orange-700",
  night: "bg-indigo-50 text-indigo-700",
};

export default function SchedulesTab({ adminId }: { adminId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<ScheduleTab>("shifts");
  const [addShiftOpen, setAddShiftOpen] = useState(false);
  const [addLeaveOpen, setAddLeaveOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("all");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shifts = [], isLoading: isShiftsLoading } = useListShifts({ month: filterMonth } as any, { query: { enabled: activeTab === "shifts" } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leaveRequests = [], isLoading: isLeaveLoading } = useListLeaveRequests({} as any, { query: { enabled: activeTab === "leave" } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffList = [] } = useListStaff({ query: {} as any });

  const createShiftMutation = useCreateShift();
  const deleteShiftMutation = useDeleteShift();
  const createLeaveMutation = useCreateLeaveRequest();
  const updateLeaveMutation = useUpdateLeaveRequest();
  const deleteLeaveMutation = useDeleteLeaveRequest();

  const filteredLeave = leaveStatusFilter === "all" ? leaveRequests : leaveRequests.filter(l => l.status === leaveStatusFilter);

  function handleAddShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const staffId = parseInt(String(fd.get("staffId")), 10);
    if (!staffId) { toast({ title: "Select a staff member", variant: "destructive" }); return; }
    createShiftMutation.mutate({ data: {
      staffId,
      date: String(fd.get("date") || ""),
      shift: (String(fd.get("shift") || "day")) as "day" | "night" | "morning" | "afternoon",
      startTime: String(fd.get("startTime") || "") || undefined,
      endTime: String(fd.get("endTime") || "") || undefined,
      notes: String(fd.get("notes") || "") || undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Shift assigned" });
        setAddShiftOpen(false);
        qc.invalidateQueries({ queryKey: getListShiftsQueryKey() });
      },
      onError: () => toast({ title: "Failed to assign shift", variant: "destructive" }),
    });
  }

  function handleAddLeave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const staffId = parseInt(String(fd.get("staffId")), 10);
    if (!staffId) { toast({ title: "Select a staff member", variant: "destructive" }); return; }
    createLeaveMutation.mutate({ data: {
      staffId,
      leaveType: (String(fd.get("leaveType") || "annual")) as "annual" | "sick" | "maternity" | "paternity" | "emergency" | "unpaid",
      startDate: String(fd.get("startDate") || ""),
      endDate: String(fd.get("endDate") || ""),
      reason: String(fd.get("reason") || "") || undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Leave request submitted" });
        setAddLeaveOpen(false);
        qc.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey() });
      },
      onError: () => toast({ title: "Failed to submit", variant: "destructive" }),
    });
  }

  function handleLeaveDecision(id: number, status: "approved" | "rejected") {
    updateLeaveMutation.mutate({ id, data: { status, approvedBy: adminId } }, {
      onSuccess: () => {
        toast({ title: status === "approved" ? "Leave approved" : "Leave rejected" });
        qc.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey() });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  }

  const tabBtnClass = (t: ScheduleTab) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Schedules & Leave</h1>
          <p className="text-gray-500 text-sm">Manage staff shift assignments and leave requests.</p>
        </div>
        <div className="flex gap-2">
          <button className={tabBtnClass("shifts")} onClick={() => setActiveTab("shifts")}>
            <Calendar className="h-4 w-4" /> Shift Schedule
          </button>
          <button className={tabBtnClass("leave")} onClick={() => setActiveTab("leave")}>
            <Umbrella className="h-4 w-4" /> Leave Requests
          </button>
        </div>
      </div>

      {/* SHIFTS */}
      {activeTab === "shifts" && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap items-center">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Filter Month</label>
              <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-44" />
            </div>
            <div className="ml-auto">
              <Dialog open={addShiftOpen} onOpenChange={setAddShiftOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Assign Shift</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Assign Shift</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddShift} className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Staff Member *</label>
                      <select name="staffId" required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">Select staff...</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Date *</label>
                        <Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Shift *</label>
                        <select name="shift" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="morning">Morning</option>
                          <option value="day">Day</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="night">Night</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Start Time</label>
                        <Input name="startTime" type="time" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">End Time</label>
                        <Input name="endTime" type="time" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                      <Input name="notes" placeholder="Any additional details" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setAddShiftOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createShiftMutation.isPending}>{createShiftMutation.isPending ? "Saving..." : "Assign Shift"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isShiftsLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No shifts scheduled for this month</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Staff</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Shift</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {shifts.map(s => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.staffName ?? `Staff #${s.staffId}`}</td>
                      <td className="px-4 py-3 capitalize text-gray-600 text-xs">{s.staffRole}</td>
                      <td className="px-4 py-3 text-gray-700">{s.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${SHIFT_COLORS[s.shift] ?? "bg-gray-50 text-gray-600"}`}>{s.shift}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{s.startTime && s.endTime ? `${s.startTime} – ${s.endTime}` : s.startTime || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.notes || "—"}</td>
                      <td className="px-4 py-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove shift?</AlertDialogTitle>
                              <AlertDialogDescription>Remove this shift assignment for {s.staffName}?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteShiftMutation.mutate({ id: s.id }, { onSuccess: () => { toast({ title: "Removed" }); qc.invalidateQueries({ queryKey: getListShiftsQueryKey() }); } })}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* LEAVE */}
      {activeTab === "leave" && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap items-center">
            <div className="flex gap-2">
              {["all", "pending", "approved", "rejected"].map(s => (
                <button key={s} onClick={() => setLeaveStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${leaveStatusFilter === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <Dialog open={addLeaveOpen} onOpenChange={setAddLeaveOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" variant="outline"><Plus className="h-4 w-4" /> Submit Request</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Submit Leave Request</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddLeave} className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Staff Member *</label>
                      <select name="staffId" required className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">Select staff...</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Leave Type *</label>
                      <select name="leaveType" className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="annual">Annual Leave</option>
                        <option value="sick">Sick Leave</option>
                        <option value="maternity">Maternity Leave</option>
                        <option value="paternity">Paternity Leave</option>
                        <option value="emergency">Emergency Leave</option>
                        <option value="unpaid">Unpaid Leave</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Start Date *</label>
                        <Input name="startDate" type="date" required />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">End Date *</label>
                        <Input name="endDate" type="date" required />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Reason</label>
                      <Input name="reason" placeholder="Brief reason for leave" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setAddLeaveOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createLeaveMutation.isPending}>{createLeaveMutation.isPending ? "Submitting..." : "Submit Request"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLeaveLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : filteredLeave.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Umbrella className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No leave requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeave.map(req => {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return (
                  <Card key={req.id} className="border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="font-semibold text-gray-900">{req.staffName ?? `Staff #${req.staffId}`}</span>
                            <Badge variant="outline" className="text-xs capitalize">{req.leaveType.replace("-", " ")} Leave</Badge>
                            <Badge variant="outline" className={`text-xs capitalize ${LEAVE_COLORS[req.status] ?? ""}`}>{req.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{req.startDate} — {req.endDate} <span className="text-gray-400">({days} day{days !== 1 ? "s" : ""})</span></p>
                          {req.reason && <p className="text-xs text-gray-500 mt-1">Reason: {req.reason}</p>}
                        </div>
                        {req.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" className="gap-1 h-8 bg-green-600 hover:bg-green-700" onClick={() => handleLeaveDecision(req.id, "approved")}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 h-8 text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleLeaveDecision(req.id, "rejected")}>
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete leave request?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove this leave request.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteLeaveMutation.mutate({ id: req.id }, { onSuccess: () => { toast({ title: "Deleted" }); qc.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey() }); } })}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
