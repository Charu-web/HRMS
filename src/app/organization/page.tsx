"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Building2,
  Network,
  Users,
  MapPin,
  Clock,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  Briefcase,
} from "lucide-react";

export default function OrganizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orgData, setOrgData] = useState<any>(null);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"hierarchy" | "employees" | "departments" | "designations" | "branches" | "shifts">("hierarchy");
  const [teamSearch, setTeamSearch] = useState("");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<"DEPARTMENT" | "DESIGNATION" | "BRANCH" | "SHIFT">("DEPARTMENT");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      const [res, empRes] = await Promise.all([
        fetch("/api/organization"),
        fetch("/api/employees"),
      ]);
      if (res.ok) {
        const data = await res.json();
        setOrgData(data);
        if (data.departments?.length > 0 && !departmentId) {
          setDepartmentId(data.departments[0].id);
        }
      }
      if (empRes.ok) {
        const eData = await empRes.json();
        setEmployeesList(eData.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = { name, code };
      if (createType === "DESIGNATION") {
        payload.departmentId = departmentId || orgData?.departments?.[0]?.id;
      } else if (createType === "BRANCH") {
        payload.city = city;
        payload.state = state;
      } else if (createType === "SHIFT") {
        payload.startTime = startTime;
        payload.endTime = endTime;
      }

      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: createType, data: payload }),
      });
      const resData = await res.json();
      if (res.ok) {
        toast.success("Entity Created", `${createType.charAt(0) + createType.slice(1).toLowerCase()} "${name}" has been registered.`);
        setCreateModalOpen(false);
        setName("");
        setCode("");
        fetchOrg();
      } else {
        toast.error("Creation Failed", resData.error || "Failed to create organization unit.");
      }
    } catch (err) {
      toast.error("Network Error", "Unable to reach organization service.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building2 className="text-indigo-600 dark:text-indigo-400" />
              Organization & Hierarchy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Branches, departments, designations, shifts, and corporate reporting hierarchy structure.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Add Org Unit</span>
            </button>
          )}
        </div>

        {/* Company Quick Banner */}
        {orgData?.company && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                {orgData.company.name.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Parent Corporate Entity
                </span>
                <h2 className="text-xl font-black">{orgData.company.name}</h2>
                <p className="text-xs text-slate-400">{orgData.company.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-2xl font-black text-teal-400">{orgData.departments?.length || 5}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Departments</span>
              </div>
              <div>
                <span className="text-2xl font-black text-violet-400">{orgData.designations?.length || 8}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Designations</span>
              </div>
              <div>
                <span className="text-2xl font-black text-indigo-400">{orgData.branches?.length || 3}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Locations</span>
              </div>
              <div>
                <span className="text-2xl font-black text-amber-400">{orgData.shifts?.length || 3}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Shifts</span>
              </div>
            </div>
          </div>
        )}

        {/* Subtabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("hierarchy")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "hierarchy"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Network size={15} />
            <span>Reporting Structure</span>
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "employees"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Users size={15} />
            <span>Employees & Teams ({employeesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "departments"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Layers size={15} />
            <span>Departments ({orgData?.departments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("designations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "designations"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Briefcase size={15} />
            <span>Designations ({orgData?.designations?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "branches"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            <MapPin size={15} />
            <span>Branches / Locations ({orgData?.branches?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("shifts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "shifts"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Clock size={15} />
            <span>Work Shifts ({orgData?.shifts?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: Visual Org Chart */}
        {activeTab === "hierarchy" && (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 overflow-x-auto">
            <div className="text-center max-w-md mx-auto space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Interactive Organizational Chart
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Leadership & Reporting Lines
              </h3>
              <p className="text-xs text-slate-400">
                Visual structure mapping executive leaders to department heads, managers, and operational teams.
              </p>
            </div>

            {/* Tree nodes visualization */}
            <div className="flex flex-col items-center space-y-8 min-w-[700px]">
              {orgData?.orgHierarchy?.map((leader: any) => (
                <div key={leader.id} className="flex flex-col items-center">
                  {/* Top Level Exec */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-xl shadow-indigo-600/20 text-center min-w-[240px] border-2 border-indigo-400">
                    <img
                      src={leader.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                      alt="Leader"
                      className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white object-cover"
                    />
                    <h4 className="font-black text-sm">{leader.firstName} {leader.lastName}</h4>
                    <span className="text-xs text-indigo-200 block">{leader.designation?.name}</span>
                    <span className="text-[10px] font-mono opacity-80">{leader.employeeCode}</span>
                  </div>

                  {/* Subordinates */}
                  {leader.subordinates && leader.subordinates.length > 0 && (
                    <div className="flex flex-col items-center mt-4 w-full">
                      <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                      <div className="flex items-start justify-center gap-6 pt-2 border-t-2 border-slate-300 dark:border-slate-700 w-full px-8">
                        {leader.subordinates.map((mgr: any) => (
                          <div key={mgr.id} className="flex flex-col items-center">
                            <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700 -mt-2" />
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-center min-w-[200px]">
                              <img
                                src={mgr.profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                                alt="Mgr"
                                className="w-10 h-10 rounded-full mx-auto mb-1.5 object-cover"
                              />
                              <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                                {mgr.firstName} {mgr.lastName}
                              </h5>
                              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                                {mgr.designation?.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{mgr.department?.name}</span>
                            </div>

                            {/* Level 3 Subordinates */}
                            {mgr.subordinates && mgr.subordinates.length > 0 && (
                              <div className="flex flex-col items-center mt-3">
                                <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700" />
                                <div className="flex items-start justify-center gap-3 pt-2 border-t-2 border-slate-300 dark:border-slate-700">
                                  {mgr.subordinates.map((sub: any) => (
                                    <div key={sub.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center min-w-[140px]">
                                      <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                                        {sub.firstName} {sub.lastName}
                                      </p>
                                      <span className="text-[10px] text-slate-400 block">{sub.designation?.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Employees & Teams */}
        {activeTab === "employees" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Workforce Directory & Teams
                </h3>
                <p className="text-xs text-slate-400">
                  Assigned department units, direct reporting managers, and branch allocations.
                </p>
              </div>
              <input
                type="text"
                placeholder="Search staff, code, role..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[11px] text-slate-500">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Designation</th>
                    <th className="py-3 px-3">Branch Location</th>
                    <th className="py-3 px-3">Reporting Manager</th>
                    <th className="py-3 px-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employeesList
                    .filter((e) => {
                      if (!teamSearch) return true;
                      const q = teamSearch.toLowerCase();
                      return (
                        e.firstName?.toLowerCase().includes(q) ||
                        e.lastName?.toLowerCase().includes(q) ||
                        e.employeeCode?.toLowerCase().includes(q) ||
                        e.department?.name?.toLowerCase().includes(q) ||
                        e.designation?.name?.toLowerCase().includes(q)
                      );
                    })
                    .map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                emp.profilePhoto ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                              }
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400">{emp.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {emp.department?.name || "General"}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {emp.designation?.name || "Member"}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {emp.branch?.name || "Headquarters"}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : "Executive Lead"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/employees/${emp.id}`}
                            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Departments */}
        {activeTab === "departments" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orgData?.departments?.map((d: any) => (
              <div
                key={d.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {d.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {d._count?.employees || 0} Members
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{d.description || "Core operational department"}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Associated Roles ({d.designations?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {d.designations?.map((des: any) => (
                      <span
                        key={des.id}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded"
                      >
                        {des.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Designations */}
        {activeTab === "designations" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Designations Master Register</h3>
                <p className="text-xs text-slate-400">Roles configured across all organizational departments</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                {orgData?.designations?.length || 0} Total Roles
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Designation Title</th>
                    <th className="py-3 px-4">Role Code</th>
                    <th className="py-3 px-4">Assigned Department</th>
                    <th className="py-3 px-4">Active Staff</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orgData?.designations?.map((des: any) => (
                    <tr key={des.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {des.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                        {des.code}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                          <Layers size={11} className="text-indigo-500" />
                          <span>{des.department?.name || "General"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {des._count?.employees || 0} Employees
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/employees"
                          className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>View Employees</span>
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Branches */}
        {activeTab === "branches" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orgData?.branches?.map((b: any) => (
              <div
                key={b.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                    {b.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {b._count?.employees || 0} Staff
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{b.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={13} /> {b.city}, {b.state}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: Shifts */}
        {activeTab === "shifts" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orgData?.shifts?.map((s: any) => (
              <div
                key={s.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h4>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {s._count?.employees || 0} Assigned
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  Timings: {s.startTime} - {s.endTime}
                </p>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>Grace Period: {s.gracePeriodMins} minutes</p>
                  <p>Break Duration: {s.breakDurationMins} minutes</p>
                  <p>Weekly Off: {s.weeklyOffDays}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Org Unit Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Organization Entity</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Entity Type
                  </label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="DEPARTMENT">Department</option>
                    <option value="DESIGNATION">Designation / Role</option>
                    <option value="BRANCH">Branch Location</option>
                    <option value="SHIFT">Shift Schedule</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lead Frontend Architect or Hyderabad Tech Hub"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Entity Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. LFA or HYD-01"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono uppercase"
                  />
                </div>

                {createType === "DESIGNATION" && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Department *
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      {orgData?.departments?.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {createType === "BRANCH" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {createType === "SHIFT" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>
                  </div>
                )}

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
                    {submitting ? "Saving..." : "Create Entity"}
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
