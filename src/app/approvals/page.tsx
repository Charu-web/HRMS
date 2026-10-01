"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  CalendarRange,
  Receipt,
  FileCheck,
  Eye,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  Building2,
  User,
} from "lucide-react";

interface ApprovalItem {
  id: string;
  type: "LEAVE" | "ATTENDANCE" | "EXPENSE";
  employeeName: string;
  employeeCode: string;
  department: string;
  avatar?: string;
  date: string;
  title: string;
  details: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  amount?: number;
  raw: any;
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "LEAVE" | "ATTENDANCE" | "EXPENSE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApprovalItem[]>([]);

  // Action Modals
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [actionModal, setActionModal] = useState<"VIEW" | "REJECT" | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const [leavesRes, corrRes, expRes] = await Promise.all([
        fetch("/api/leaves"),
        fetch("/api/attendance/corrections"),
        fetch("/api/expenses"),
      ]);

      const normalized: ApprovalItem[] = [];

      // 1. Leaves
      if (leavesRes.ok) {
        const lData = await leavesRes.json();
        const leaves = lData.leaves || lData.leaveRequests || [];
        leaves.forEach((l: any) => {
          normalized.push({
            id: l.id,
            type: "LEAVE",
            employeeName: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "Employee",
            employeeCode: l.employee?.employeeCode || "EMP",
            department: l.employee?.department?.name || "General",
            avatar: l.employee?.profilePhoto,
            date: new Date(l.createdAt).toLocaleDateString(),
            title: `${l.leaveType?.name || "Leave"} (${l.days} ${l.days === 1 ? "day" : "days"})`,
            details: `${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()}: ${l.reason || "No reason specified"}`,
            status: l.status,
            raw: l,
          });
        });
      }

      // 2. Attendance Corrections
      if (corrRes.ok) {
        const cData = await corrRes.json();
        const corrections = cData.corrections || [];
        corrections.forEach((c: any) => {
          normalized.push({
            id: c.id,
            type: "ATTENDANCE",
            employeeName: c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : "Employee",
            employeeCode: c.employee?.employeeCode || "EMP",
            department: c.employee?.department?.name || "General",
            avatar: c.employee?.profilePhoto,
            date: new Date(c.createdAt).toLocaleDateString(),
            title: `Attendance Regularization (${new Date(c.date).toLocaleDateString()})`,
            details: `Correction for date ${new Date(c.date).toLocaleDateString()}: ${c.reason || "Shift adjustment"}`,
            status: c.status,
            raw: c,
          });
        });
      }

      // 3. Expenses
      if (expRes.ok) {
        const eData = await expRes.json();
        const expenses = eData.expenses || [];
        expenses.forEach((e: any) => {
          normalized.push({
            id: e.id,
            type: "EXPENSE",
            employeeName: e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : "Employee",
            employeeCode: e.employee?.employeeCode || "EMP",
            department: e.employee?.department?.name || "General",
            avatar: e.employee?.profilePhoto,
            date: new Date(e.createdAt).toLocaleDateString(),
            title: `${e.category || "Expense Claim"} (₹${Number(e.amount).toLocaleString()})`,
            details: `${e.merchant || "Claim"}: ${e.description || "Business reimbursement"}`,
            status: e.status,
            amount: Number(e.amount),
            raw: e,
          });
        });
      }

      setItems(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Fetch Error", "Unable to load approval requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [user]);

