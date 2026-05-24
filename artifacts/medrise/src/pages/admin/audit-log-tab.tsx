import React from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollText, RefreshCw, Search } from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create_patient:         { label: "Patient Created",        color: "bg-green-100 text-green-800" },
  update_patient:         { label: "Patient Updated",        color: "bg-blue-100 text-blue-800" },
  delete_patient:         { label: "Patient Deleted",        color: "bg-red-100 text-red-800" },
  create_consultation:    { label: "Consultation Added",     color: "bg-green-100 text-green-800" },
  update_consultation:    { label: "Consultation Updated",   color: "bg-blue-100 text-blue-800" },
  delete_consultation:    { label: "Consultation Deleted",   color: "bg-red-100 text-red-800" },
  create_invoice:         { label: "Invoice Created",        color: "bg-green-100 text-green-800" },
  record_payment:         { label: "Payment Recorded",       color: "bg-emerald-100 text-emerald-800" },
  delete_invoice:         { label: "Invoice Deleted",        color: "bg-red-100 text-red-800" },
  add_drug_stock:         { label: "Drug Stock Added",       color: "bg-green-100 text-green-800" },
  update_drug_stock:      { label: "Drug Stock Updated",     color: "bg-blue-100 text-blue-800" },
  delete_drug_stock:      { label: "Drug Stock Deleted",     color: "bg-red-100 text-red-800" },
  dispense_drug:          { label: "Drug Dispensed",         color: "bg-purple-100 text-purple-800" },
  create_lab_order:       { label: "Lab Order Created",      color: "bg-green-100 text-green-800" },
  update_lab_order_status:{ label: "Lab Status Updated",     color: "bg-blue-100 text-blue-800" },
  delete_lab_order:       { label: "Lab Order Deleted",      color: "bg-red-100 text-red-800" },
  record_lab_result:      { label: "Lab Result Recorded",    color: "bg-emerald-100 text-emerald-800" },
};

function formatAction(action: string) {
  return ACTION_LABELS[action] ?? { label: action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), color: "bg-gray-100 text-gray-700" };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" });
}

export default function AuditLogTab() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 50;

  const { data: logs = [], isLoading, refetch } = useListAuditLogs({
    limit: 200,
    offset: 0,
  });

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? logs.filter(l =>
          l.actorName?.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entityType?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.actorRole?.toLowerCase().includes(q)
        )
      : logs;
  }, [logs, search]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Audit Log</h1>
          <p className="text-gray-500 text-sm">Track all staff actions across the system.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by staff, action, details…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <ScrollText className="h-10 w-10" />
            <p className="text-sm">{search ? "No entries match your search." : "No audit log entries yet. Actions will appear here as staff use the system."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-44">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(log => {
                const { label, color } = formatAction(log.action);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap font-mono text-xs">{formatTime(log.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{log.actorName ?? <span className="text-gray-400 italic">System</span>}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{log.actorRole ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.details ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
