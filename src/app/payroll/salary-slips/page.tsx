"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  FileText,
  Printer,
  Download,
  Eye,
  Filter,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";

export default function SalarySlipsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState<number | "ALL">("ALL");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [search, setSearch] = useState("");

  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (selectedMonth !== "ALL") query.append("month", selectedMonth.toString());
      if (selectedYear) query.append("year", selectedYear.toString());

      const res = await fetch(`/api/payroll?${query.toString()}`);
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
    fetchPayslips();
  }, [selectedMonth, selectedYear, user]);

  const allPayslips = payrollData?.payslips || [];

  const filtered = allPayslips.filter((p: any) => {
    const nameMatch =
      p.employee?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      p.employee?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      p.employee?.employeeCode?.toLowerCase().includes(search.toLowerCase());

    const deptMatch = selectedDept === "ALL" || p.employee?.department?.name === selectedDept;

    return nameMatch && deptMatch;
  });

  const departments = Array.from(
    new Set(allPayslips.map((p: any) => p.employee?.department?.name).filter(Boolean))
  );

  const months = [
    { num: 1, name: "January" },
    { num: 2, name: "February" },
    { num: 3, name: "March" },
    { num: 4, name: "April" },
    { num: 5, name: "May" },
    { num: 6, name: "June" },
    { num: 7, name: "July" },
    { num: 8, name: "August" },
    { num: 9, name: "September" },
    { num: 10, name: "October" },
    { num: 11, name: "November" },
    { num: 12, name: "December" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <FileText size={22} />
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAdminOrManager ? "Official Salary Slips Registry" : "My Official Salary Slips"}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Compliant payslip generation, preview, PDF export, statutory earnings, deductions, and confidential payment records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/payroll"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Payroll Runs
            </Link>
            <Link
              href="/payroll/salary-structures"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Salary Structures
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value, 10))}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Months</option>
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Department Filter (Admin/Manager only) */}
            {isAdminOrManager && departments.length > 0 && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept: any) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isAdminOrManager && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Salary Slips Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Pay Period</th>
                  {isAdminOrManager && <th className="py-3 px-4">Employee</th>}
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">Gross Earnings</th>
                  <th className="py-3 px-4">EPF / Tax Deductions</th>
                  <th className="py-3 px-4">Net Take-Home</th>
                  <th className="py-3 px-4">Disbursement Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading salary slips records from database...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No salary slip records found for selected period.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {new Date(p.year, p.month - 1).toLocaleString("en-US", { month: "long" })} {p.year}
                      </td>

                      {isAdminOrManager && (
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {p.employee?.firstName} {p.employee?.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.employee?.employeeCode} • {p.employee?.department?.name || "General"}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        ₹{p.basicSalary.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        ₹{p.grossEarnings.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-semibold">
                        -₹{p.totalDeductions.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{p.netSalary.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {p.paymentStatus || "PAID"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/payroll/payslip/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all shadow-sm"
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
      </div>
    </AppLayout>
  );
}
