import React, { useState } from "react";
import { useListConsultations, useUpdateConsultation, getListConsultationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, CheckCircle2, AlertTriangle, Clock, User, Stethoscope,
} from "lucide-react";
import { format, parseISO, isToday, isPast, isFuture, differenceInDays } from "date-fns";

type FollowUpStatus = "pending" | "attended" | "cancelled";

interface Consultation {
  id: number;
  patientId: number;
  patientName?: string;
  staffName?: string;
  visitDate: string;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  followUpDate?: string | null;
  followUpStatus?: string | null;
  notes?: string | null;
}

const STATUS_CONFIG: Record<FollowUpStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",   color: "text-yellow-700", bg: "bg-yellow-50",  border: "border-yellow-200", icon: Clock },
  attended:  { label: "Attended",  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-gray-500",   bg: "bg-gray-50",    border: "border-gray-200",   icon: AlertTriangle },
};

function getDueBadge(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return { label: "Today", color: "bg-blue-100 text-blue-700" };
  if (isPast(d)) {
    const days = Math.abs(differenceInDays(d, new Date()));
    return { label: `${days}d overdue`, color: "bg-red-100 text-red-700" };
  }
  const days = differenceInDays(d, new Date());
  return { label: `In ${days}d`, color: "bg-gray-100 text-gray-600" };
}

export default function FollowUpTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | "all">("pending");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: consultations = [], isLoading } = useListConsultations({} as any, { query: {} as any });
  const updateConsult = useUpdateConsultation();

  // Only show consultations that have a follow-up date set
  const withFollowUp = (consultations as Consultation[]).filter(c => c.followUpDate);

  const filtered = statusFilter === "all"
    ? withFollowUp
    : withFollowUp.filter(c => (c.followUpStatus ?? "pending") === statusFilter);

  // Sort: overdue first, then today, then upcoming
  const sorted = [...filtered].sort((a, b) => {
    const da = a.followUpDate ? parseISO(a.followUpDate).getTime() : 0;
    const db = b.followUpDate ? parseISO(b.followUpDate).getTime() : 0;
    return da - db;
  });

  const stats = {
    total: withFollowUp.length,
    pending: withFollowUp.filter(c => (c.followUpStatus ?? "pending") === "pending").length,
    overdue: withFollowUp.filter(c => c.followUpDate && isPast(parseISO(c.followUpDate)) && !isToday(parseISO(c.followUpDate)) && (c.followUpStatus ?? "pending") === "pending").length,
    today: withFollowUp.filter(c => c.followUpDate && isToday(parseISO(c.followUpDate))).length,
    attended: withFollowUp.filter(c => c.followUpStatus === "attended").length,
  };

  const handleStatusChange = (id: number, status: FollowUpStatus) => {
    updateConsult.mutate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id, data: { followUpStatus: status } as any },
      {
        onSuccess: () => {
          toast({ title: `Follow-up marked as ${status}` });
          qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Follow-Ups</h1>
        <p className="text-gray-500 text-sm">Track consultations requiring follow-up visits — overdue, due today, and upcoming.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900", bg: "bg-white" },
          { label: "Pending", value: stats.pending, color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "Overdue", value: stats.overdue, color: "text-red-700", bg: "bg-red-50" },
          { label: "Today", value: stats.today, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Attended", value: stats.attended, color: "text-green-700", bg: "bg-green-50" },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border shadow-none`}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-sm text-gray-500">Show:</span>
        {(["all", "pending", "attended", "cancelled"] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
              statusFilter === f
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Card key={i} className="h-36 animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Calendar className="h-10 w-10 opacity-30" />
          <p className="text-sm">No follow-ups found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map(consult => {
            const status = (consult.followUpStatus ?? "pending") as FollowUpStatus;
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
            const due = consult.followUpDate ? getDueBadge(consult.followUpDate) : null;
            return (
              <Card key={consult.id} className={`border shadow-none hover:shadow-sm transition-shadow ${status === "attended" ? "opacity-70" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <User className="h-4 w-4 text-gray-400 shrink-0" />
                        <p className="font-semibold text-gray-900 truncate">{consult.patientName ?? `Patient #${consult.patientId}`}</p>
                      </div>
                      {consult.staffName && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 ml-6">
                          <Stethoscope className="h-3 w-3" /> {consult.staffName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className={`text-xs ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        <cfg.icon className="h-3 w-3 mr-1" />{cfg.label}
                      </Badge>
                      {due && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${due.color}`}>
                          {due.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-3 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-700">Visit date:</span> {format(parseISO(consult.visitDate), "dd MMM yyyy")}</p>
                    {consult.followUpDate && (
                      <p><span className="font-medium text-gray-700">Follow-up due:</span> {format(parseISO(consult.followUpDate), "dd MMM yyyy")}</p>
                    )}
                    {consult.diagnosis && (
                      <p className="truncate"><span className="font-medium text-gray-700">Diagnosis:</span> {consult.diagnosis}</p>
                    )}
                    {consult.chiefComplaint && (
                      <p className="truncate text-gray-500 text-xs">{consult.chiefComplaint}</p>
                    )}
                  </div>

                  {status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusChange(consult.id, "attended")}
                        disabled={updateConsult.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Attended
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleStatusChange(consult.id, "cancelled")}
                        disabled={updateConsult.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
