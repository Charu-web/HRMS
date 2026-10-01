"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  WalletCards,
  Coins,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function SalaryStructuresPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Edit Modal State
  const [editingStruct, setEditingStruct] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const isAdminOrHR = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "HR";

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payroll/salary-structures");
      if (res.ok) {
        const data = await res.json();
        setStructures(data.structures || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, [user]);

  // Open edit modal
  const openEditModal = (struct: any) => {
    setEditingStruct(struct);
    setEditFormData({
      employeeId: struct.employeeId,
      basicSalary: struct.basicSalary,
      hra: struct.hra,
      specialAllowance: struct.specialAllowance,
      conveyance: struct.conveyance,
      medicalAllowance: struct.medicalAllowance,
      otherAllowance: struct.otherAllowance || 0,
      bonus: struct.bonus || 0,
      incentives: struct.incentives || 0,
      epfEmployee: struct.epfEmployee,
      esiEmployee: struct.esiEmployee || 0,
      professionalTax: struct.professionalTax,
      tds: struct.tds,
      loanDeduction: struct.loanDeduction || 0,
      epfEmployer: struct.epfEmployer || 1800,
      esiEmployer: struct.esiEmployer || 0,
    });
  };

  // Live recalculated preview
  const previewGross =
    (parseFloat(editFormData.basicSalary) || 0) +
    (parseFloat(editFormData.hra) || 0) +
    (parseFloat(editFormData.specialAllowance) || 0) +
    (parseFloat(editFormData.conveyance) || 0) +
    (parseFloat(editFormData.medicalAllowance) || 0) +
    (parseFloat(editFormData.otherAllowance) || 0) +
    (parseFloat(editFormData.bonus) || 0) +
    (parseFloat(editFormData.incentives) || 0);

  const previewDeductions =
    (parseFloat(editFormData.epfEmployee) || 0) +
    (parseFloat(editFormData.esiEmployee) || 0) +
    (parseFloat(editFormData.professionalTax) || 0) +
    (parseFloat(editFormData.tds) || 0) +
    (parseFloat(editFormData.loanDeduction) || 0);

  const previewNet = previewGross - previewDeductions;
  const previewCTC = (previewGross + (parseFloat(editFormData.epfEmployer) || 0) + (parseFloat(editFormData.esiEmployer) || 0)) * 12;

  // Save changes
  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/payroll/salary-structures", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Structure Updated", "Employee salary structure saved and recalculated.");
        setEditingStruct(null);
        fetchStructures();
      } else {
        toast.error("Save Failed", data.error || "Could not update salary structure.");
      }
    } catch {
      toast.error("Network Error", "Could not reach payroll service.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered structures
  const filtered = structures.filter((s) => {
    const nameMatch =
      s.employee?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      s.employee?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      s.employee?.employeeCode?.toLowerCase().includes(search.toLowerCase());

    const deptMatch = selectedDept === "ALL" || s.employee?.department?.name === selectedDept;

    return nameMatch && deptMatch;
  });

  const departments = Array.from(
    new Set(structures.map((s) => s.employee?.department?.name).filter(Boolean))
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Coins size={22} />
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Employee Salary Structures & Components
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Statutory earnings (Basic, HRA, Allowances) and deductions (EPF, ESI, Professional Tax, TDS) configuration per employee.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/payroll"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Payroll Cycles
            </Link>
            <Link
              href="/payroll/salary-slips"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              Salary Slips Vault
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name or code..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {departments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter size={14} /> Dept:
              </span>
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
            </div>
          )}
        </div>

        {/* Salary Structures Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">HRA</th>
                  <th className="py-3 px-4">Allowances</th>
                  <th className="py-3 px-4">Gross Salary</th>
                  <th className="py-3 px-4">EPF / ESI</th>
                  <th className="py-3 px-4">Tax / TDS</th>
                  <th className="py-3 px-4">Monthly Net</th>
                  <th className="py-3 px-4">Annual CTC</th>
                  {isAdminOrHR && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Loading salary structures from database...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No matching salary structure records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {s.employee?.firstName} {s.employee?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {s.employee?.employeeCode} • {s.employee?.department?.name || "General"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        ₹{s.basicSalary.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        ₹{s.hra.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        ₹{(s.specialAllowance + s.conveyance + s.medicalAllowance + (s.otherAllowance || 0)).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        ₹{s.grossSalary.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400">
                        -₹{(s.epfEmployee + (s.esiEmployee || 0)).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400">
                        -₹{(s.professionalTax + s.tds).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{s.netSalary.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{s.ctc ? s.ctc.toLocaleString("en-IN") : (s.grossSalary * 12).toLocaleString("en-IN")}
                      </td>

                      {isAdminOrHR && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditModal(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                          >
                            <Edit2 size={13} />
                            <span>Edit Structure</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Structure Modal */}
        {editingStruct && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-indigo-600" size={18} />
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Edit Salary Structure: {editingStruct.employee?.firstName} {editingStruct.employee?.lastName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Code: {editingStruct.employee?.employeeCode} • {editingStruct.employee?.department?.name}
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingStruct(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {/* Dynamic Live Calculation Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 grid grid-cols-4 gap-3 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross Monthly</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">₹{previewGross.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Deductions</span>
                  <span className="text-sm font-black text-rose-600">₹{previewDeductions.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Net Take-Home</span>
                  <span className="text-sm font-black text-emerald-600">₹{previewNet.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Annual CTC</span>
                  <span className="text-sm font-black text-indigo-600">₹{previewCTC.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <form onSubmit={handleSaveStructure} className="space-y-4 text-xs">
                {/* Earnings Section */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-600" />
                    Monthly Earnings Components
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Basic Salary (₹)</label>
                      <input
                        type="number"
                        value={editFormData.basicSalary}
                        onChange={(e) => setEditFormData({ ...editFormData, basicSalary: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">HRA (₹)</label>
                      <input
                        type="number"
                        value={editFormData.hra}
                        onChange={(e) => setEditFormData({ ...editFormData, hra: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Special Allowance (₹)</label>
                      <input
                        type="number"
                        value={editFormData.specialAllowance}
                        onChange={(e) => setEditFormData({ ...editFormData, specialAllowance: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Conveyance (₹)</label>
                      <input
                        type="number"
                        value={editFormData.conveyance}
                        onChange={(e) => setEditFormData({ ...editFormData, conveyance: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Medical Allowance (₹)</label>
                      <input
                        type="number"
                        value={editFormData.medicalAllowance}
                        onChange={(e) => setEditFormData({ ...editFormData, medicalAllowance: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Other Allowance (₹)</label>
                      <input
                        type="number"
                        value={editFormData.otherAllowance}
                        onChange={(e) => setEditFormData({ ...editFormData, otherAllowance: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Bonus Component (₹)</label>
                      <input
                        type="number"
                        value={editFormData.bonus}
                        onChange={(e) => setEditFormData({ ...editFormData, bonus: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Incentives (₹)</label>
                      <input
                        type="number"
                        value={editFormData.incentives}
                        onChange={(e) => setEditFormData({ ...editFormData, incentives: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs text-rose-600">
                    Monthly Deductions Components
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">EPF Employee (12%)</label>
                      <input
                        type="number"
                        value={editFormData.epfEmployee}
                        onChange={(e) => setEditFormData({ ...editFormData, epfEmployee: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">ESI Employee (0.75%)</label>
                      <input
                        type="number"
                        value={editFormData.esiEmployee}
                        onChange={(e) => setEditFormData({ ...editFormData, esiEmployee: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Professional Tax (₹)</label>
                      <input
                        type="number"
                        value={editFormData.professionalTax}
                        onChange={(e) => setEditFormData({ ...editFormData, professionalTax: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">TDS Income Tax (₹)</label>
                      <input
                        type="number"
                        value={editFormData.tds}
                        onChange={(e) => setEditFormData({ ...editFormData, tds: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Employer Statutory Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs text-indigo-600">
                    Employer Contributions (Not Deducted From Gross)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">EPF Employer (12% Match)</label>
                      <input
                        type="number"
                        value={editFormData.epfEmployer}
                        onChange={(e) => setEditFormData({ ...editFormData, epfEmployer: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">ESI Employer (3.25% Match)</label>
                      <input
                        type="number"
                        value={editFormData.esiEmployer}
                        onChange={(e) => setEditFormData({ ...editFormData, esiEmployer: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingStruct(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} />
                    <span>{saving ? "Saving..." : "Save Salary Structure"}</span>
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
