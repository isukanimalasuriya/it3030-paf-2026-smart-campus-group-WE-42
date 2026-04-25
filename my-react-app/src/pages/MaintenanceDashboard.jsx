import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTickets, updateTicketStatus } from "../services/ticketService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

/* ── helpers ────────────────────────────────────────────────────── */
const STATUS_META = {
  OPEN:        { label: "Open",        bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  IN_PROGRESS: { label: "In Progress", bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  RESOLVED:    { label: "Resolved",    bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  CLOSED:      { label: "Closed",      bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  REJECTED:    { label: "Rejected",    bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
};

const PRIORITY_META = {
  URGENT: { label: "Urgent", bg: "bg-red-500",    text: "text-white" },
  HIGH:   { label: "High",   bg: "bg-orange-400", text: "text-white" },
  MEDIUM: { label: "Medium", bg: "bg-blue-500",   text: "text-white" },
  LOW:    { label: "Low",    bg: "bg-slate-400",  text: "text-white" },
};

const CATEGORY_ICONS = {
  ELECTRICAL:   "⚡",
  PLUMBING:     "🔧",
  IT_EQUIPMENT: "💻",
  FURNITURE:    "🪑",
  OTHER:        "📋",
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.OPEN;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${m.bg} ${m.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.MEDIUM;
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ring-1 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
        </div>
        <div className="text-2xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

/* ── component ──────────────────────────────────────────────────── */
export default function MaintenanceDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(null); // ticketId being updated
  const [filterStatus, setFilterStatus] = useState("ALL");

  const myEmail = user?.email || "";

  const load = async () => {
    setLoading(true);
    try {
      const all = await fetchTickets();
      setTickets(all);
    } catch (e) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* tickets assigned to this technician */
  const myTickets = useMemo(
    () => tickets.filter((t) => t.assignedTo === myEmail),
    [tickets, myEmail]
  );

  /* stats */
  const stats = useMemo(() => ({
    total:      myTickets.length,
    open:       myTickets.filter((t) => t.status === "OPEN").length,
    inProgress: myTickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved:   myTickets.filter((t) => t.status === "RESOLVED").length,
    urgent:     myTickets.filter((t) => t.priority === "URGENT").length,
  }), [myTickets]);

  /* filtered list */
  const displayed = useMemo(
    () => filterStatus === "ALL" ? myTickets : myTickets.filter((t) => t.status === filterStatus),
    [myTickets, filterStatus]
  );

  const moveToInProgress = async (ticketId) => {
    setUpdating(ticketId);
    try {
      await updateTicketStatus(ticketId, "IN_PROGRESS");
      toast.success("Ticket moved to In Progress");
      await load();
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const markResolved = async (ticketId) => {
    setUpdating(ticketId);
    try {
      await updateTicketStatus(ticketId, "RESOLVED");
      toast.success("Ticket marked Resolved");
      await load();
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col gap-7 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between
                      rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white shadow-lg">
        <div>
          <p className="text-sm font-medium text-slate-400">{greeting()},</p>
          <h1 className="text-2xl font-bold">{user?.name || "Technician"}</h1>
          <p className="mt-0.5 text-sm text-slate-400">Maintenance Dashboard · {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}</p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          On Duty
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Assigned"    value={stats.total}      icon="📋" color="ring-slate-200 bg-white text-slate-800" />
        <StatCard label="Open"        value={stats.open}       icon="🔴" color="ring-amber-200 bg-amber-50 text-amber-900" />
        <StatCard label="In Progress" value={stats.inProgress} icon="🔵" color="ring-blue-200 bg-blue-50 text-blue-900" />
        <StatCard label="Resolved"    value={stats.resolved}   icon="✅" color="ring-emerald-200 bg-emerald-50 text-emerald-900" />
        <StatCard label="Urgent"      value={stats.urgent}     icon="🚨" color="ring-red-200 bg-red-50 text-red-900" sub="need immediate attention" />
      </div>

      {/* ── Workload breakdown ── */}
      {myTickets.length > 0 && (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-700">Workload by Category</h2>
          <div className="flex flex-wrap gap-3">
            {["ELECTRICAL","PLUMBING","IT_EQUIPMENT","FURNITURE","OTHER"].map((cat) => {
              const count = myTickets.filter((t) => t.category === cat).length;
              if (!count) return null;
              return (
                <div key={cat} className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 ring-1 ring-slate-200">
                  <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-sm font-medium text-slate-700">{cat.replace("_", " ")}</span>
                  <span className="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ticket List ── */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        {/* toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            My Assigned Tickets
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">{displayed.length}</span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            {["ALL","OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition
                  ${filterStatus === s
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {s === "ALL" ? "All" : STATUS_META[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 animate-pulse">Loading tickets…</div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
            <span className="text-5xl">🎉</span>
            <p className="font-medium">No tickets{filterStatus !== "ALL" ? ` with status "${STATUS_META[filterStatus]?.label}"` : " assigned to you"}.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayed.map((ticket) => (
              <div key={ticket.ticketId}
                   className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 text-2xl shrink-0">{CATEGORY_ICONS[ticket.category] || "📋"}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {ticket.resourceName || "Unknown Resource"}
                      <span className="ml-2 text-xs font-normal text-slate-400">#{ticket.ticketId?.slice(-6)}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{ticket.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      {ticket.createdAt && (
                        <span className="text-xs text-slate-400">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div className="flex shrink-0 items-center gap-2 pl-9 sm:pl-0">
                  {ticket.status === "OPEN" && (
                    <button
                      disabled={updating === ticket.ticketId}
                      onClick={() => moveToInProgress(ticket.ticketId)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white
                                 hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {updating === ticket.ticketId ? "…" : "Start"}
                    </button>
                  )}
                  {ticket.status === "IN_PROGRESS" && (
                    <button
                      disabled={updating === ticket.ticketId}
                      onClick={() => markResolved(ticket.ticketId)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white
                                 hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {updating === ticket.ticketId ? "…" : "Resolve"}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700
                               hover:bg-slate-200 transition"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Unassigned open tickets (awareness) ── */}
      {(() => {
        const unassigned = tickets.filter((t) => !t.assignedTo && t.status === "OPEN");
        if (!unassigned.length) return null;
        return (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <h2 className="text-sm font-bold text-amber-800">Unassigned Open Tickets ({unassigned.length})</h2>
            </div>
            <div className="flex flex-col gap-2">
              {unassigned.slice(0,5).map((t) => (
                <div key={t.ticketId}
                     className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-amber-200">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {CATEGORY_ICONS[t.category]} {t.resourceName}
                    </p>
                    <p className="text-xs text-slate-500">{t.description?.slice(0,60)}…</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <button
                      onClick={() => navigate(`/tickets/${t.ticketId}`)}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
              {unassigned.length > 5 && (
                <button onClick={() => navigate("/tickets")}
                  className="text-sm font-semibold text-amber-700 hover:underline text-center">
                  View all {unassigned.length} unassigned tickets →
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
