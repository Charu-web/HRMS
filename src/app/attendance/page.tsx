"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  CalendarCheck,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileCheck,
  Download,
  Filter,
  ArrowUpRight,
  Shield,
  Send,
  X,
  Camera,
  MapPin,
} from "lucide-react";
import { FaceAttendanceModal } from "@/components/attendance/FaceAttendanceModal";

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Face attendance modal
  const [faceModal, setFaceModal] = useState<{ open: boolean; type: "in" | "out" }>({
    open: false,
    type: "in",
  });

  // Tabs
  const [viewTab, setViewTab] = useState<"logs" | "calendar" | "corrections">("logs");

  // Punch state
  const [punching, setPunching] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState("");

  // Correction Request Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [corrDate, setCorrDate] = useState(new Date().toISOString().split("T")[0]);
  const [corrIn, setCorrIn] = useState("09:00");
  const [corrOut, setCorrOut] = useState("18:00");
  const [corrReason, setCorrReason] = useState("");
  const [corrSubmitting, setCorrSubmitting] = useState(false);

  // Filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append("month", selectedMonth.toString());
      query.append("year", selectedYear.toString());

      if (user?.role === "EMPLOYEE" && user?.employee?.id) {
        query.append("employeeId", user.employee.id);
      }

      const res = await fetch(`/api/attendance?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
        setSummary(data.summary || {});
      }

      // Fetch corrections
      const corrRes = await fetch("/api/attendance/corrections");
      if (corrRes.ok) {
        const corrData = await corrRes.json();
        setCorrections(corrData.corrections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth, selectedYear, user]);

  const handleQuickPunch = async (type: "in" | "out") => {
    setPunching(true);
    setPunchFeedback("");

    let coords: any = {};
    try {
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3500, enableHighAccuracy: true });
        }).catch(() => null);
        if (pos) {
          coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
        }
      }
    } catch (e) {}

    try {
      const endpoint = type === "in" ? "/api/attendance/check-in" : "/api/attendance/check-out";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "Attendance Hub Web Punch",
          ...coords,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPunchFeedback(data.message);
        toast.success(
          type === "in" ? "Punched In Successfully" : "Punched Out Successfully",
          data.message || "Attendance recorded."
        );
        fetchAttendanceData();
      } else {
        const err = data.error || "Punch action failed.";
        setPunchFeedback(err);
        toast.error("Punch Failed", err);
      }
    } catch (err) {
      setPunchFeedback("Network error during punch.");
      toast.error("Network Error", "Could not submit punch.");
    } finally {
      setPunching(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCorrSubmitting(true);
    try {
      const requestedCheckIn = new Date(`${corrDate}T${corrIn}:00`);
      const requestedCheckOut = new Date(`${corrDate}T${corrOut}:00`);

      const res = await fetch("/api/attendance/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: corrDate,
          requestedCheckIn,
          requestedCheckOut,
          reason: corrReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Correction Request Submitted", "Your request is awaiting reviewer sign-off.");
        setCorrectionModalOpen(false);
        setCorrReason("");
        fetchAttendanceData();
      } else {
        toast.error("Submission Failed", data.error || "Could not submit correction request.");
      }
    } catch (err) {
      toast.error("Network Error", "Unable to submit attendance correction.");
    } finally {
      setCorrSubmitting(false);
    }
  };

  const handleApproveRejectCorr = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/attendance/corrections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewerRemarks: status === "APPROVED" ? "Regularization approved." : "Rejected by reviewer.",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          status === "APPROVED" ? "Correction Approved" : "Correction Rejected",
          `The attendance timesheet adjustment was ${status.toLowerCase()}.`
        );
        fetchAttendanceData();
      } else {
        toast.error("Action Failed", data.error || "Failed to update correction status.");
      }
    } catch (e) {
      toast.error("Network Error", "Unable to review correction request.");
    }
  };

  const exportCSV = () => {
    if (attendances.length === 0) return;
    const headers = ["Date", "Employee Code", "Name", "Status", "Check In", "Check Out", "Work Hours", "Late"];
    const rows = attendances.map((a) => [
      new Date(a.date).toLocaleDateString(),
      a.employee.employeeCode,
      `"${a.employee.firstName} ${a.employee.lastName}"`,
      a.status,
      a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "--",
      a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "--",
      a.workHours,
      a.isLate ? "YES" : "NO",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_export_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isManagerOrAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Fast Punch Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <CalendarCheck className="text-indigo-600 dark:text-indigo-400" />
              Attendance & Time Tracking
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Biometric check-in/out records, working hours calculations, monthly calendar, and regularization requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleQuickPunch("in")}
              disabled={punching}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              <Clock size={16} />
              <span>Punch In</span>
            </button>
            <button
              onClick={() => handleQuickPunch("out")}
              disabled={punching}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
            >
              <Clock size={16} />
              <span>Punch Out</span>
            </button>
            <button
              onClick={() => setFaceModal({ open: true, type: "in" })}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <Camera size={16} />
              <span>Face Check-In</span>
            </button>
            <button
              onClick={() => setFaceModal({ open: true, type: "out" })}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              <Camera size={16} />
              <span>Face Check-Out</span>
            </button>
            <button
              onClick={() => setCorrectionModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-900 transition-all flex items-center gap-1.5"
            >
              <FileCheck size={16} />
              <span>Request Regularization</span>
            </button>
          </div>
        </div>

        {punchFeedback && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
            <span>{punchFeedback}</span>
            <button onClick={() => setPunchFeedback("")} className="text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase text-slate-500">Present Days</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.presentCount || 0}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase text-slate-500">Late Arrivals</span>
            <p className="text-2xl font-black text-amber-500 mt-1">{summary.lateCount || 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase text-slate-500">Leaves Taken</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {summary.onLeaveCount || 0}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase text-slate-500">Avg Work Hours</span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {summary.avgWorkHours || "8.5"} hrs
            </p>
          </div>
        </div>

        {/* View Tabs & Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab("logs")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewTab === "logs"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              Daily Punch Logs
            </button>
            <button
              onClick={() => setViewTab("calendar")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewTab === "calendar"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              Monthly Calendar Grid
            </button>
            <button
              onClick={() => setViewTab("corrections")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewTab === "corrections"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              Regularization Requests ({corrections.filter((c) => c.status === "PENDING").length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2026, i).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
            <button
              onClick={exportCSV}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600"
              title="Export CSV"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* TAB 1: Daily Punch Logs */}
        {viewTab === "logs" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Punch In</th>
                    <th className="py-3 px-4">Punch Out</th>
                    <th className="py-3 px-4">Work Duration</th>
                    <th className="py-3 px-4">Overtime</th>
                    <th className="py-3 px-4">Late / Early</th>
                    <th className="py-3 px-4">Mode & Geofence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Loading attendance entries...
                      </td>
                    </tr>
                  ) : attendances.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No attendance logs found for this period.
                      </td>
                    </tr>
                  ) : (
                    attendances.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(a.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {a.employee.firstName} {a.employee.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{a.employee.employeeCode}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              a.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-700"
                                : a.status === "ON_LEAVE"
                                ? "bg-blue-100 text-blue-700"
                                : a.status === "WEEK_OFF"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {a.workHours > 0 ? `${a.workHours} hrs` : "--"}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {a.overtimeHours > 0 ? `+${a.overtimeHours} hrs` : "0.0"}
                        </td>
                        <td className="py-3 px-4">
                          {a.isLate ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                              Late Arrival
                            </span>
                          ) : a.status === "PRESENT" ? (
                            <span className="text-[10px] text-emerald-600 font-medium">On Time</span>
                          ) : (
                            "--"
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="flex items-center gap-1 text-[10px] font-bold">
                              {a.faceVerified ? (
                                <span className="bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Camera size={10} /> Face Scan
                                </span>
                              ) : (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                  {a.checkInMode || "Web Portal"}
                                </span>
                              )}
                            </span>
                            {a.inGeofence !== null && a.inGeofence !== undefined && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                  a.inGeofence
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                <MapPin size={9} />
                                {a.inGeofence ? "In Geofence" : "Outside Geofence"}
                              </span>
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

        {/* TAB 2: Monthly Calendar Grid */}
        {viewTab === "calendar" && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Monthly Roster & Punch Status Matrix
              </h3>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Absent</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700 inline-block" /> Off</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 font-bold text-slate-400 uppercase text-[10px]">
                  {day}
                </div>
              ))}

              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = i + 1;
                const d = new Date(selectedYear, selectedMonth - 1, dayNum);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                // Match with attendances
                const found = attendances.find((a) => new Date(a.date).getDate() === dayNum);
                let badgeClass = "bg-slate-50 dark:bg-slate-800 text-slate-400";
                let statusLabel = isWeekend ? "Weekend" : "Upcoming";

                if (found) {
                  if (found.status === "PRESENT") {
                    badgeClass = found.isLate
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300"
                      : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300";
                    statusLabel = found.isLate ? "Late" : `${found.workHours}h`;
                  } else if (found.status === "ON_LEAVE") {
                    badgeClass = "bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300";
                    statusLabel = "Leave";
                  } else if (found.status === "ABSENT") {
                    badgeClass = "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300";
                    statusLabel = "Absent";
                  }
                }

                return (
                  <div
                    key={dayNum}
                    className={`p-3 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[75px] flex flex-col justify-between text-left transition-all hover:shadow-md ${badgeClass}`}
                  >
                    <span className="font-bold text-xs">{dayNum}</span>
                    <span className="text-[10px] font-semibold block uppercase tracking-wider">{statusLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Regularization Requests */}
        {viewTab === "corrections" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Attendance Regularization / Correction Queue
              </h3>
              <button
                onClick={() => setCorrectionModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                + Apply Correction
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {corrections.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No regularization requests on file.</p>
              ) : (
                corrections.map((corr) => (
                  <div key={corr.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {corr.employee.firstName} {corr.employee.lastName} ({corr.employee.employeeCode})
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            corr.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : corr.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {corr.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Date: {new Date(corr.date).toLocaleDateString()} • Requested Punch:{" "}
                        <span className="font-mono font-semibold">
                          {new Date(corr.requestedCheckIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {new Date(corr.requestedCheckOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 italic">"Reason: {corr.reason}"</p>
                    </div>

                    {isManagerOrAdmin && corr.status === "PENDING" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveRejectCorr(corr.id, "APPROVED")}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveRejectCorr(corr.id, "REJECTED")}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Regularization Modal */}
        {correctionModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Request Attendance Regularization
                </h3>
                <button onClick={() => setCorrectionModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCorrectionSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={corrDate}
                    onChange={(e) => setCorrDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Correct In Time
                    </label>
                    <input
                      type="time"
                      value={corrIn}
                      onChange={(e) => setCorrIn(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Correct Out Time
                    </label>
                    <input
                      type="time"
                      value={corrOut}
                      onChange={(e) => setCorrOut(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Justification Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={corrReason}
                    onChange={(e) => setCorrReason(e.target.value)}
                    placeholder="e.g. Biometric device error, on-duty client meeting, etc."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCorrectionModalOpen(false)}
                    className="px-3.5 py-1.5 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={corrSubmitting}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold"
                  >
                    {corrSubmitting ? "Submitting..." : "Submit Regularization"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Face Attendance Camera Modal */}
        <FaceAttendanceModal
          isOpen={faceModal.open}
          punchType={faceModal.type}
          onClose={() => setFaceModal({ ...faceModal, open: false })}
          onSuccess={(res) => {
            fetchAttendanceData();
            toast.success(
              "Face Punch Completed",
              res.message || `Facial biometric verified (${res.confidence || 98}% match)`
            );
          }}
        />
      </div>
    </AppLayout>
  );
}
