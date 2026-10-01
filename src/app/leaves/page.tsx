"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  CalendarRange,
  PlaneTakeoff,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  X,
  FileText,
  Filter,
} from "lucide-react";

export default function LeavesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Subtabs
  const [subTab, setSubTab] = useState<"requests" | "balances" | "holidays">("requests");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Apply Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [formData, setFormData] = useState({
    leaveTypeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    isHalfDay: false,
    halfDayType: "FIRST_HALF",
    reason: "",
  });

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState("");
  const [rejectRemarks, setRejectRemarks] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== "ALL") query.append("status", statusFilter);

      const [leavesRes, balancesRes, typesRes, holidaysRes] = await Promise.all([
        fetch(`/api/leaves?${query.toString()}`),
        fetch(`/api/leaves/balances`),
        fetch(`/api/leaves/types`),
        fetch(`/api/leaves/holidays`),
      ]);

      if (leavesRes.ok) {
        const d = await leavesRes.json();
        setLeaves(d.leaveRequests || []);
      }
      if (balancesRes.ok) {
        const d = await balancesRes.json();
        setBalances(d.balances || []);
      }
      if (typesRes.ok) {
        const d = await typesRes.json();
        setLeaveTypes(d.leaveTypes || []);
        if (d.leaveTypes?.length > 0 && !formData.leaveTypeId) {
          setFormData((prev) => ({ ...prev, leaveTypeId: d.leaveTypes[0].id }));
        }
      }
      if (holidaysRes.ok) {
        const d = await holidaysRes.json();
        setHolidays(d.holidays || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, user]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplySubmitting(true);
    setApplyError("");
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setApplyError(data.error || "Failed to submit leave request.");
        toast.error("Application Failed", data.error || "Failed to submit leave request.");
      } else {
        toast.success("Leave Application Submitted", "Your request is now in queue for manager review.");
        setApplyModalOpen(false);
        setFormData({
          leaveTypeId: leaveTypes[0]?.id || "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          isHalfDay: false,
          halfDayType: "FIRST_HALF",
          reason: "",
        });
        fetchData();
      }
    } catch (err) {
      setApplyError("Network error. Please try again.");
      toast.error("Network Error", "Unable to submit leave request.");
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleLeaveAction = async (id: string, action: string, remarks?: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          action === "APPROVE" ? "Leave Approved" : "Leave Rejected",
          action === "APPROVE"
            ? "The employee quota has been updated."
            : "The leave request was rejected with remarks."
        );
        setRejectModalOpen(false);
        setRejectRemarks("");
        fetchData();
      } else {
        toast.error("Action Failed", data.error || "Unable to update leave status.");
      }
    } catch (e) {
      toast.error("Network Error", "Could not complete leave review action.");
    }
  };

  const isApprover = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <CalendarRange className="text-indigo-600 dark:text-indigo-400" />
              Leave & Holiday Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Multi-tiered workflow (Employee → Manager → HR/Admin) with real-time quotas and statutory compliance.
            </p>
          </div>

          <button
            onClick={() => setApplyModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <PlaneTakeoff size={16} />
            <span>Apply For Leave</span>
          </button>
        </div>

        {/* Leave Balances Cards Carousel / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {balances.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: b.color || "#6366f1" }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{b.code}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {b.allocated} Entitled
                </span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {b.available}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Days Available</span>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-1.5 flex justify-between">
                <span>Used: {b.used}</span>
                <span>Pending: {b.pending}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Subtabs & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab("requests")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === "requests"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              Leave Requests & Approvals
            </button>
            <button
              onClick={() => setSubTab("holidays")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === "holidays"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              Annual Holiday Calendar ({holidays.length})
            </button>
          </div>

          {subTab === "requests" && (
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {/* Requests Table */}
        {subTab === "requests" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration & Dates</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Approver Remarks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading leave requests...
                      </td>
                    </tr>
                  ) : leaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No leave applications match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        {/* Employee */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {leave.employee.firstName} {leave.employee.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {leave.employee.employeeCode}
                          </span>
                        </td>

                        {/* Leave Type */}
                        <td className="py-3 px-4">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: leave.leaveType.color || "#6366f1" }}
                          >
                            {leave.leaveType.name}
                          </span>
                        </td>

                        {/* Dates */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {leave.totalDays} day(s) {leave.isHalfDay ? `(Half-day ${leave.halfDayType})` : ""}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="py-3 px-4 max-w-xs text-slate-600 dark:text-slate-400 truncate">
                          {leave.reason}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              leave.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-700"
                                : leave.status === "PENDING"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>

                        {/* Remarks */}
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {leave.managerRemarks || leave.hrRemarks || "--"}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isApprover && leave.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleLeaveAction(leave.id, "APPROVE")}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                                  title="Approve leave"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedLeaveId(leave.id);
                                    setRejectModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-sm"
                                  title="Reject leave"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Self Cancel option */}
                            {user?.employee?.id === leave.employeeId && leave.status === "PENDING" && (
                              <button
                                onClick={() => handleLeaveAction(leave.id, "CANCEL")}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 rounded-lg text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Holidays View */}
        {subTab === "holidays" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map((h) => (
              <div
                key={h.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] uppercase font-bold">
                    {new Date(h.date).toLocaleDateString([], { month: "short" })}
                  </span>
                  <span className="text-base font-black leading-none">
                    {new Date(h.date).getDate()}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{h.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{h.description || "Official Holiday"}</p>
                  <span
                    className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      h.isOptional ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {h.isOptional ? "Optional / Restricted" : "National Gazetted"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Apply Leave Modal */}
        {applyModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PlaneTakeoff className="text-indigo-600" size={20} />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Apply For Leave</h3>
                </div>
                <button onClick={() => setApplyModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              {applyError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl">
                  {applyError}
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Leave Type *
                  </label>
                  <select
                    required
                    value={formData.leaveTypeId}
                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="halfDay"
                    type="checkbox"
                    checked={formData.isHalfDay}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <label htmlFor="halfDay" className="font-semibold text-slate-700 dark:text-slate-300">
                    Half-Day Leave
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Leave *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Provide context for manager approval..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applySubmitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    {applySubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rejection Modal with Reason */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Reject Leave Request</h3>
              <p className="text-xs text-slate-500">
                Please state the reason for rejecting this leave application.
              </p>
              <textarea
                rows={3}
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="e.g. Critical release deadline, insufficient coverage, etc."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLeaveAction(selectedLeaveId, "REJECT", rejectRemarks)}
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
