import React, { useState } from "react";
import { Bell, Calendar, FlaskConical, Pill, X, CheckCircle2, MessageCircle, Clock } from "lucide-react";
import { useListAppointments, useListLabOrders, useGetReportsSummary } from "@workspace/api-client-react";
import { buildReminderUrl, isToday, isTomorrow } from "@/lib/whatsapp-utils";

interface Alert {
  id: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  title: string;
  body: string;
  action?: { label: string; url: string };
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments = [] } = useListAppointments({ query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: labOrders = [] } = useListLabOrders({} as any, { query: {} as any });
  const month = new Date().toISOString().slice(0, 7);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: summary } = useGetReportsSummary({ month } as any, { query: {} as any });

  const pendingAppts = appointments.filter(a => a.status === "pending");
  const todayAppts = appointments.filter(a => a.status === "confirmed" && isToday(a.preferredDate));
  const tomorrowAppts = appointments.filter(a => a.status === "confirmed" && isTomorrow(a.preferredDate));
  const pendingLabs = labOrders.filter(o => o.status === "pending");
  const urgentLabs = labOrders.filter(o => o.status === "pending" && o.priority === "stat");
  const lowStock = summary?.lowStockDrugs ?? 0;

  const allAlerts: Alert[] = [
    // STAT labs — highest priority
    ...(urgentLabs.length > 0 ? [{
      id: "urgent-labs",
      icon: FlaskConical,
      color: "text-red-600",
      bgColor: "bg-red-50",
      title: `${urgentLabs.length} STAT Lab Order${urgentLabs.length > 1 ? "s" : ""} — Urgent`,
      body: `Emergency tests pending: ${urgentLabs.map(l => l.testName).slice(0, 2).join(", ")}${urgentLabs.length > 2 ? "..." : ""}.`,
    }] : []),

    // Today's confirmed appointments
    ...(todayAppts.length > 0 ? todayAppts.slice(0, 3).map(a => ({
      id: `today-appt-${a.id}`,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      title: `Today: ${a.patientName}`,
      body: `${a.service} at ${a.preferredTime}`,
      action: {
        label: "Send Reminder",
        url: buildReminderUrl({ patientName: a.patientName, phone: a.phone ?? "", service: a.service, preferredDate: a.preferredDate, preferredTime: a.preferredTime }),
      },
    })) : []),

    // Tomorrow's reminders
    ...(tomorrowAppts.length > 0 ? [{
      id: "tomorrow-appts",
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      title: `${tomorrowAppts.length} Appointment${tomorrowAppts.length > 1 ? "s" : ""} Tomorrow`,
      body: `${tomorrowAppts.map(a => a.patientName).slice(0, 3).join(", ")}${tomorrowAppts.length > 3 ? ` +${tomorrowAppts.length - 3} more` : ""} — send reminders now.`,
    }] : []),

    // Pending confirmations
    ...(pendingAppts.length > 0 ? [{
      id: "pending-appts",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      title: `${pendingAppts.length} Appointment${pendingAppts.length > 1 ? "s" : ""} Awaiting Confirmation`,
      body: `${pendingAppts.map(a => a.patientName).slice(0, 3).join(", ")}${pendingAppts.length > 3 ? ` +${pendingAppts.length - 3} more` : ""}.`,
    }] : []),

    // Pending labs
    ...(pendingLabs.length > 0 ? [{
      id: "pending-labs",
      icon: FlaskConical,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      title: `${pendingLabs.length} Lab Result${pendingLabs.length > 1 ? "s" : ""} Pending`,
      body: `${pendingLabs.length} test${pendingLabs.length > 1 ? "s" : ""} awaiting processing or results.`,
    }] : []),

    // Low stock
    ...(lowStock > 0 ? [{
      id: "low-stock",
      icon: Pill,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      title: `${lowStock} Drug${lowStock > 1 ? "s" : ""} Low on Stock`,
      body: "Some pharmacy items need restocking. Check the Pharmacy tab.",
    }] : []),
  ];

  const visible = allAlerts.filter(a => !dismissed.has(a.id));
  const count = visible.length;

  function dismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]));
  }

  function dismissAll() {
    setDismissed(new Set(allAlerts.map(a => a.id)));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className={`h-5 w-5 ${count > 0 ? "text-gray-700" : ""}`} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-1">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-84 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden" style={{ width: 340 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                {count > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{count}</span>}
              </div>
              {count > 0 && (
                <button onClick={dismissAll} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  Clear all
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <CheckCircle2 className="h-8 w-8 opacity-40" />
                <p className="text-sm">All clear — no new alerts.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                {visible.map(alert => (
                  <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors`}>
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${alert.bgColor}`}>
                      <alert.icon className={`h-3.5 w-3.5 ${alert.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{alert.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{alert.body}</p>
                      {alert.action && (
                        <a
                          href={alert.action.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[#25D366] hover:text-[#1da851] transition-colors"
                        >
                          <MessageCircle className="h-3 w-3" /> {alert.action.label}
                        </a>
                      )}
                    </div>
                    <button onClick={() => dismiss(alert.id)} className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[10px] text-gray-400 text-center">Alerts refresh automatically • Dismissed until next session</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
