"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  Download,
  Printer,
  Users,
  CalendarCheck,
  CalendarRange,
  WalletCards,
  Receipt,
  Filter,
  Building2,
  UserPlus,
  UserMinus,
  Target,
  Search,
  MapPin,
} from "lucide-react";

export type ReportType =
  | "EMPLOYEE"
  | "ATTENDANCE"
  | "LEAVE"
  | "PAYROLL"
  | "EXPENSE"
  | "DEPARTMENT"
  | "JOINING"
  | "EXIT"
  | "PERFORMANCE"
  | "LOCATION";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>("EMPLOYEE");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/organization");
      if (res.ok) {
        const d = await res.json();
        setDepartments(d.departments || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append("type", reportType);
      if (selectedDept !== "ALL") query.append("departmentId", selectedDept);
      if (selectedStatus !== "ALL") query.append("status", selectedStatus);
      if (search) query.append("search", search);

      const res = await fetch(`/api/reports?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDept, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  const exportCSV = () => {
    if (!reportData?.rows || reportData.rows.length === 0) return;
    const headers = Object.keys(reportData.rows[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...reportData.rows.map((row: any) =>
          headers.map((h) => `"${row[h] || ""}"`).join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType.toLowerCase()}_register_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  const reportButtons = [
    { type: "EMPLOYEE" as ReportType, label: "Employee Master", icon: Users },
    { type: "ATTENDANCE" as ReportType, label: "Attendance Logs", icon: CalendarCheck },
    { type: "LEAVE" as ReportType, label: "Leave Summary", icon: CalendarRange },
    { type: "PAYROLL" as ReportType, label: "Payroll Register", icon: WalletCards },
    { type: "EXPENSE" as ReportType, label: "Expense Claims", icon: Receipt },
    { type: "DEPARTMENT" as ReportType, label: "Department Analysis", icon: Building2 },
    { type: "JOINING" as ReportType, label: "New Joiners", icon: UserPlus },
    { type: "EXIT" as ReportType, label: "Separation / Exit", icon: UserMinus },
    { type: "PERFORMANCE" as ReportType, label: "Performance & OKRs", icon: Target },
    { type: "LOCATION" as ReportType, label: "Locations & Geofences", icon: MapPin },
  ];

  const rows = reportData?.rows || [];
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="text-indigo-600 dark:text-indigo-400" />
              Reporting & Analytics Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generate compliance registers, workforce audits, attendance matrices, and export to CSV or PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={exportCSV}
              disabled={rows.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={printReport}
              disabled={rows.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Printer size={14} />
              <span>Print Register</span>
            </button>
          </div>
        </div>

        {/* 9 Report Navigation Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-print">
          {reportButtons.map((btn) => {
            const Icon = btn.icon;
            const isSelected = reportType === btn.type;
            return (
              <button
                key={btn.type}
                onClick={() => setReportType(btn.type)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={14} />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Filter size={14} />
              <span>Filters:</span>
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {reportType === "EMPLOYEE" && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-64">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search report..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </form>
        </div>

        {/* Report Output Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {reportData?.title || "Report Register"}
              </h3>
              <p className="text-xs text-slate-400">
                Generated from live database records • {rows.length} total entries
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
              {rows.length} Records
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading register data...</div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              No matching records found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                    {headers.map((h) => (
                      <th key={h} className="py-3 px-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      {headers.map((h) => (
                        <td key={h} className="py-3 px-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          {row[h] || "--"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