  const handleApprove = async (item: ApprovalItem) => {
    setProcessingId(item.id);
    try {
      let res;
      if (item.type === "LEAVE") {
        res = await fetch(`/api/leaves/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "APPROVE", remarks: "Approved via Approvals Hub" }),
        });
      } else if (item.type === "ATTENDANCE") {
        res = await fetch(`/api/attendance/corrections/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "APPROVE", reviewerNotes: "Approved via Approvals Hub" }),
        });
      } else {
        res = await fetch(`/api/expenses/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APPROVED" }),
        });
      }

      if (res.ok) {
        toast.success("Request Approved", `${item.type} request for ${item.employeeName} approved.`);
        fetchApprovals();
      } else {
        const err = await res.json();
        toast.error("Approval Failed", err.error || "Could not approve request.");
      }
    } catch {
      toast.error("Network Error", "Unable to process approval.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedItem) return;
    setProcessingId(selectedItem.id);
    try {
      let res;
      if (selectedItem.type === "LEAVE") {
        res = await fetch(`/api/leaves/${selectedItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "REJECT", remarks: rejectRemarks || "Rejected by reviewer." }),
        });
      } else if (selectedItem.type === "ATTENDANCE") {
        res = await fetch(`/api/attendance/corrections/${selectedItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "REJECT", reviewerNotes: rejectRemarks || "Rejected by reviewer." }),
        });
      } else {
        res = await fetch(`/api/expenses/${selectedItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REJECTED" }),
        });
      }

      if (res.ok) {
        toast.success("Request Rejected", `${selectedItem.type} request marked as rejected.`);
        setActionModal(null);
        setRejectRemarks("");
        fetchApprovals();
      } else {
        const err = await res.json();
        toast.error("Rejection Failed", err.error || "Could not reject request.");
      }
    } catch {
      toast.error("Network Error", "Unable to process rejection.");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter items
  const filtered = items.filter((i) => {
    if (i.status !== activeTab) return false;
    if (typeFilter !== "ALL" && i.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        i.employeeName.toLowerCase().includes(q) ||
        i.employeeCode.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const approvedCount = items.filter((i) => i.status === "APPROVED").length;
  const rejectedCount = items.filter((i) => i.status === "REJECTED").length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Approvals Command Center
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review, approve, or reject employee leave applications, attendance adjustments, and expense claims.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
              <Clock size={14} />
              <span>{pendingCount} Pending</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>{approvedCount} Approved</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5">
              <XCircle size={14} />
              <span>{rejectedCount} Rejected</span>
            </div>
          </div>
        </div>

        {/* Tab Selection & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* Status Tabs: Pending, Approved, Rejected */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "PENDING"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>Pending</span>
              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] flex items-center justify-center">
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("APPROVED")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "APPROVED"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>Approved</span>
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] flex items-center justify-center">
                {approvedCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("REJECTED")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "REJECTED"
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>Rejected</span>
              <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-[10px] flex items-center justify-center">
                {rejectedCount}
              </span>
            </button>
          </div>

          {/* Right Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Type selector */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {(["ALL", "LEAVE", "ATTENDANCE", "EXPENSE"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    typeFilter === t
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {t === "ALL" ? "All Types" : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Requests Table / Cards */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
            <p className="mt-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Loading approval requests...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
              No {activeTab.toLowerCase()} requests
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === "PENDING"
                ? "All caught up! There are no pending approvals requiring your immediate attention."
                : `No requests found in the ${activeTab.toLowerCase()} archive.`}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[11px] text-slate-500">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-3">Request Type</th>
                    <th className="py-3.5 px-4">Title & Details</th>
                    <th className="py-3.5 px-3">Submitted</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Employee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                            }
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.employeeName}</p>
                            <p className="text-[11px] text-slate-400">
                              {item.employeeCode} • {item.department}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Request Type */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                            item.type === "LEAVE"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              : item.type === "ATTENDANCE"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                          }`}
                        >
                          {item.type === "LEAVE" ? (
                            <CalendarRange size={12} />
                          ) : item.type === "ATTENDANCE" ? (
                            <Clock size={12} />
                          ) : (
                            <Receipt size={12} />
                          )}
                          <span>{item.type}</span>
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 max-w-md">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {item.details}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {item.date}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "PENDING"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : item.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Modal */}
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setActionModal("VIEW");
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Full Details"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Quick Approve / Reject for Pending */}
                          {item.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(item)}
                                disabled={processingId === item.id}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
                                title="Approve Request"
                              >
                                <Check size={13} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActionModal("REJECT");
                                }}
                                disabled={processingId === item.id}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
                                title="Reject Request"
                              >
                                <X size={13} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Detail Modal */}
      {actionModal === "VIEW" && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Request Details</h3>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <img
                  src={
                    selectedItem.avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                  }
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedItem.employeeName}</p>
                  <p className="text-slate-400">
                    {selectedItem.employeeCode} • {selectedItem.department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.type}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.date}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Summary & Scope</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.title}</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-1">{selectedItem.details}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Current Status</span>
                <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  {selectedItem.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
              {selectedItem.status === "PENDING" && (
                <>
                  <button
                    onClick={() => {
                      setActionModal("REJECT");
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedItem);
                      setActionModal(null);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Approve Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Remarks Modal */}
      {actionModal === "REJECT" && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Reject Request</h3>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please state the reason for rejecting {selectedItem.employeeName}&apos;s {selectedItem.type.toLowerCase()} request.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Remarks / Justification *
              </label>
              <textarea
                rows={3}
                required
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="e.g. Insufficient coverage during the project sprint cycle..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={processingId === selectedItem.id}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {processingId === selectedItem.id ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
