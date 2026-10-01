"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Receipt,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Filter,
  X,
  ExternalLink,
} from "lucide-react";

export default function ExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("TRAVEL");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal
  const [previewReceipt, setPreviewReceipt] = useState<any>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== "ALL") query.append("status", statusFilter);

      const res = await fetch(`/api/expenses?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setSummary(data.summary || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [statusFilter, user]);

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File Too Large", "Receipt must be smaller than 5MB.");
        return;
      }
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setReceiptUrl(loadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          amount,
          description,
          receiptUrl: receiptUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Expense Claim Submitted", "Your claim has been forwarded for operational review.");
        setCreateModalOpen(false);
        setTitle("");
        setAmount("");
        setDescription("");
        setReceiptUrl("");
        setReceiptName("");
        fetchExpenses();
      } else {
        toast.error("Submission Failed", data.error || "Failed to submit expense claim.");
      }
    } catch (err) {
      toast.error("Network Error", "Unable to submit claim.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED" | "REIMBURSED") => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewerRemarks: `Status updated to ${status} by approver.`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Claim ${status}`,
          status === "REIMBURSED"
            ? "The expense has been marked as reimbursed."
            : `The expense was successfully ${status.toLowerCase()}.`
        );
        fetchExpenses();
      } else {
        toast.error("Action Failed", data.error || "Unable to update claim status.");
      }
    } catch (e) {
      toast.error("Network Error", "Unable to review expense claim.");
    }
  };

  const isManagerOrAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Receipt className="text-indigo-600 dark:text-indigo-400" />
              Expense Claims & Reimbursements
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Submit corporate expenses, travel bills, client hospitality vouchers, and track payout statuses.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Submit New Claim</span>
          </button>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Pending Review</span>
            <p className="text-2xl font-black text-amber-500">
              ₹{(summary.totalPending || 0).toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-400 block">Awaiting manager or finance sign-off</span>
          </div>
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Approved for Payout</span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              ₹{(summary.totalApproved || 0).toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-400 block">Queued for next direct bank wire</span>
          </div>
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Reimbursed</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{(summary.totalReimbursed || 0).toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-400 block">Successfully settled into salary account</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Claims Register ({expenses.length})
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REIMBURSED">Reimbursed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Expenses List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Date & Employee</th>
                  <th className="py-3 px-4">Claim Title & Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  {isManagerOrAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">Loading claims...</td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">No expense claims found.</td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {e.employee.firstName} {e.employee.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(e.claimDate).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{e.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold uppercase text-slate-500">
                          {e.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white text-sm">
                        ₹{e.amount.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4">
                        {e.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceipt(e)}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            <span>View Bill</span>
                            <ExternalLink size={12} />
                          </button>
                        ) : (
                          <span className="text-slate-400">No receipt</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            e.status === "REIMBURSED"
                              ? "bg-emerald-100 text-emerald-700"
                              : e.status === "APPROVED"
                              ? "bg-blue-100 text-blue-700"
                              : e.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {e.reviewerRemarks || e.description}
                      </td>

                      {isManagerOrAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {e.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(e.id, "APPROVED")}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(e.id, "REJECTED")}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {e.status === "APPROVED" && (
                              <button
                                onClick={() => handleUpdateStatus(e.id, "REIMBURSED")}
                                className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                              >
                                Mark Reimbursed
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Claim Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Submit Expense Claim</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Client Dinner at Bangalore Club"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      <option value="TRAVEL">Travel / Flight / Cab</option>
                      <option value="MEALS">Meals & Client Dining</option>
                      <option value="CLIENT_MEETING">Client Entertainment</option>
                      <option value="ACCOMMODATION">Hotel / Lodging</option>
                      <option value="SUPPLIES">Hardware / Tech Certification</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Amount (INR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 2450"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Business Purpose & Details *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe client, project, or justification..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Attach Bill / Receipt (Image or PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleReceiptFileChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                  />
                  {receiptName && (
                    <p className="text-[11px] text-emerald-600 mt-1 font-mono">
                      Attached: {receiptName}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    {submitting ? "Submitting..." : "Submit Claim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Receipt Preview Modal */}
        {previewReceipt && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {previewReceipt.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ₹{previewReceipt.amount.toLocaleString("en-IN")} • {previewReceipt.category}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewReceipt(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 min-h-[260px]">
                {previewReceipt.receiptUrl?.startsWith("data:image/") ||
                previewReceipt.receiptUrl?.includes("photo-") ||
                previewReceipt.receiptUrl?.endsWith(".jpg") ||
                previewReceipt.receiptUrl?.endsWith(".png") ? (
                  <img
                    src={previewReceipt.receiptUrl}
                    alt={previewReceipt.title}
                    className="max-h-[380px] object-contain rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <FileText size={48} className="mx-auto text-indigo-500" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{previewReceipt.title} Receipt</p>
                      <p className="text-xs text-slate-400">{previewReceipt.description}</p>
                    </div>
                    <a
                      href={previewReceipt.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                    >
                      <ExternalLink size={14} />
                      <span>Open External Document</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500">
                  Status: <strong className="text-indigo-600">{previewReceipt.status}</strong>
                </span>
                <button
                  onClick={() => setPreviewReceipt(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
