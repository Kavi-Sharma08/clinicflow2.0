import { useEffect, useState, useMemo } from "react";
import {
  CurrencyInrIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarCheckIcon,
  ArrowClockwiseIcon,
  BankIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import {
  adminSettlementService,
  type SettlementLedgerEntry,
} from "../../../../services/adminSettlementService";

type TabStatus = "ELIGIBLE" | "PENDING_COMPLETION" | "SETTLED" | "ALL";

export default function AdminSettlements() {
  const [entries, setEntries] = useState<SettlementLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>("ELIGIBLE");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Settlement payout modal state
  const [modalEntry, setModalEntry] = useState<SettlementLedgerEntry | null>(null);
  const [payoutReferenceInput, setPayoutReferenceInput] = useState("");
  const [settlementMethodInput, setSettlementMethodInput] = useState("MANUAL_BANK_TRANSFER");
  const [settlementNotesInput, setSettlementNotesInput] = useState("");

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await adminSettlementService.getLedger({
        status: activeTab === "ALL" ? undefined : activeTab,
        limit: 50,
      });
      setEntries(res.data?.entries || []);
    } catch {
      toast.error("Failed to load settlement ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [activeTab]);

  const openSettleModal = (entry: SettlementLedgerEntry) => {
    setModalEntry(entry);
    setPayoutReferenceInput("");
    setSettlementMethodInput("MANUAL_BANK_TRANSFER");
    setSettlementNotesInput("");
  };

  const handleConfirmMarkAsPaid = async () => {
    if (!modalEntry) return;

    const trimmedRef = payoutReferenceInput.trim();
    if (!trimmedRef) {
      toast.error("Please enter a valid bank transfer UTR or transaction reference number.");
      return;
    }

    if (trimmedRef.toUpperCase().startsWith("SIM_")) {
      toast.error("Simulated payout references (starting with SIM_) are not permitted. Please enter a genuine bank reference.");
      return;
    }

    try {
      setProcessingId(modalEntry.id);
      await adminSettlementService.markAsPaid({
        ledgerIds: [modalEntry.id],
        payoutReference: trimmedRef,
        settlementMethod: settlementMethodInput.trim() || undefined,
        notes: settlementNotesInput.trim() || undefined,
      });
      toast.success(
        `Settlement of ₹${(modalEntry.allocatedAmountPaise / 100).toLocaleString("en-IN")} marked as paid!`
      );
      setModalEntry(null);
      await fetchLedger();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark settlement as paid");
    } finally {
      setProcessingId(null);
    }
  };

  // Compute summary stats from entries
  const metrics = useMemo(() => {
    let eligibleTotalPaise = 0;
    let pendingCompletionTotalPaise = 0;
    let settledTotalPaise = 0;
    let totalCommissionPaise = 0;

    entries.forEach((e) => {
      if (e.settlementStatus === "ELIGIBLE") eligibleTotalPaise += e.allocatedAmountPaise;
      if (e.settlementStatus === "PENDING_COMPLETION") pendingCompletionTotalPaise += e.allocatedAmountPaise;
      if (e.settlementStatus === "SETTLED") settledTotalPaise += e.allocatedAmountPaise;
      if (e.paymentOrder) totalCommissionPaise += e.paymentOrder.platformFeePaise;
    });

    return {
      eligibleTotalPaise,
      pendingCompletionTotalPaise,
      settledTotalPaise,
      totalCommissionPaise,
    };
  }, [entries]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Doctor Settlements & Payouts
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Manage doctor earnings allocations (95%), platform commissions (5%), and release payouts.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLedger}
          disabled={loading}
          className="cf-btn-secondary text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowClockwiseIcon size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ─── Metric KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cf-card p-4 border border-sky-100 bg-sky-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">Ready for Payout (95%)</span>
            <span className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <CurrencyInrIcon size={18} weight="bold" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-sky-950">
            ₹{(metrics.eligibleTotalPaise / 100).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-sky-700 mt-1">Eligible after completed consultations</p>
        </div>

        <div className="cf-card p-4 border border-amber-100 bg-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Pending Completion</span>
            <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <ClockIcon size={18} weight="bold" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-950">
            ₹{(metrics.pendingCompletionTotalPaise / 100).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-amber-700 mt-1">Held until appointment is conducted</p>
        </div>

        <div className="cf-card p-4 border border-emerald-100 bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Total Settled / Paid</span>
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircleIcon size={18} weight="bold" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            ₹{(metrics.settledTotalPaise / 100).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">Released to doctors with payout reference</p>
        </div>

        <div className="cf-card p-4 border border-purple-100 bg-purple-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">ClinicFlow Revenue (5%)</span>
            <span className="p-2 rounded-lg bg-purple-100 text-purple-700">
              <BankIcon size={18} weight="bold" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-950">
            ₹{(metrics.totalCommissionPaise / 100).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-purple-700 mt-1">Platform commission retained</p>
        </div>
      </div>

      {/* ─── Filter Tabs ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-2 pb-2">
          {(
            [
              { key: "ELIGIBLE", label: "Ready for Payout (Eligible)" },
              { key: "PENDING_COMPLETION", label: "Pending Completion" },
              { key: "SETTLED", label: "Settled History" },
              { key: "ALL", label: "All Records" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === tab.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Ledger Table ────────────────────────────────────────── */}
      <div className="cf-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm font-semibold text-slate-500">
            Loading settlements...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheckIcon size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No settlement records found</p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "ELIGIBLE"
                ? "No completed consultations waiting for payout release."
                : "No entries match the selected filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Appointment</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Patient / Guest</th>
                  <th className="py-3 px-4 text-right">Gross (100%)</th>
                  <th className="py-3 px-4 text-right">Platform Fee (5%)</th>
                  <th className="py-3 px-4 text-right">Doctor Share (95%)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Payout Ref</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {entries.map((entry) => {
                  const patientName = entry.appointment.isGuest
                    ? entry.appointment.guestName || "Guest Patient"
                    : entry.appointment.patient?.user
                    ? `${entry.appointment.patient.user.firstName} ${entry.appointment.patient.user.lastName}`
                    : "Registered Patient";

                  const isEligible = entry.settlementStatus === "ELIGIBLE";
                  const isSettled = entry.settlementStatus === "SETTLED";

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {new Date(entry.appointment.appointmentDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {entry.appointment.queueNumber
                            ? `Queue #${entry.appointment.queueNumber}`
                            : entry.appointment.bookingReference || entry.appointment.id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          Dr. {entry.doctor.user.firstName} {entry.doctor.user.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500">{entry.doctor.department}</div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">{patientName}</td>

                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        ₹{((entry.paymentOrder?.grossAmountPaise || 0) / 100).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-purple-700">
                        ₹{((entry.paymentOrder?.platformFeePaise || 0) / 100).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{(entry.allocatedAmountPaise / 100).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSettled
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : isEligible
                              ? "bg-sky-100 text-sky-800 border border-sky-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {entry.settlementStatus.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {entry.payoutReference || "—"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isEligible ? (
                          <button
                            type="button"
                            onClick={() => openSettleModal(entry)}
                            disabled={processingId === entry.id}
                            className="cf-btn-primary py-1 px-3 text-xs font-semibold whitespace-nowrap"
                          >
                            {processingId === entry.id ? "Processing..." : "Mark as Paid"}
                          </button>
                        ) : isSettled ? (
                          <span className="text-emerald-600 font-semibold text-xs inline-flex items-center gap-1">
                            <CheckCircleIcon size={14} weight="fill" /> Paid
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Awaiting visit</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Settlement Payout Confirmation Modal ──────────────────────── */}
      {modalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Authorize Doctor Payout</h3>
                <p className="text-xs text-slate-500">Confirm settlement release to doctor bank account</p>
              </div>
              <button
                type="button"
                onClick={() => setModalEntry(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Summary Card */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Doctor:</span>
                  <span className="font-bold text-slate-900">
                    Dr. {modalEntry.doctor.user.firstName} {modalEntry.doctor.user.lastName} ({modalEntry.doctor.department})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Appointment:</span>
                  <span className="text-slate-700">
                    Queue #{modalEntry.appointment.queueNumber} • {new Date(modalEntry.appointment.appointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                  <span className="text-slate-700 font-bold">Settlement Amount (95%):</span>
                  <span className="font-mono text-base font-extrabold text-emerald-700">
                    ₹{(modalEntry.allocatedAmountPaise / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payout Reference / UTR Input */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Bank Reference / UTR Number
                  <span className="text-[11px] font-normal text-amber-600 ml-1.5">* (Required — enter UTR or bank reference)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={payoutReferenceInput}
                    onChange={(e) => setPayoutReferenceInput(e.target.value)}
                    placeholder="e.g. UTR9876543210 or NEFT reference"
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setPayoutReferenceInput(`UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="px-2.5 py-2 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl whitespace-nowrap"
                  >
                    Quick UTR
                  </button>
                </div>
              </div>

              {/* Settlement Method Selector */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Payout Method</label>
                <select
                  value={settlementMethodInput}
                  onChange={(e) => setSettlementMethodInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                >
                  <option value="MANUAL_BANK_TRANSFER">Manual Bank Transfer / NEFT / RTGS</option>
                  <option value="UPI">UPI / Instant Transfer</option>
                  <option value="IMPS">IMPS</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                </select>
              </div>

              {/* Notes Input */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Audit Notes (Optional)</label>
                <input
                  type="text"
                  value={settlementNotesInput}
                  onChange={(e) => setSettlementNotesInput(e.target.value)}
                  placeholder="e.g. Verified with bank statement"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalEntry(null)}
                disabled={Boolean(processingId)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkAsPaid}
                disabled={Boolean(processingId)}
                className="cf-btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingId ? "Processing..." : "Confirm & Mark as Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
