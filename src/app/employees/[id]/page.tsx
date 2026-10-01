"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  User,
  Briefcase,
  CalendarCheck,
  CalendarRange,
  Wallet,
  FileText,
  Target,
  Activity,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit3,
  Check,
  X,
  CreditCard,
  Shield,
  Download,
  AlertCircle,
  Clock,
  Award,
} from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const id = params?.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "personal" | "employment" | "attendance" | "leave" | "payroll" | "documents" | "performance" | "activity"
  >("personal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode for Personal Information
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employees/${id}`);
      if (!res.ok) {
        setError("Employee record not found or access restricted.");
        return;
      }
      const data = await res.json();
      setEmployee(data.employee);
      setActivities(data.activities || []);
      setEditFormData({
        phone: data.employee.phone || "",
        alternatePhone: data.employee.alternatePhone || "",
        address: data.employee.address || "",
        city: data.employee.city || "",
        state: data.employee.state || "",
        postalCode: data.employee.postalCode || "",
        emergencyContactName: data.employee.emergencyContactName || "",
        emergencyContactRelation: data.employee.emergencyContactRelation || "",
        emergencyContactPhone: data.employee.emergencyContactPhone || "",
      });
    } catch (e) {
      setError("Network error while loading employee profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEmployeeData();
  }, [id]);

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profile Updated", "Employee personal details updated successfully.");
        setIsEditing(false);
        fetchEmployeeData();
      } else {
        toast.error("Save Failed", data.error || "Failed to update employee profile.");
      }
    } catch (err) {
      toast.error("Network Error", "Unable to save profile changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Employee Profile...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error || !employee) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto my-16 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <AlertCircle size={40} className="text-rose-500 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Profile Restricted</h3>
          <p className="text-xs text-slate-500">{error || "Employee not found."}</p>
          <button
            onClick={() => router.push("/employees")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
          >
            Back to Directory
          </button>
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { key: "personal", label: "1. Personal Information", icon: User },
    { key: "employment", label: "2. Employment", icon: Briefcase },
    { key: "attendance", label: "3. Attendance", icon: CalendarCheck },
    { key: "leave", label: "4. Leave", icon: CalendarRange },
    { key: "payroll", label: "5. Payroll", icon: Wallet },
    { key: "documents", label: "6. Documents", icon: FileText },
    { key: "performance", label: "7. Performance", icon: Target },
    { key: "activity", label: "8. Activity", icon: Activity },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Profile Header Banner */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={
                  employee.profilePhoto ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
                }
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-200 dark:border-indigo-800 shadow-md shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    {employee.firstName} {employee.lastName}
                  </h1>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      employee.status === "ACTIVE"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {employee.designation?.name || "Team Member"} • {employee.department?.name || "General"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {employee.employeeCode}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail size={13} /> {employee.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {employee.branch?.city || "Bengaluru"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Edit3 size={14} />
                  <span>Edit Contact</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"
                  >
                    <Check size={14} />
                    <span>{saveLoading ? "Saving..." : "Save"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 8-Tab Navigation Bar */}
          <div className="flex items-center gap-1 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: Personal Information */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                Personal & Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Date of Birth</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : "--"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Gender</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.gender || "--"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Primary Phone</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded text-xs w-full mt-1"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.phone || "--"}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Alternate Phone</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.alternatePhone}
                      onChange={(e) => setEditFormData({ ...editFormData, alternatePhone: e.target.value })}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded text-xs w-full mt-1"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.alternatePhone || "--"}</span>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Residential Address</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded text-xs w-full mt-1"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {employee.address || "--"}, {employee.city}, {employee.state} {employee.postalCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                Emergency Contact & Bank Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Contact Person</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.emergencyContactName}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded text-xs w-full mt-1"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.emergencyContactName || "--"}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Relationship</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.emergencyContactRelation || "--"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Bank Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.bankName || "HDFC Bank"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Account Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {employee.accountNumber ? `••••${employee.accountNumber.slice(-4)}` : "••••1123"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{employee.ifscCode || "HDFC0001234"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">PAN Card</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{employee.panNumber || "ABCDE1234F"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Employment */}
        {activeTab === "employment" && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Employment Hierarchy & Contract Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Department</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {employee.department?.name || "--"}
                </span>
                <span className="text-[11px] text-slate-400 block">Code: {employee.department?.code}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Designation</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {employee.designation?.name || "--"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Reporting Manager</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm block">
                  {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "Executive Leadership"}
                </span>
                <span className="text-[11px] text-slate-400">{employee.manager?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Employment Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {employee.employmentType.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Work Location</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {employee.workLocation} ({employee.branch?.name})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Shift Assignment</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {employee.shift?.name} ({employee.shift?.startTime} - {employee.shift?.endTime})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Date of Joining</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(employee.joiningDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">System Role (RBAC)</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  {employee.user?.role || "EMPLOYEE"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Attendance */}
        {activeTab === "attendance" && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Recent Attendance Punches & Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Punch In</th>
                    <th className="py-2.5 px-3">Punch Out</th>
                    <th className="py-2.5 px-3">Work Hours</th>
                    <th className="py-2.5 px-3">Arrival</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employee.attendances?.map((att: any) => (
                    <tr key={att.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(att.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            att.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-700"
                              : att.status === "ON_LEAVE"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{att.workHours} hrs</td>
                      <td className="py-2.5 px-3">
                        <span className={att.isLate ? "text-amber-500 font-bold" : "text-emerald-500"}>
                          {att.isLate ? "Late Arrival" : "On-Time"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Leave */}
        {activeTab === "leave" && (
          <div className="space-y-6">
            {/* Balances */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {employee.leaveBalances?.map((b: any) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {b.leaveType.name}
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {b.allocatedDays - b.usedDays}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/ {b.allocatedDays} available</span>
                </div>
              ))}
            </div>

            {/* Leave Requests Table */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Applied Leave History</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {employee.leaveRequests?.map((req: any) => (
                  <div key={req.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {req.leaveType.name} ({req.totalDays} days)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()} • Reason: {req.reason}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : req.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Payroll */}
        {activeTab === "payroll" && (
          <div className="space-y-6">
            {employee.salaryStructure && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Monthly Compensation & Salary Structure
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Basic Salary</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      ₹{employee.salaryStructure.basicSalary.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">HRA Allowance</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      ₹{employee.salaryStructure.hra.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Special Allowance</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      ₹{employee.salaryStructure.specialAllowance.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Gross Monthly</span>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      ₹{employee.salaryStructure.grossSalary.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Provident Fund (EPF)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      ₹{employee.salaryStructure.epfEmployee.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Professional Tax (PT)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      ₹{employee.salaryStructure.professionalTax.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Estimated TDS</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      ₹{employee.salaryStructure.tds.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Take-Home Net Salary</span>
                    <p className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                      ₹{employee.salaryStructure.netSalary.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Issued Payslips */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Issued Salary Payslips</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {employee.payslips?.map((p: any) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Payslip for {new Date(p.year, p.month - 1).toLocaleString("en-US", { month: "long" })} {p.year}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Net: ₹{p.netSalary.toLocaleString("en-IN")} • Status: {p.paymentStatus}
                      </p>
                    </div>
                    <Link
                      href={`/payroll/payslip/${p.id}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold transition-all flex items-center gap-1"
                    >
                      <Download size={13} />
                      <span>View & Download</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Documents */}
        {activeTab === "documents" && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Uploaded KYC & Employment Records
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employee.documents?.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{doc.title}</p>
                      <span className="text-[10px] text-slate-400 block">{doc.category} • {doc.fileSize || "1.2 MB"}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: Performance */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Goals & KPIs</h3>
              <div className="space-y-3">
                {employee.goals?.map((g: any) => (
                  <div key={g.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{g.title}</h4>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{g.progress}%</span>
                    </div>
                    <p className="text-xs text-slate-500">{g.description}</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: Activity */}
        {activeTab === "activity" && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              System Audit & Profile Lifecycle Activity
            </h3>
            <div className="space-y-3 text-xs">
              {activities.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">No recent profile activities recorded.</p>
              ) : (
                activities.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{act.action}</p>
                      <p className="text-slate-500 text-[11px]">{act.details || "Activity performed"}</p>
                      <span className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
