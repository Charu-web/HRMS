"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  WalletCards,
  Download,
  CheckCircle,
  Clock,
  Play,
  FileText,
  DollarSign,
  TrendingUp,
  Shield,
  Eye,
  X,
  CreditCard,
  Lock,
  Unlock,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function PayrollPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Process Modal
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processMonth, setProcessMonth] = useState(new Date().getMonth() + 1);
  const [processYear, setProcessYear] = useState(new Date().getFullYear());
  const [processAction, setProcessAction] = useState<"GENERATE_DRAFT" | "PROCESS">("PROCESS");
  const [processing, setProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState("");

  // Department filter
  const [selectedDept, setSelectedDept] = useState("ALL");

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payroll");
      if (res.ok) {
        const data = await res.json();
        setPayrollData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [user]);

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setProcessMessage("");
    try {
      const res = await fetch("/api/payroll/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: processMonth,
          year: processYear,
          action: processAction,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const msg = data.message || `Payroll run for ${processMonth}/${processYear} was executed.`;
        setProcessMessage(msg);
        toast.success("Payroll Processed", msg);
        setTimeout(() => {
          setProcessModalOpen(false);
          setProcessMessage("");
        }, 1500);
        fetchPayroll();
      } else {
        const err = data.error || "Failed to process payroll.";
        setProcessMessage(err);
        toast.error("Payroll Failed", err);
      }
    } catch (err) {
      setProcessMessage("Network error during payroll run.");
      toast.error("Network Error", "Unable to run payroll processing.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprovePayroll = async (id: string) => {
    try {
      const res = await fetch("/api/payroll/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Payroll Approved", data.message);
        fetchPayroll();
      } else {
        toast.error("Approval Failed", data.error);
      }
    } catch (e) {
      toast.error("Network Error", "Unable to approve payroll.");
    }
  };

  const handleLockPayroll = async (id: string, lock: boolean) => {
    try {
      const res = await fetch("/api/payroll/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, lock }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(lock ? "Payroll Locked" : "Payroll Unlocked", data.message);
        fetchPayroll();
      } else {
        toast.error("Lock Action Failed", data.error);
      }
    } catch (e) {
      toast.error("Network Error", "Unable to lock/unlock payroll.");
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const allPayslips = payrollData?.payslips || [];
  const payrollMonths = payrollData?.payrollMonths || [];

  // Filtered payslips
  const payslips = allPayslips.filter((p: any) => {
    if (selectedDept === "ALL") return true;
    return p.employee?.department?.name === selectedDept;
  });

  // Unique departments for filter
  const departments = Array.from(
    new Set(allPayslips.map((p: any) => p.employee?.department?.name).filter(Boolean))
  );

  const salaryStructure = payrollData?.salaryStructure;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <WalletCards className="text-indigo-600 dark:text-indigo-400" />
              Payroll & Compensation
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Salary structures, statutory tax calculations (EPF, PT, TDS), and compliant payslip generation.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setProcessModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <Play size={15} />
              <span>Process Monthly Payroll</span>
            </button>
          )}
        </div>

        {/* Admin Stats Overview */}
        {isAdmin && payrollData?.stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Net Disbursed</span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ₹{payrollData.stats.totalDisbursed.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 block">Across {payrollData.stats.totalEmployeesProcessed} active employees</span>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400">Statutory Tax (TDS) Withheld</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{payrollData.stats.totalTaxDeducted.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 block">Income Tax Department remittance</span>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400">Provident Fund (EPF) Contribution</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{payrollData.stats.totalPFOriented.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400 block">Employee & Employer matched</span>
            </div>
          </div>
        )}

        {/* Employee Self-Service Salary Structure Summary */}
        {!isAdmin && salaryStructure && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-indigo-950/20 border border-indigo-200 dark:border-indigo-900 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="text-indigo-600" size={18} />
              My Current Compensation & CTC Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Basic Salary</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  ₹{salaryStructure.basicSalary.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">House Rent (HRA)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  ₹{salaryStructure.hra.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Special Allowance</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  ₹{salaryStructure.specialAllowance.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Monthly Take-Home</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                  ₹{salaryStructure.netSalary.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Admin Monthly Payroll Batches Lifecycle */}
        {isAdmin && payrollMonths.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-600" />
                Monthly Payroll Cycles & Approval Status
              </h3>
              <span className="text-[11px] text-slate-400">
                Workflow: Draft → Processing → Approved → Paid → Locked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {payrollMonths.map((pm: any) => {
                const monthName = new Date(pm.year, pm.month - 1).toLocaleString("en-US", { month: "short" });
                return (
                  <div
                    key={pm.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {monthName} {pm.year}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {pm.totalEmployees || 0} Employees • ₹{(pm.totalNet || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pm.isLocked
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            : pm.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : pm.status === "APPROVED"
                            ? "bg-blue-100 text-blue-700"
                            : pm.status === "DRAFT"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {pm.isLocked ? "🔒 LOCKED" : pm.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                      {pm.status !== "APPROVED" && pm.status !== "PAID" && !pm.isLocked && (
                        <button
                          onClick={() => handleApprovePayroll(pm.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                        >
                          Approve Batch
                        </button>
                      )}
                      <button
                        onClick={() => handleLockPayroll(pm.id, !pm.isLocked)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                          pm.isLocked
                            ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300"
                        }`}
                      >
                        {pm.isLocked ? <Unlock size={11} /> : <Lock size={11} />}
                        <span>{pm.isLocked ? "Unlock Period" : "Lock Period"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payslips Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAdmin ? "Company-Wide Issued Payslips" : "My Official Salary Payslips"}
            </h3>
            {isAdmin && departments.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Filter size={13} /> Dept:
                </span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((dept: any) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400 font-medium">({payslips.length} records)</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Pay Period</th>
                  {isAdmin && <th className="py-3 px-4">Employee</th>}
                  <th className="py-3 px-4">Gross Earnings</th>
                  <th className="py-3 px-4">Total Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading payslip records...
                    </td>
                  </tr>
                ) : payslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No payslips generated for this account yet.
                    </td>
                  </tr>
                ) : (
                  payslips.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {new Date(p.year, p.month - 1).toLocaleString("en-US", { month: "long" })} {p.year}
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {p.employee.firstName} {p.employee.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.employee.employeeCode} • {p.employee.department?.name}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        ₹{p.grossEarnings.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-semibold">
                        -₹{p.totalDeductions.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{p.netSalary.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {p.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/payroll/payslip/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold transition-all shadow-sm"
                        >
                          <Eye size={13} />
                          <span>View / PDF</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Payroll Modal */}
        {processModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Play className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Run Monthly Payroll Batch
                  </h3>
                </div>
                <button onClick={() => setProcessModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              {processMessage && (
                <div className="p-3 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl">
                  {processMessage}
                </div>
              )}

              <form onSubmit={handleProcessPayroll} className="space-y-4 text-xs">
                <p className="text-slate-500">
                  This will calculate earnings, deductions, EPF, Professional Tax, and generate digital payslips for all 32 active employees.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payroll Month
                    </label>
                    <select
                      value={processMonth}
                      onChange={(e) => setProcessMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2026, i).toLocaleString("en-US", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payroll Year
                    </label>
                    <select
                      value={processYear}
                      onChange={(e) => setProcessYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Execution Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setProcessAction("PROCESS")}
                      className={`p-3 rounded-xl border cursor-pointer text-left ${
                        processAction === "PROCESS"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span className="block text-xs font-bold">Direct Disbursement</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Calculates & marks as Paid</span>
                    </div>

                    <div
                      onClick={() => setProcessAction("GENERATE_DRAFT")}
                      className={`p-3 rounded-xl border cursor-pointer text-left ${
                        processAction === "GENERATE_DRAFT"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span className="block text-xs font-bold">Generate Draft</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Preview & approve before payout</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProcessModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-1.5"
                  >
                    <Play size={14} />
                    <span>{processing ? "Processing..." : "Execute Payroll"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
