"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  UserPlus,
  Cake,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  TrendingUp,
  ArrowRight,
  Megaphone,
  PlaneTakeoff,
  Award,
  ChevronRight,
  Sparkles,
  Receipt,
  FileCheck,
  CheckCircle2,
  XCircle,
  Briefcase,
  Target,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Settings,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [punching, setPunching] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, updatesRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/product-updates?limit=3"),
      ]);
      if (dashRes.ok) {
        const json = await dashRes.json();
        setData(json);
      }
      if (updatesRes.ok) {
        const uJson = await updatesRes.json();
        setRecentUpdates(uJson.updates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPunch = async (isPunchedIn: boolean) => {
    setPunching(true);
    try {
      const endpoint = isPunchedIn ? "/api/attendance/check-out" : "/api/attendance/check-in";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: "Dashboard ESS Quick Punch" }),
      });
      const resData = await res.json();
      if (res.ok) {
        toast.success(
          isPunchedIn ? "Punched Out Successfully" : "Punched In Successfully",
          resData.message || (isPunchedIn ? "Your shift duration has been recorded." : "Your attendance for today has commenced.")
        );
        fetchDashboard();
      } else {
        toast.error("Punch Failed", resData.error || "Unable to process attendance punch.");
      }
    } catch (err) {
      toast.error("Network Error", "Could not connect to attendance service.");
    } finally {
      setPunching(false);
    }
  };

  const activeRole = data?.role || user?.role || "ADMIN";

  // ==========================================
  // VIEW 1: EMPLOYEE SELF-SERVICE (ESS)
  // ==========================================
  if (activeRole === "EMPLOYEE") {
    const ess = data?.employeeDashboard || {};
    const todayAtt = ess.todayAttendance;
    const isPunchedIn = Boolean(todayAtt?.checkIn && !todayAtt?.checkOut);
    const balances = ess.balances || [];
    const latestPayslip = ess.latestPayslip;
    const goals = ess.goals || [];
    const recentAtt = ess.recentAttendance || [];
    const holidays = ess.upcomingHolidays || [];
    const announcements = ess.announcements || [];
    const pendingTotal = (ess.pendingLeaves?.length || 0) + (ess.pendingExpenses?.length || 0) + (ess.pendingCorrections?.length || 0);

    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-950/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-teal-200 text-xs font-semibold backdrop-blur-sm">
                <Sparkles size={12} className="text-teal-300" />
                <span>Employee Self-Service (ESS) Portal</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                Welcome back, {user?.employee?.firstName || "Employee"}! 👋
              </h1>
              <p className="text-xs text-indigo-200/80 max-w-xl">
                {user?.employee?.designation?.name || "Team Member"} • {user?.employee?.department?.name || "Corporate"} • Employee ID: {user?.employee?.employeeCode}
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <Link
                href="/leaves"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all flex items-center gap-1.5"
              >
                <PlaneTakeoff size={14} />
                <span>Apply Leave</span>
              </Link>
              <Link
                href="/expenses"
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 transition-all flex items-center gap-1.5"
              >
                <Receipt size={14} />
                <span>Claim Expense</span>
              </Link>
            </div>
          </div>

          {/* Quick Punch & Daily Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Punch In / Out Card */}
            <div className="md:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPunchedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {isPunchedIn ? "Active Shift in Progress" : "Shift Not Started"}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">Shift: 09:00 AM - 06:00 PM</span>
              </div>

              <div className="my-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {todayAtt?.checkIn
                      ? new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "--:--"}
                  </p>
                  <span className="text-xs text-slate-400">
                    {todayAtt?.checkIn ? (todayAtt?.checkOut ? "Shift Completed" : "Punch In Time") : "No punch recorded today"}
                  </span>
                </div>

                {todayAtt?.checkOut && (
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {new Date(todayAtt.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <span className="text-xs text-slate-400">Punch Out Time ({todayAtt.workHours || 0} hrs)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuickPunch(isPunchedIn)}
                  disabled={punching || Boolean(todayAtt?.checkOut)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                    todayAtt?.checkOut
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : isPunchedIn
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25"
                  }`}
                >
                  <Clock size={16} />
                  <span>
                    {punching
                      ? "Processing..."
                      : todayAtt?.checkOut
                      ? "Shift Completed For Today"
                      : isPunchedIn
                      ? "Punch Out (End Shift)"
                      : "Punch In (Start Shift)"}
                  </span>
                </button>
                <Link
                  href="/attendance"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300"
                >
                  History
                </Link>
              </div>
            </div>

            {/* Leave Balance Overview */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Leaves</span>
                <PlaneTakeoff size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="my-2">
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {balances.reduce((acc: number, b: any) => acc + (b.available || 0), 0)}{" "}
                  <span className="text-sm font-semibold text-slate-400">Days</span>
                </p>
                <span className="text-[11px] text-slate-400">Across {balances.length} leave categories</span>
              </div>
              <Link href="/leaves" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <span>View Quotas</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Latest Payslip Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-teal-50 dark:from-slate-800/80 dark:to-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">Latest Payslip</span>
                <Wallet size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="my-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹{Number(latestPayslip?.netSalary || 68500).toLocaleString("en-IN")}
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {latestPayslip ? `${latestPayslip.month}/${latestPayslip.year} Disbursed` : "September 2026 Cycle"}
                </span>
              </div>
              {latestPayslip ? (
                <Link
                  href={`/payroll/payslip/${latestPayslip.id}`}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Download size={13} />
                  <span>Download Payslip</span>
                </Link>
              ) : (
                <Link href="/payroll" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  View Salary Details
                </Link>
              )}
            </div>
          </div>

          {/* Leave Quotas Grid */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-teal-600" size={16} />
              <span>Leave Balance Quotas (Year 2026)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {balances.map((b: any) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{b.name}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color || "#6366f1" }} />
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{b.available}</span>
                    <span className="text-xs text-slate-400">/ {b.allocated} days</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (b.available / (b.allocated || 1)) * 100)}%`,
                        backgroundColor: b.color || "#6366f1",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main 2-Column Split: Recent Attendance & Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Attendance Logs */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Attendance (Last 7 Days)</h3>
                </div>
                <Link href="/attendance" className="text-xs font-semibold text-indigo-600 hover:underline">
                  Full Matrix
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentAtt.length > 0 ? (
                  recentAtt.map((att: any) => (
                    <div key={att.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(att.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          In: {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"} • Out: {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            att.status === "PRESENT"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : att.status === "ON_LEAVE"
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          {att.status}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{att.workHours || 0} hrs</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">No recent logs recorded.</div>
                )}
              </div>
            </div>

            {/* My Active Goals & OKRs */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="text-teal-600" size={18} />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Performance Goals & OKRs</h3>
                </div>
                <Link href="/performance" className="text-xs font-semibold text-teal-600 hover:underline">
                  Manage OKRs
                </Link>
              </div>

              <div className="space-y-3">
                {goals.length > 0 ? (
                  goals.map((g: any) => (
                    <div key={g.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{g.title}</h4>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{g.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${g.progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Target: {new Date(g.targetDate).toLocaleDateString()}</span>
                        <span className="uppercase font-semibold">{g.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">No goals assigned for this cycle.</div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Holidays & Bulletins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upcoming Holidays */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-teal-600" size={18} />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Upcoming Holidays</h3>
                </div>
                <Link href="/leaves" className="text-xs font-semibold text-teal-600 hover:underline">
                  Calendar
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {holidays.map((h: any) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{h.name}</p>
                      <p className="text-[10px] text-slate-400">{h.description || "Public Holiday"}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-lg">
                      {new Date(h.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulletins Feed */}
            <div className="md:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Corporate Announcements</h3>
                </div>
                <Link href="/announcements" className="text-xs font-semibold text-indigo-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {announcements.map((ann: any) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {ann.priority}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ann.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{ann.title}</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">{ann.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Product Updates */}
            <div className="md:col-span-3">
              <RecentProductUpdatesWidget updates={recentUpdates} />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ==========================================
  // VIEW 2: MANAGER TEAM DASHBOARD
  // ==========================================
  if (activeRole === "MANAGER") {
    const mgr = data?.managerDashboard || {};
    const teamStats = mgr.teamStats || {};
    const teamEmployees = mgr.teamEmployees || [];
    const pendingLeaves = mgr.teamPendingLeaves || [];
    const pendingCorrections = mgr.teamPendingCorrections || [];
    const pendingExpenses = mgr.teamPendingExpenses || [];
    const todayAttendances = mgr.teamTodayAttendances || [];
    const holidays = mgr.upcomingHolidays || [];
    const announcements = mgr.announcements || [];

    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-950/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-200 text-xs font-semibold backdrop-blur-sm">
                <ShieldCheck size={12} className="text-amber-300" />
                <span>Department Manager Operational Hub</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                Team Leadership & Approvals Dashboard
              </h1>
              <p className="text-xs text-indigo-200/80 max-w-xl">
                Supervising {mgr.teamSize || 0} direct reports with live attendance tracking, pending leave workflows, and expense sign-offs.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <Link
                href="/leaves"
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-1.5"
              >
                <FileCheck size={14} />
                <span>Review Leaves ({pendingLeaves.length})</span>
              </Link>
              <Link
                href="/attendance"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all flex items-center gap-1.5"
              >
                <Clock size={14} />
                <span>Team Attendance</span>
              </Link>
            </div>
          </div>

          {/* 4 Team KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400">Direct Reports</span>
                <Users size={17} className="text-indigo-600" />
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{mgr.teamSize || 0}</p>
              <span className="text-[10px] text-slate-400 block">Active Team Members</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400">Present Today</span>
                <UserCheck size={17} className="text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-600">{teamStats.present || 0}</p>
              <span className="text-[10px] text-slate-400 block">
                {Math.round(((teamStats.present || 0) / (mgr.teamSize || 1)) * 100)}% Punch-in rate
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-400">On Leave / Absent</span>
                <CalendarDays size={17} className="text-rose-600" />
              </div>
              <p className="text-3xl font-black text-rose-600">
                {(teamStats.onLeave || 0) + (teamStats.absent || 0)}
              </p>
              <span className="text-[10px] text-slate-400 block">
                {teamStats.onLeave || 0} approved, {teamStats.absent || 0} unplanned
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-1 bg-amber-50/40 dark:bg-amber-950/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400">Pending Actions</span>
                <AlertCircle size={17} className="text-amber-600" />
              </div>
              <p className="text-3xl font-black text-amber-600">{teamStats.totalPendingApprovals || 0}</p>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-bold block">
                Awaiting your manager sign-off
              </span>
            </div>
          </div>

          {/* Pending Approvals Action Queue */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="text-amber-500" size={20} />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Action Required: Pending Team Requests ({teamStats.totalPendingApprovals || 0})
                </h3>
              </div>
              <Link href="/leaves" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Open Leave Center
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Leave Requests */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Leave Requests ({pendingLeaves.length})</span>
                  <Link href="/leaves" className="text-[11px] text-indigo-600 hover:underline lowercase font-normal">view all</Link>
                </span>
                <div className="space-y-2">
                  {pendingLeaves.length > 0 ? (
                    pendingLeaves.map((l: any) => (
                      <div key={l.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {l.employee.firstName} {l.employee.lastName}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                            {l.totalDays} Days
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{l.leaveType.name} • &quot;{l.reason}&quot;</p>
                        <Link href="/leaves" className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 pt-1">
                          <span>Review & Approve</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                      No pending leaves.
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Regularizations */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Attendance Corrections ({pendingCorrections.length})</span>
                  <Link href="/attendance" className="text-[11px] text-indigo-600 hover:underline lowercase font-normal">view all</Link>
                </span>
                <div className="space-y-2">
                  {pendingCorrections.length > 0 ? (
                    pendingCorrections.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {c.employee.firstName} {c.employee.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">&quot;{c.reason}&quot;</p>
                        <Link href="/attendance" className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 pt-1">
                          <span>Review Punch</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                      No pending corrections.
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Claims */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Expense Claims ({pendingExpenses.length})</span>
                  <Link href="/expenses" className="text-[11px] text-indigo-600 hover:underline lowercase font-normal">view all</Link>
                </span>
                <div className="space-y-2">
                  {pendingExpenses.length > 0 ? (
                    pendingExpenses.map((exp: any) => (
                      <div key={exp.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {exp.employee.firstName} {exp.employee.lastName}
                          </p>
                          <span className="text-xs font-black text-indigo-600">
                            ₹{exp.amount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{exp.category} • {exp.title}</p>
                        <Link href="/expenses" className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 pt-1">
                          <span>Approve Claim</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                      No pending expenses.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Team Attendance Roster */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-indigo-600" size={18} />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Today&apos;s Team Attendance Roster
                </h3>
              </div>
              <Link href="/attendance" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                View Detailed Logs
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamEmployees.map((emp: any) => {
                const att = todayAttendances.find((a: any) => a.employee?.employeeCode === emp.employeeCode);
                const isPresent = att?.status === "PRESENT";
                const isOnLeave = att?.status === "ON_LEAVE";

                return (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                        alt="Emp"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400">{emp.designation?.name || "Member"}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPresent
                            ? "bg-emerald-100 text-emerald-700"
                            : isOnLeave
                            ? "bg-blue-100 text-blue-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {isPresent ? "PRESENT" : isOnLeave ? "ON LEAVE" : "NOT IN YET"}
                      </span>
                      {att?.checkIn && (
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                          {new Date(att.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Product Updates */}
          <RecentProductUpdatesWidget updates={recentUpdates} />

          {/* Quick Settings Hub */}
          <QuickSettingsWidget />
        </div>
      </AppLayout>
    );
  }

  // ==========================================
  // VIEW 3: HR / SUPER ADMIN EXECUTIVE DASHBOARD
  // ==========================================
  const cards = data?.cards || {
    totalEmployees: 32,
    presentToday: 26,
    absentToday: 2,
    onLeaveToday: 4,
    newJoiners: 3,
    birthdaysCount: 2,
    pendingLeaves: 3,
    totalPendingApprovals: 5,
    payrollGross: 2108000,
    payrollNet: 1922000,
  };

  const charts = data?.charts;
  const widgets = data?.widgets;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-950/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles size={12} className="text-teal-300" />
              <span>FactoHR-Inspired Enterprise Architecture</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Executive HR & Workforce Overview
            </h1>
            <p className="text-xs text-indigo-200/80 max-w-xl">
              Real-time monitoring across 3 branches, 5 departments, attendance trends, active payroll and pending lifecycle approvals.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2">
            <Link
              href="/leaves"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <PlaneTakeoff size={14} />
              <span>Apply Leave</span>
            </Link>
            <Link
              href="/attendance"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Clock size={14} />
              <span>Attendance Portal</span>
            </Link>
          </div>
        </div>

        {/* 9 Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {/* 1. Total Employees */}
          <Link href="/employees" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Headcount</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users size={17} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {cards.totalEmployees}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2 inline-flex items-center">
                  <TrendingUp size={10} className="mr-0.5" /> Active
                </span>
              </div>
            </div>
          </Link>

          {/* 2. Present Today */}
          <Link href="/attendance" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Present Today</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck size={17} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {cards.presentToday}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-2">
                  {Math.round((cards.presentToday / (cards.totalEmployees || 1)) * 100)}% punch rate
                </span>
              </div>
            </div>
          </Link>

          {/* 3. Absent Today */}
          <Link href="/attendance" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Absent Today</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <UserX size={17} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {cards.absentToday}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-2">Unplanned</span>
              </div>
            </div>
          </Link>

          {/* 4. On Leave */}
          <Link href="/leaves" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">On Leave</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CalendarDays size={17} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {cards.onLeaveToday}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-2">Approved</span>
              </div>
            </div>
          </Link>

          {/* 5. New Joiners */}
          <Link href="/employees" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">New Joiners</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <UserPlus size={17} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {cards.newJoiners}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-2">Past 45 days</span>
              </div>
            </div>
          </Link>

          {/* 6. Birthdays */}
          <Link href="/employees" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-pink-300 dark:hover:border-pink-700 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Birthdays</span>
                <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <Cake size={17} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-pink-600 dark:text-pink-400">
                  {cards.birthdaysCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-2">This month</span>
              </div>
            </div>
          </Link>

          {/* 7. Pending Leaves */}
          <Link href="/leaves" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Leave Requests</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <PlaneTakeoff size={17} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {cards.pendingLeaves}
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded font-bold ml-2">
                  Action Required
                </span>
              </div>
            </div>
          </Link>

          {/* 8. Total Pending Approvals */}
          <Link href="/approvals" className="group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Approvals</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <CheckCircle size={17} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {cards.totalPendingApprovals}
                </span>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded font-bold ml-2">
                  Review Hub
                </span>
              </div>
            </div>
          </Link>

          {/* 9. Monthly Payroll */}
          <Link href="/payroll" className="col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-2 group">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-teal-50/50 dark:from-slate-800/80 dark:to-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-indigo-900 dark:text-indigo-300 tracking-wider">Monthly Payroll Disbursed</span>
                  <p className="text-[11px] text-slate-500">September 2026 Cycle</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Wallet size={17} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹{Number(cards.payrollNet || 1922000).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-500">Net Disbursed</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts Section */}
        {mounted && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Attendance Trends Area Chart */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Attendance Trend (Last 7 Days)
                  </h3>
                  <p className="text-xs text-slate-400">Daily breakdown of present, absent, and approved leaves</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Live Sync
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={charts?.attendanceTrends || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Present"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#presentGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Leave"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#leaveGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Headcount Bar Chart */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Headcount by Department
                  </h3>
                  <p className="text-xs text-slate-400">Distribution across 5 business units</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts?.departmentDistribution || []}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Widget 1: Today's Punch Board */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Today&apos;s Punch Board
                </h3>
              </div>
              <Link href="/attendance" className="text-xs font-semibold text-indigo-600 hover:underline">
                View all
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {widgets?.todayPunches && widgets.todayPunches.length > 0 ? (
                widgets.todayPunches.map((punch: any) => (
                  <div key={punch.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={punch.employee.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                        alt="Emp"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {punch.employee.firstName} {punch.employee.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400">{punch.employee.department?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {punch.checkIn ? new Date(punch.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                      </span>
                      <span className={`block text-[10px] font-semibold ${punch.isLate ? "text-amber-500" : "text-emerald-500"}`}>
                        {punch.isLate ? "Late" : "On-Time"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">No punches logged yet today.</div>
              )}
            </div>
          </div>

          {/* Widget 2: Pending Approvals & Action Queue */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={18} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pending Approvals
                </h3>
              </div>
              <Link href="/leaves" className="text-xs font-semibold text-indigo-600 hover:underline">
                Manage
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {widgets?.pendingApprovals && widgets.pendingApprovals.length > 0 ? (
                widgets.pendingApprovals.map((req: any) => (
                  <div key={req.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {req.employee.firstName} {req.employee.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {req.leaveType.name} ({req.totalDays} days)
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                      PENDING
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">No pending approvals. All caught up!</div>
              )}
            </div>
          </div>

          {/* Widget 3: Upcoming Holidays & Birthdays */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-teal-600 dark:text-teal-400" size={18} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Upcoming Holidays
                </h3>
              </div>
              <Link href="/leaves" className="text-xs font-semibold text-indigo-600 hover:underline">
                Full Calendar
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {widgets?.upcomingHolidays && widgets.upcomingHolidays.length > 0 ? (
                widgets.upcomingHolidays.map((h: any) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{h.name}</p>
                      <p className="text-[10px] text-slate-400">{h.description || "Company Holiday"}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-lg">
                      {new Date(h.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">No upcoming holidays scheduled.</div>
              )}
            </div>
          </div>
        </div>

        {/* Company Announcements Feed */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="text-indigo-600 dark:text-indigo-400" size={20} />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Company Announcements & Broadcasts
              </h3>
            </div>
            <Link href="/announcements" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Bulletins
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {widgets?.announcements?.map((ann: any) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ann.priority === "URGENT"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                          : ann.priority === "IMPORTANT"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ann.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700/50">
                  Posted by {ann.publishedByName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Product Updates Section */}
        <RecentProductUpdatesWidget updates={recentUpdates} />

        {/* Quick Reports & Analytics Section */}
        <QuickReportsWidget />

        {/* Quick Settings Hub */}
        <QuickSettingsWidget />
      </div>
    </AppLayout>
  );
}

function QuickReportsWidget() {
  const reports = [
    { title: "Headcount & Capacity", desc: "Workforce distribution by department", href: "/analytics" },
    { title: "Attendance Matrices", desc: "Weekly & monthly punch velocity", href: "/analytics" },
    { title: "Leave Utilization", desc: "Balance consumption & sick leave rates", href: "/analytics" },
    { title: "Payroll Register", desc: "Monthly wage distribution & deductions", href: "/analytics" },
  ];

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={20} />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Quick Reports & Analytics</h3>
        </div>
        <Link
          href="/analytics"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>View All Analytics</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {reports.map((r) => (
          <Link
            key={r.title}
            href={r.href}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-all flex flex-col justify-between group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {r.title}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{r.desc}</p>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
              <span>Generate</span>
              <ChevronRight size={11} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentProductUpdatesWidget({ updates }: { updates: any[] }) {
  if (!updates || updates.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Recent Product Updates & Releases
          </h3>
        </div>
        <Link
          href="/product-updates"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>View All Updates</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {updates.map((up: any) => (
          <div
            key={up.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {up.category}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(up.publishDate).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                {up.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {up.shortDescription}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold">{up.updateType}</span>
              <Link
                href="/product-updates"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                <span>View Release</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickSettingsWidget() {
  const quickLinks = [
    { name: "Company Information", desc: "Corporate profile & statutory IDs", href: "/settings" },
    { name: "User Roles & RBAC", desc: "Access permissions matrix", href: "/settings" },
    { name: "Attendance Settings", desc: "Work hours & late policies", href: "/settings" },
    { name: "Leave Settings", desc: "Accruals & sandwich rules", href: "/settings" },
    { name: "Payroll Settings", desc: "Statutory EPF & tax slabs", href: "/settings" },
  ];

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl shadow-indigo-950/20 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="text-indigo-400" size={20} />
          <h3 className="font-bold text-base tracking-tight">Quick Settings Hub</h3>
        </div>
        <Link
          href="/settings"
          className="text-xs font-bold text-indigo-300 hover:text-white hover:underline flex items-center gap-1"
        >
          <span>Open Full Settings</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {quickLinks.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all flex flex-col justify-between group"
          >
            <div>
              <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                {item.name}
              </p>
              <p className="text-[10px] text-indigo-200/70 mt-1 line-clamp-1">{item.desc}</p>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-indigo-300 flex items-center gap-0.5">
              <span>Configure</span>
              <ChevronRight size={11} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

