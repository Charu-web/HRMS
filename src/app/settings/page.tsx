"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Settings as SettingsIcon,
  Building,
  Clock,
  CalendarRange,
  WalletCards,
  Users,
  Bell,
  Shield,
  Sliders,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  CheckCircle2,
  Lock,
  FileText,
  KeyRound,
  Check,
  X,
  AlertTriangle,
  History,
  Eye,
  Plus,
  MapPin,
  Briefcase,
  FolderCheck,
  Palette,
  Navigation,
} from "lucide-react";

type SettingsCategory =
  | "GENERAL"
  | "ATTENDANCE"
  | "LOCATIONS"
  | "LEAVE"
  | "PAYROLL"
  | "SALARY_TEMPLATES"
  | "EMPLOYEES"
  | "RECRUITMENT"
  | "DOCUMENTS"
  | "USER_MANAGEMENT"
  | "NOTIFICATIONS"
  | "SECURITY"
  | "OTHER";

interface PermissionRow {
  role: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

function SettingsContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const catParam = searchParams?.get("cat") as SettingsCategory | null;

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(catParam || "GENERAL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (catParam) {
      setActiveCategory(catParam);
    }
  }, [catParam]);

  // General / Company Information State
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [country, setCountry] = useState("India");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Statutory Details
  const [panNumber, setPanNumber] = useState("");
  const [tanNumber, setTanNumber] = useState("");
  const [tanRegNumber, setTanRegNumber] = useState("");
  const [taxNature, setTaxNature] = useState("192 - Salaries");
  const [deductorType, setDeductorType] = useState("Company (Domestic)");
  const [factoryRegNumber, setFactoryRegNumber] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Attendance Settings State
  const [attendanceSettings, setAttendanceSettings] = useState<any>({
    standardWorkHours: 8,
    gracePeriodMins: 15,
    halfDayHours: 4.5,
    overtimeThresholdHours: 8,
    defaultBreakHours: 1.0,
    enableGeoFencing: false,
    allowWebPunch: true,
    allowMobilePunch: true,
    autoCheckoutEnabled: true,
    autoCheckoutTime: "23:00",
    regularizationWindowDays: 7,
  });

  // Leave Settings State
  const [leaveSettings, setLeaveSettings] = useState<any>({
    accrualCycle: "MONTHLY",
    probationaryLeaveAllowed: false,
    maxConsecutiveLeaves: 10,
    sandwichRuleEnabled: true,
    carryForwardLimitDays: 15,
    encashmentAllowed: true,
    weekendSettings: ["SATURDAY_ALT", "SUNDAY"],
  });

  // Payroll Settings State
  const [payrollSettings, setPayrollSettings] = useState<any>({
    payCycleDay: 28,
    salaryCalculationBasis: "CALENDAR_DAYS",
    taxRegimeDefault: "NEW",
    epfEmployeeRate: 12,
    epfEmployerRate: 12,
    epfWageCap: 15000,
    ptState: "Karnataka",
    payslipPasswordProtected: false,
    payslipTemplate: "STANDARD_CORPORATE",
  });

  // Notifications Settings State
  const [notificationSettings, setNotificationSettings] = useState<any>({
    emailNotifications: true,
    inAppNotifications: true,
    pushNotifications: true,
    leaveStatusAlerts: true,
    attendanceRegularizationAlerts: true,
    payrollReleaseAlerts: true,
    companyBulletinAlerts: true,
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<any>({
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    sessionTimeoutMins: 60,
    twoFactorAuthRequired: false,
    maxLoginAttempts: 5,
    lockoutDurationMins: 15,
  });

  // Permissions Matrix State
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Office Locations State
  const [locations, setLocations] = useState<any[]>([]);
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [newLocLat, setNewLocLat] = useState("");
  const [newLocLng, setNewLocLng] = useState("");
  const [newLocRadius, setNewLocRadius] = useState(500);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [creatingLoc, setCreatingLoc] = useState(false);

  // Salary Slip Templates State
  const [salaryTemplates, setSalaryTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Employee Rules State
  const [employeeSettings, setEmployeeSettings] = useState<any>({
    codePrefix: "EMP",
    codeDigits: 4,
    defaultProbationMonths: 3,
    defaultNoticePeriodDays: 30,
    requireAadhaar: true,
    requirePan: true,
    requireEmergencyContact: true,
    allowSelfProfileEdit: true,
  });

  // Recruitment Settings State
  const [recruitmentSettings, setRecruitmentSettings] = useState<any>({
    requireApprovalForJobPostings: true,
    defaultInterviewDurationMinutes: 45,
    sendCandidateStatusEmails: true,
    referralBonusAmount: 10000,
    allowEmployeeReferrals: true,
  });

  // Document Settings State
  const [documentSettings, setDocumentSettings] = useState<any>({
    maxFileSizeMb: 10,
    enableExpiryReminders: true,
    expiryReminderDaysNotice: 30,
    allowedExtensions: [".pdf", ".png", ".jpg", ".docx"],
  });

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, permRes, locRes, tmplRes, empRes, recRes, docRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/permissions"),
        fetch("/api/settings/locations"),
        fetch("/api/settings/salary-templates"),
        fetch("/api/settings/employee"),
        fetch("/api/settings/recruitment"),
        fetch("/api/settings/documents"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.company) {
          const c = data.company;
          setCompanyId(c.id);
          setCompanyName(c.name || "");
          setCompanyCode(c.code || "");
          setCompanyEmail(c.email || "");
          setCompanyPhone(c.phone || "");
          setCompanyLogo(c.logo || null);
          setAddress1(c.address1 || c.address || "");
          setAddress2(c.address2 || "");
          setAddress3(c.address3 || "");
          setCity(c.city || "");
          setState(c.state || "");
          setPinCode(c.pinCode || "");
          setCountry(c.country || "India");
          setTimezone(c.timezone || "Asia/Kolkata");
          setCurrency(c.currency || "INR");
          setDateFormat(c.dateFormat || "DD/MM/YYYY");
          setPanNumber(c.panNumber || "");
          setTanNumber(c.tanNumber || "");
          setTanRegNumber(c.tanRegistrationNumber || "");
          setTaxNature(c.taxNatureOfPayment || "192 - Salaries");
          setDeductorType(c.deductorType || "Company (Domestic)");
          setFactoryRegNumber(c.factoryRegistrationNumber || "");
        }

        if (data.attendance) setAttendanceSettings(data.attendance);
        if (data.leave) setLeaveSettings(data.leave);
        if (data.payroll) setPayrollSettings(data.payroll);
        if (data.notifications) setNotificationSettings(data.notifications);
        if (data.security) setSecuritySettings(data.security);
        if (data.users) setUsersList(data.users);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      }

      if (permRes.ok) {
        const pData = await permRes.json();
        setPermissions(pData.permissions || []);
      }

      if (locRes.ok) {
        const lData = await locRes.json();
        setLocations(lData.locations || []);
      }

      if (tmplRes.ok) {
        const tData = await tmplRes.json();
        setSalaryTemplates(tData.templates || []);
        if (tData.templates?.length > 0) {
          const def = tData.templates.find((t: any) => t.isDefault) || tData.templates[0];
          setSelectedTemplate(def);
        }
      }

      if (empRes.ok) {
        const eData = await empRes.json();
        if (eData.employeeSettings) setEmployeeSettings(eData.employeeSettings);
      }

      if (recRes.ok) {
        const rData = await recRes.json();
        if (rData.recruitmentSettings) setRecruitmentSettings(rData.recruitmentSettings);
      }

      if (docRes.ok) {
        const dData = await docRes.json();
        if (dData.documentSettings) setDocumentSettings(dData.documentSettings);
      }
    } catch (err) {
      console.error(err);
      toast.error("Settings Error", "Unable to load complete enterprise settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  // Handle Logo Upload via FileReader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File Too Large", "Company logo must be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setCompanyLogo(loadEvt.target.result as string);
          toast.success("Logo Ready", "Click Save to apply changes.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = () => {
    setCompanyLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    toast.info("Logo Removed", "Click Save to persist removal.");
  };

  // Save Handlers
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          email: companyEmail,
          phone: companyPhone,
          logo: companyLogo,
          address1,
          address2,
          address3,
          city,
          state,
          pinCode,
          country,
          timezone,
          currency,
          dateFormat,
          panNumber,
          tanNumber,
          tanRegistrationNumber: tanRegNumber,
          taxNatureOfPayment: taxNature,
          deductorType,
          factoryRegistrationNumber: factoryRegNumber,
        }),
      });

      if (res.ok) {
        toast.success("Company Information Updated", "All legal and statutory details saved to database.");
        fetchAllSettings();
      } else {
        const err = await res.json();
        toast.error("Update Failed", err.error || "Failed to update company information.");
      }
    } catch {
      toast.error("Network Error", "Unable to connect to settings service.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategorySettings = async (category: SettingsCategory, data: any) => {
    setSaving(true);
    const endpointMap: Record<string, string> = {
      ATTENDANCE: "/api/settings/attendance",
      LEAVE: "/api/settings/leave",
      PAYROLL: "/api/settings/payroll",
      EMPLOYEES: "/api/settings/employee",
      RECRUITMENT: "/api/settings/recruitment",
      DOCUMENTS: "/api/settings/documents",
      NOTIFICATIONS: "/api/settings/notifications",
      SECURITY: "/api/settings/security",
    };

    const endpoint = endpointMap[category];
    if (!endpoint) return;

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Settings Saved", `${category} configuration updated successfully.`);
        fetchAllSettings();
      } else {
        const err = await res.json();
        toast.error("Save Failed", err.error || "Failed to update settings.");
      }
    } catch {
      toast.error("Network Error", "Failed to communicate with settings endpoint.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocLat || !newLocLng) {
      toast.error("Validation Error", "Name, Latitude, and Longitude are required.");
      return;
    }
    setCreatingLoc(true);
    try {
      const res = await fetch("/api/settings/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLocName,
          address: newLocAddress,
          latitude: parseFloat(newLocLat),
          longitude: parseFloat(newLocLng),
          radiusMeters: Number(newLocRadius) || 500,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Office Location Added", `${newLocName} geofence is active.`);
        setNewLocName("");
        setNewLocAddress("");
        setNewLocLat("");
        setNewLocLng("");
        setLocModalOpen(false);
        fetchAllSettings();
      } else {
        toast.error("Failed to Add Location", data.error || "Could not save office location.");
      }
    } catch {
      toast.error("Network Error", "Could not reach locations API.");
    } finally {
      setCreatingLoc(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/locations?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Location Removed", "Geofence location was deleted.");
        fetchAllSettings();
      } else {
        const err = await res.json();
        toast.error("Delete Failed", err.error);
      }
    } catch {
      toast.error("Network Error", "Failed to delete location.");
    }
  };

  const handleSaveSalaryTemplate = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/salary-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTemplate),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Salary Slip Template Saved", "Custom branding and signatory rules updated.");
        fetchAllSettings();
      } else {
        toast.error("Save Failed", data.error || "Failed to update salary template.");
      }
    } catch {
      toast.error("Network Error", "Unable to save salary template.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle permission cell
  const handleTogglePermission = (
    moduleName: string,
    field: "canView" | "canCreate" | "canEdit" | "canDelete" | "canApprove" | "canExport"
  ) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role === selectedRole && p.module === moduleName) {
          return { ...p, [field]: !p[field] };
        }
        return p;
      })
    );
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      if (res.ok) {
        toast.success("Permissions Matrix Saved", "RBAC access rules synchronized across system.");
        fetchAllSettings();
      } else {
        const err = await res.json();
        toast.error("Update Failed", err.error || "Failed to persist permissions.");
      }
    } catch {
      toast.error("Network Error", "Unable to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  const navCategories = [
    { id: "GENERAL", label: "General & Company", icon: Building },
    { id: "ATTENDANCE", label: "Attendance & Hours", icon: Clock },
    { id: "LOCATIONS", label: "Office Geofences", icon: MapPin },
    { id: "LEAVE", label: "Leave & Holidays", icon: CalendarRange },
    { id: "PAYROLL", label: "Payroll & Statutory", icon: WalletCards },
    { id: "SALARY_TEMPLATES", label: "Salary Slip Templates", icon: FileText },
    { id: "EMPLOYEES", label: "Employee Policies", icon: Users },
    { id: "RECRUITMENT", label: "Recruitment Workflow", icon: Briefcase },
    { id: "DOCUMENTS", label: "Document Compliance", icon: FolderCheck },
    { id: "USER_MANAGEMENT", label: "Users & RBAC Matrix", icon: Sliders },
    { id: "NOTIFICATIONS", label: "Notifications & Alerts", icon: Bell },
    { id: "SECURITY", label: "Security & Passwords", icon: Shield },
    { id: "OTHER", label: "System & Integration", icon: Sliders },
  ];

  const modulesList = [
    "Employees",
    "Attendance",
    "Leave",
    "Payroll",
    "Expenses",
    "Documents",
    "Performance",
    "Recruitment",
    "Reports",
    "Product Updates",
    "Settings",
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <SettingsIcon className="text-indigo-600 dark:text-indigo-400" />
              Enterprise System Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure company profile, statutory registrations, attendance rules, payroll formulas, and RBAC matrix.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {user?.role === "SUPER_ADMIN" ? "Super Admin Access" : "HR Admin Mode"}
            </span>
          </div>
        </div>

        {/* Settings Layout: Left Nav + Right Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-sm">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Settings Directory
            </p>
            {navCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as SettingsCategory)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[550px]">
            {loading ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Loading configuration parameters...</p>
              </div>
            ) : (
              <>
                {/* 1. GENERAL / COMPANY INFORMATION */}
                {activeCategory === "GENERAL" && (
                  <form onSubmit={handleSaveCompany} className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          Company & Statutory Information
                        </h2>
                        <p className="text-xs text-slate-400">
                          Legal entity registration, corporate branding, address, and tax filing details.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={fetchAllSettings}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5"
                        >
                          <RotateCcw size={14} className={saving ? "animate-spin" : ""} />
                          <span>Update</span>
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                        >
                          <Save size={14} />
                          <span>{saving ? "Saving..." : "Save"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Logo Section */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex flex-col sm:flex-row items-center gap-5 border border-slate-100 dark:border-slate-800">
                      <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                        {companyLogo ? (
                          <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building size={32} className="text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-2 flex-1 text-center sm:text-left">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          Company Brand Logo
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Upload high-resolution transparent PNG or SVG (Max 2MB). Used on payslips, reports & portal.
                        </p>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <input
                            type="file"
                            ref={logoInputRef}
                            onChange={handleLogoUpload}
                            accept="image/png,image/jpeg,image/svg+xml"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-indigo-100"
                          >
                            <Upload size={13} />
                            <span>Replace Logo</span>
                          </button>
                          {companyLogo && (
                            <button
                              type="button"
                              onClick={handleDeleteLogo}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-rose-100"
                            >
                              <Trash2 size={13} />
                              <span>Delete Logo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Primary Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-bold mb-1">Company Name *</label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Official Email *</label>
                        <input
                          type="email"
                          required
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Mobile / Phone *</label>
                        <input
                          type="text"
                          required
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Extended Address */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Registered Corporate Address
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="block font-medium mb-1 text-slate-500">Address Line 1</label>
                          <input
                            type="text"
                            value={address1}
                            onChange={(e) => setAddress1(e.target.value)}
                            placeholder="Tower, Building, Suite..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1 text-slate-500">Address Line 2</label>
                          <input
                            type="text"
                            value={address2}
                            onChange={(e) => setAddress2(e.target.value)}
                            placeholder="Street, Industrial Area..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1 text-slate-500">Address Line 3</label>
                          <input
                            type="text"
                            value={address3}
                            onChange={(e) => setAddress3(e.target.value)}
                            placeholder="Landmark or Campus..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <label className="block font-medium mb-1 text-slate-500">City</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1 text-slate-500">State</label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1 text-slate-500">PIN Code</label>
                          <input
                            type="text"
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1 text-slate-500">Country</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Statutory Details */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Statutory & Regulatory Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="block font-bold mb-1">Company PAN Number</label>
                          <input
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                            placeholder="AAACZ1234K"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">TAN Number</label>
                          <input
                            type="text"
                            value={tanNumber}
                            onChange={(e) => setTanNumber(e.target.value.toUpperCase())}
                            placeholder="BLRZ01234D"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">TAN Registration Number</label>
                          <input
                            type="text"
                            value={tanRegNumber}
                            onChange={(e) => setTanRegNumber(e.target.value)}
                            placeholder="TAN-REG-2024-998"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="block font-bold mb-1">Tax Nature of Payment</label>
                          <input
                            type="text"
                            value={taxNature}
                            onChange={(e) => setTaxNature(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Deductor Type</label>
                          <select
                            value={deductorType}
                            onChange={(e) => setDeductorType(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          >
                            <option value="Company (Domestic)">Company (Domestic)</option>
                            <option value="Company (Foreign)">Company (Foreign)</option>
                            <option value="LLP">LLP / Partnership</option>
                            <option value="Statutory Corporation">Statutory Corporation</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Factory Registration No.</label>
                          <input
                            type="text"
                            value={factoryRegNumber}
                            onChange={(e) => setFactoryRegNumber(e.target.value)}
                            placeholder="KAR/BNG/FACT/2023/..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Regional & Localization */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Localization & Time Standard
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="block font-bold mb-1">Time Zone</label>
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                            <option value="UTC">UTC (Universal Coordinated)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                            <option value="America/New_York">America/New_York (EST -5:00)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Base Currency</label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          >
                            <option value="INR">INR (₹ - Indian Rupee)</option>
                            <option value="USD">USD ($ - US Dollar)</option>
                            <option value="AED">AED (د.إ - UAE Dirham)</option>
                            <option value="EUR">EUR (€ - Euro)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Date Display Format</label>
                          <select
                            value={dateFormat}
                            onChange={(e) => setDateFormat(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          >
                            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 30/09/2026)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/30/2026)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* 2. ATTENDANCE SETTINGS */}
                {activeCategory === "ATTENDANCE" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          Attendance & Time Tracking Rules
                        </h2>
                        <p className="text-xs text-slate-400">
                          Work hour thresholds, late arrival buffers, auto-checkout, and regularization windows.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCategorySettings("ATTENDANCE", attendanceSettings)}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Rules"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Shift & Working Hours</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Standard Work Hours per Day</label>
                          <input
                            type="number"
                            value={attendanceSettings.standardWorkHours}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, standardWorkHours: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Half Day Minimum Hours</label>
                          <input
                            type="number"
                            step="0.5"
                            value={attendanceSettings.halfDayHours}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, halfDayHours: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Overtime Threshold (Hours)</label>
                          <input
                            type="number"
                            value={attendanceSettings.overtimeThresholdHours}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, overtimeThresholdHours: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Late & Regularization Policy</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Grace Period (Minutes after shift start)</label>
                          <input
                            type="number"
                            value={attendanceSettings.gracePeriodMins}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, gracePeriodMins: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Regularization Request Window (Days)</label>
                          <input
                            type="number"
                            value={attendanceSettings.regularizationWindowDays}
                            onChange={(e) =>
                              setAttendanceSettings({
                                ...attendanceSettings,
                                regularizationWindowDays: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Auto-Checkout Midnight Time</label>
                          <input
                            type="time"
                            value={attendanceSettings.autoCheckoutTime}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, autoCheckoutTime: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Clock Punch Modes & Biometrics</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendanceSettings.allowWebPunch !== false}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, allowWebPunch: e.target.checked })
                            }
                            className="rounded text-indigo-600"
                          />
                          <span>Allow Web Portal Clock In/Out</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendanceSettings.allowMobilePunch !== false}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, allowMobilePunch: e.target.checked })
                            }
                            className="rounded text-indigo-600"
                          />
                          <span>Allow Mobile GPS Clock Punch</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendanceSettings.enableGeoFencing || false}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, enableGeoFencing: e.target.checked })
                            }
                            className="rounded text-indigo-600"
                          />
                          <span>Enable Geofence Validation</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendanceSettings.requireFaceAttendance || false}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, requireFaceAttendance: e.target.checked })
                            }
                            className="rounded text-indigo-600"
                          />
                          <span>
                            <strong>Mandatory Facial Biometrics:</strong> Reject standard punch; require webcam face verification
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendanceSettings.requireGeofencing || false}
                            onChange={(e) =>
                              setAttendanceSettings({ ...attendanceSettings, requireGeofencing: e.target.checked })
                            }
                            className="rounded text-indigo-600"
                          />
                          <span>
                            <strong>Strict Geofence Lockdown:</strong> Block punch attempts made outside registered office locations
                          </span>
                        </label>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-slate-700 dark:text-slate-300">
                            Biometric Face Match Threshold
                          </label>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            {attendanceSettings.faceMatchThreshold ?? 65}% match confidence
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="90"
                          step="5"
                          value={attendanceSettings.faceMatchThreshold ?? 65}
                          onChange={(e) =>
                            setAttendanceSettings({
                              ...attendanceSettings,
                              faceMatchThreshold: Number(e.target.value),
                            })
                          }
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[11px] text-slate-400">
                          Configures the biometric similarity threshold (Recommended: 60% – 70%). Lowering prevents false rejections under uneven lighting; raising increases strictness.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2b. LOCATIONS / GEOFENCING */}
                {activeCategory === "LOCATIONS" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <MapPin className="text-indigo-600" />
                          Office Premises & Radial Geofences
                        </h2>
                        <p className="text-xs text-slate-400">
                          Register physical office locations with latitude, longitude, and radius boundaries for automated punch authorization.
                        </p>
                      </div>
                      <button
                        onClick={() => setLocModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                      >
                        <Plus size={14} />
                        <span>Add Office Location</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {locations.length === 0 ? (
                        <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
                          No geofenced office locations registered yet. Click &quot;Add Office Location&quot; to define your office premises.
                        </div>
                      ) : (
                        locations.map((loc) => (
                          <div
                            key={loc.id}
                            className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{loc.name}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${loc.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                                  {loc.isActive ? "Active Geofence" : "Inactive"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{loc.address || "Main Corporate Branch"}</p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-sans">Coordinates</span>
                                <span className="text-slate-700 dark:text-slate-300 font-semibold">{Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-sans">Allowed Radius</span>
                                <span className="text-indigo-600 font-bold">{loc.radiusMeters} meters</span>
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleDeleteLocation(loc.id)}
                                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <Trash2 size={13} />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. LEAVE SETTINGS */}
                {activeCategory === "LEAVE" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          Leave Policy & Quota Rules
                        </h2>
                        <p className="text-xs text-slate-400">
                          Accrual cycles, sandwiched holiday rules, carry-forward quotas, and encashment settings.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCategorySettings("LEAVE", leaveSettings)}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Policies"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Accruals & Limits</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Leave Accrual Frequency</label>
                          <select
                            value={leaveSettings.accrualCycle}
                            onChange={(e) => setLeaveSettings({ ...leaveSettings, accrualCycle: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          >
                            <option value="MONTHLY">Monthly Accrual (1.5 days/month)</option>
                            <option value="QUARTERLY">Quarterly Credit</option>
                            <option value="ANNUAL">Annual Advance Allocation</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Max Consecutive Leaves Allowed</label>
                          <input
                            type="number"
                            value={leaveSettings.maxConsecutiveLeaves}
                            onChange={(e) =>
                              setLeaveSettings({ ...leaveSettings, maxConsecutiveLeaves: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Year-End Carry Forward Limit (Days)</label>
                          <input
                            type="number"
                            value={leaveSettings.carryForwardLimitDays}
                            onChange={(e) =>
                              setLeaveSettings({ ...leaveSettings, carryForwardLimitDays: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Weekend & Special Rules</h4>
                        <div className="space-y-2 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={leaveSettings.sandwichRuleEnabled}
                              onChange={(e) =>
                                setLeaveSettings({ ...leaveSettings, sandwichRuleEnabled: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>
                              <strong>Sandwich Rule:</strong> Weekends between leave days count as consumed leave
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={leaveSettings.encashmentAllowed}
                              onChange={(e) =>
                                setLeaveSettings({ ...leaveSettings, encashmentAllowed: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Allow Earned Leave Encashment on Fiscal Year-End</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={leaveSettings.probationaryLeaveAllowed}
                              onChange={(e) =>
                                setLeaveSettings({ ...leaveSettings, probationaryLeaveAllowed: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Allow Paid Leaves during 3-Month Probation Period</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PAYROLL SETTINGS */}
                {activeCategory === "PAYROLL" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          Payroll Cycle & Statutory Components
                        </h2>
                        <p className="text-xs text-slate-400">
                          Disbursement dates, EPF rates, professional tax schedule, and payslip security.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCategorySettings("PAYROLL", payrollSettings)}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Payroll Rules"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-bold mb-1">Pay Cycle Day of Month</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={payrollSettings.payCycleDay}
                          onChange={(e) =>
                            setPayrollSettings({ ...payrollSettings, payCycleDay: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Default Tax Regime</label>
                        <select
                          value={payrollSettings.taxRegimeDefault}
                          onChange={(e) => setPayrollSettings({ ...payrollSettings, taxRegimeDefault: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-indigo-600"
                        >
                          <option value="NEW">New Tax Regime (Sec 115BAC)</option>
                          <option value="OLD">Old Tax Regime (with 80C/80D Exemptions)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">EPF Employee Contribution Rate (%)</label>
                        <input
                          type="number"
                          value={payrollSettings.epfEmployeeRate}
                          onChange={(e) =>
                            setPayrollSettings({ ...payrollSettings, epfEmployeeRate: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Payslip Security & Generation</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={payrollSettings.payslipPasswordProtected}
                            onChange={(e) =>
                              setPayrollSettings({ ...payrollSettings, payslipPasswordProtected: e.target.checked })
                            }
                            className="rounded text-indigo-600"
                          />
                          <span>Password protect downloaded payslips with DOB (DDMMYYYY)</span>
                        </label>
                        <div>
                          <label className="block font-bold mb-1 text-slate-500">Payslip Template Format</label>
                          <select
                            value={payrollSettings.payslipTemplate}
                            onChange={(e) =>
                              setPayrollSettings({ ...payrollSettings, payslipTemplate: e.target.value })
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl"
                          >
                            <option value="STANDARD_CORPORATE">Standard Enterprise Corporate</option>
                            <option value="COMPACT_STATEMENT">Compact Minimalist Statement</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4b. SALARY SLIP TEMPLATES */}
                {activeCategory === "SALARY_TEMPLATES" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FileText className="text-indigo-600" />
                          Salary Slip Branding & Template Builder
                        </h2>
                        <p className="text-xs text-slate-400">
                          Customize official salary slip branding, signatory credentials, visible statutory components, and footer notes.
                        </p>
                      </div>
                      <button
                        onClick={handleSaveSalaryTemplate}
                        disabled={saving || !selectedTemplate}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Template"}</span>
                      </button>
                    </div>

                    {selectedTemplate ? (
                      <div className="space-y-5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Template Title</label>
                            <input
                              type="text"
                              value={selectedTemplate.name || ""}
                              onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Company Display Name</label>
                            <input
                              type="text"
                              value={selectedTemplate.companyName || ""}
                              onChange={(e) => setSelectedTemplate({ ...selectedTemplate, companyName: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Brand Primary Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedTemplate.primaryColor || "#2563eb"}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, primaryColor: e.target.value })}
                                className="w-9 h-9 p-0.5 rounded-xl border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={selectedTemplate.primaryColor || "#2563eb"}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, primaryColor: e.target.value })}
                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Company Header Address & Registration</label>
                            <input
                              type="text"
                              value={selectedTemplate.companyAddress || ""}
                              onChange={(e) => setSelectedTemplate({ ...selectedTemplate, companyAddress: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Company Logo Image URL</label>
                            <input
                              type="text"
                              value={selectedTemplate.companyLogo || ""}
                              onChange={(e) => setSelectedTemplate({ ...selectedTemplate, companyLogo: e.target.value })}
                              placeholder="https://... or /logo.png"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Authorized Signatory Information</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-slate-500 mb-1">Signatory Title</label>
                              <input
                                type="text"
                                value={selectedTemplate.signatoryTitle || ""}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, signatoryTitle: e.target.value })}
                                placeholder="e.g. Chief Financial Officer / Head of HR"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 mb-1">Signatory Name</label>
                              <input
                                type="text"
                                value={selectedTemplate.signatoryName || selectedTemplate.authorizedSignatory || ""}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, signatoryName: e.target.value, authorizedSignatory: e.target.value })}
                                placeholder="e.g. Aditi Verma"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 mb-1">Digital Signature Image URL</label>
                              <input
                                type="text"
                                value={selectedTemplate.signatorySignUrl || selectedTemplate.signatureUrl || ""}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, signatorySignUrl: e.target.value, signatureUrl: e.target.value })}
                                placeholder="https://... or signature image"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Payslip Section Toggles</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTemplate.showBankDetails !== false}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, showBankDetails: e.target.checked })}
                                className="rounded text-indigo-600"
                              />
                              <span>Display Employee Bank Account & IFSC details</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTemplate.showTaxDetails !== false}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, showTaxDetails: e.target.checked, showPanUan: e.target.checked })}
                                className="rounded text-indigo-600"
                              />
                              <span>Display PAN & Income Tax (TDS) breakdown</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTemplate.showPFESI !== false}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, showPFESI: e.target.checked, showEmployerContributions: e.target.checked })}
                                className="rounded text-indigo-600"
                              />
                              <span>Display UAN / Provident Fund & ESI numbers & employer matches</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTemplate.showLeaveDetails !== false}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, showLeaveDetails: e.target.checked, showLeavesSummary: e.target.checked })}
                                className="rounded text-indigo-600"
                              />
                              <span>Display Working Days, Present Days, and Leave Summary strip</span>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Terms & Conditions / Policy Rules</label>
                            <textarea
                              rows={3}
                              value={selectedTemplate.termsAndConditions || ""}
                              onChange={(e) => setSelectedTemplate({ ...selectedTemplate, termsAndConditions: e.target.value })}
                              placeholder="Standard payment terms, notice on discrepancies..."
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Confidentiality Note / Footer Disclaimer</label>
                            <textarea
                              rows={3}
                              value={selectedTemplate.footerNote || selectedTemplate.footerText || ""}
                              onChange={(e) => setSelectedTemplate({ ...selectedTemplate, footerNote: e.target.value, footerText: e.target.value })}
                              placeholder="Computer-generated payslip notice..."
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Live Template Preview Card */}
                        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 shadow-sm space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b">
                            <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">Live Payslip Branding Preview</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                              {selectedTemplate.name || "Default Template"}
                            </span>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <h3 className="font-black text-sm text-slate-900 dark:text-white" style={{ color: selectedTemplate.primaryColor || "#4F46E5" }}>
                                {selectedTemplate.companyName || "Zenith Innovations Technologies Pvt Ltd"}
                              </h3>
                              <p className="text-[11px] text-slate-500">{selectedTemplate.companyAddress || "Bengaluru, Karnataka, India"}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Payslip for Month Year</span>
                              <span className="text-[10px] text-emerald-600 font-bold uppercase">PAID</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[11px] border-t pt-2">
                            <div>
                              <p className="text-slate-400">Authorized By:</p>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{selectedTemplate.signatoryName || selectedTemplate.authorizedSignatory || "Aditi Verma"}</p>
                              <p className="text-slate-500 text-[10px]">{selectedTemplate.signatoryTitle || "Head of HR"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-400">Features Active:</p>
                              <p className="text-[10px] text-slate-600 dark:text-slate-300">
                                {selectedTemplate.showBankDetails !== false ? "✓ Bank " : ""}
                                {selectedTemplate.showTaxDetails !== false ? "✓ Tax " : ""}
                                {selectedTemplate.showPFESI !== false ? "✓ PF/ESI " : ""}
                                {selectedTemplate.showLeaveDetails !== false ? "✓ Leaves" : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Loading salary slip template options...
                      </div>
                    )}
                  </div>
                )}

                {/* 4c. EMPLOYEE POLICIES */}
                {activeCategory === "EMPLOYEES" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Users className="text-indigo-600" />
                          Employee Identification & Onboarding Policies
                        </h2>
                        <p className="text-xs text-slate-400">
                          Automated employee code sequencing, probation durations, and mandatory profile fields.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCategorySettings("EMPLOYEES", employeeSettings)}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Policies"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Employee Code Sequencing</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Code Prefix</label>
                          <input
                            type="text"
                            value={employeeSettings.codePrefix || "EMP"}
                            onChange={(e) => setEmployeeSettings({ ...employeeSettings, codePrefix: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Code Padding Digits</label>
                          <input
                            type="number"
                            value={employeeSettings.codeDigits || 4}
                            onChange={(e) => setEmployeeSettings({ ...employeeSettings, codeDigits: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Probation & Notice Periods</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Default Probation Period (Months)</label>
                          <input
                            type="number"
                            value={employeeSettings.defaultProbationMonths || 3}
                            onChange={(e) => setEmployeeSettings({ ...employeeSettings, defaultProbationMonths: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Standard Notice Period (Days)</label>
                          <input
                            type="number"
                            value={employeeSettings.defaultNoticePeriodDays || 30}
                            onChange={(e) => setEmployeeSettings({ ...employeeSettings, defaultNoticePeriodDays: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4d. RECRUITMENT WORKFLOW */}
                {activeCategory === "RECRUITMENT" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Briefcase className="text-indigo-600" />
                          Hiring & Recruitment Workflow Settings
                        </h2>
                        <p className="text-xs text-slate-400">
                          Job requisition approval chains, interview rounds, and employee referral rewards.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCategorySettings("RECRUITMENT", recruitmentSettings)}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Workflow"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Requisitions & Pipeline</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Default Interview Duration (Minutes)</label>
                          <input
                            type="number"
                            value={recruitmentSettings.defaultInterviewDurationMinutes || 45}
                            onChange={(e) => setRecruitmentSettings({ ...recruitmentSettings, defaultInterviewDurationMinutes: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Employee Referral Bonus (INR)</label>
                          <input
                            type="number"
                            value={recruitmentSettings.referralBonusAmount || 10000}
                            onChange={(e) => setRecruitmentSettings({ ...recruitmentSettings, referralBonusAmount: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Automation & Alerts</h4>
                        <div className="space-y-2 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={recruitmentSettings.requireApprovalForJobPostings !== false}
                              onChange={(e) => setRecruitmentSettings({ ...recruitmentSettings, requireApprovalForJobPostings: e.target.checked })}
                              className="rounded text-indigo-600"
                            />
                            <span>Require Admin approval before publishing open job openings</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={recruitmentSettings.sendCandidateStatusEmails !== false}
                              onChange={(e) => setRecruitmentSettings({ ...recruitmentSettings, sendCandidateStatusEmails: e.target.checked })}
                              className="rounded text-indigo-600"
                            />
                            <span>Automatically send status update emails to shortlisted candidates</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4e. DOCUMENT COMPLIANCE */}
                {activeCategory === "DOCUMENTS" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FolderCheck className="text-indigo-600" />
                          Document Repository & Compliance Standards
                        </h2>
                        <p className="text-xs text-slate-400">
                          File upload limits, document expiration notices, and mandatory employee records.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCategorySettings("DOCUMENTS", documentSettings)}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Policies"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Upload Constraints</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Max Document Size (MB)</label>
                          <input
                            type="number"
                            value={documentSettings.maxFileSizeMb || 10}
                            onChange={(e) => setDocumentSettings({ ...documentSettings, maxFileSizeMb: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Expiry Notification Lead Time (Days)</label>
                          <input
                            type="number"
                            value={documentSettings.expiryReminderDaysNotice || 30}
                            onChange={(e) => setDocumentSettings({ ...documentSettings, expiryReminderDaysNotice: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Expiry Monitoring</h4>
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={documentSettings.enableExpiryReminders !== false}
                            onChange={(e) => setDocumentSettings({ ...documentSettings, enableExpiryReminders: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span>Alert HR and employee before passport/visa/compliance document expires</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. USER MANAGEMENT & RBAC MATRIX */}
                {activeCategory === "USER_MANAGEMENT" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          Role & Permission Matrix
                        </h2>
                        <p className="text-xs text-slate-400">
                          Configure granular access permissions (View, Create, Edit, Delete, Approve, Export) per module.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs"
                        >
                          <option value="ADMIN">Role: Admin</option>
                          <option value="HR">Role: HR Executive</option>
                          <option value="MANAGER">Role: Manager</option>
                          <option value="EMPLOYEE">Role: Employee (ESS)</option>
                        </select>

                        <button
                          onClick={handleSavePermissions}
                          disabled={saving}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                        >
                          <Save size={14} />
                          <span>{saving ? "Saving..." : "Save Matrix"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Permissions Matrix Table */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[11px] text-slate-500">
                              <th className="py-3 px-4">Module</th>
                              <th className="py-3 px-3 text-center">View</th>
                              <th className="py-3 px-3 text-center">Create</th>
                              <th className="py-3 px-3 text-center">Edit</th>
                              <th className="py-3 px-3 text-center">Delete</th>
                              <th className="py-3 px-3 text-center">Approve</th>
                              <th className="py-3 px-3 text-center">Export</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {modulesList.map((mod) => {
                              const perm = permissions.find(
                                (p) => p.role === selectedRole && p.module === mod
                              ) || {
                                role: selectedRole,
                                module: mod,
                                canView: selectedRole === "ADMIN",
                                canCreate: selectedRole === "ADMIN",
                                canEdit: selectedRole === "ADMIN",
                                canDelete: selectedRole === "ADMIN",
                                canApprove: selectedRole === "ADMIN",
                                canExport: selectedRole === "ADMIN",
                              };

                              return (
                                <tr key={mod} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                    {mod}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.canView}
                                      onChange={() => handleTogglePermission(mod, "canView")}
                                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.canCreate}
                                      onChange={() => handleTogglePermission(mod, "canCreate")}
                                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.canEdit}
                                      onChange={() => handleTogglePermission(mod, "canEdit")}
                                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.canDelete}
                                      onChange={() => handleTogglePermission(mod, "canDelete")}
                                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.canApprove}
                                      onChange={() => handleTogglePermission(mod, "canApprove")}
                                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.canExport}
                                      onChange={() => handleTogglePermission(mod, "canExport")}
                                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. NOTIFICATIONS SETTINGS */}
                {activeCategory === "NOTIFICATIONS" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          Notification & Alert Preferences
                        </h2>
                        <p className="text-xs text-slate-400">
                          Email notifications, in-app bells, and push alert triggers across workflow events.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCategorySettings("NOTIFICATIONS", notificationSettings)}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Preferences"}</span>
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Delivery Channels</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.emailNotifications}
                              onChange={(e) =>
                                setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Email Notifications (SMTP)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.inAppNotifications}
                              onChange={(e) =>
                                setNotificationSettings({ ...notificationSettings, inAppNotifications: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>In-App Notification Drawer</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.pushNotifications}
                              onChange={(e) =>
                                setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Mobile Push Alerts (FCM)</span>
                          </label>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Trigger Events</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.leaveStatusAlerts}
                              onChange={(e) =>
                                setNotificationSettings({ ...notificationSettings, leaveStatusAlerts: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Leave application submission, approval and rejection</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.attendanceRegularizationAlerts}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  attendanceRegularizationAlerts: e.target.checked,
                                })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Attendance regularization requests</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.payrollReleaseAlerts}
                              onChange={(e) =>
                                setNotificationSettings({ ...notificationSettings, payrollReleaseAlerts: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Monthly payslip generation and release</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings.companyBulletinAlerts}
                              onChange={(e) =>
                                setNotificationSettings({ ...notificationSettings, companyBulletinAlerts: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>New company announcements and policy updates</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. SECURITY SETTINGS */}
                {activeCategory === "SECURITY" && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          Security, Password Policy & Audit
                        </h2>
                        <p className="text-xs text-slate-400">
                          Password complexity standards, session expiry, 2FA requirements, and activity trails.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCategorySettings("SECURITY", securitySettings)}
                        disabled={saving}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        <span>{saving ? "Saving..." : "Save Policy"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Password Standards</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Minimum Password Length</label>
                          <input
                            type="number"
                            min="6"
                            max="32"
                            value={securitySettings.passwordMinLength}
                            onChange={(e) =>
                              setSecuritySettings({ ...securitySettings, passwordMinLength: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div className="space-y-2 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={securitySettings.requireUppercase}
                              onChange={(e) =>
                                setSecuritySettings({ ...securitySettings, requireUppercase: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Require uppercase letter (A-Z)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={securitySettings.requireNumber}
                              onChange={(e) =>
                                setSecuritySettings({ ...securitySettings, requireNumber: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Require numeric digit (0-9)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={securitySettings.requireSpecialChar}
                              onChange={(e) =>
                                setSecuritySettings({ ...securitySettings, requireSpecialChar: e.target.checked })
                              }
                              className="rounded text-indigo-600"
                            />
                            <span>Require special character (@, #, $, etc.)</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Session & Lockout</h4>
                        <div>
                          <label className="block text-slate-500 mb-1">Session Inactivity Timeout (Minutes)</label>
                          <input
                            type="number"
                            value={securitySettings.sessionTimeoutMins}
                            onChange={(e) =>
                              setSecuritySettings({ ...securitySettings, sessionTimeoutMins: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Max Failed Login Attempts Before Lockout</label>
                          <input
                            type="number"
                            value={securitySettings.maxLoginAttempts}
                            onChange={(e) =>
                              setSecuritySettings({ ...securitySettings, maxLoginAttempts: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Lockout Duration (Minutes)</label>
                          <input
                            type="number"
                            value={securitySettings.lockoutDurationMins}
                            onChange={(e) =>
                              setSecuritySettings({ ...securitySettings, lockoutDurationMins: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Audit Trail Section */}
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <History size={14} />
                        <span>System Audit Logs (Recent 15 Events)</span>
                      </h4>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase text-slate-500 font-bold sticky top-0">
                            <tr>
                              <th className="py-2 px-3">Timestamp</th>
                              <th className="py-2 px-3">Actor</th>
                              <th className="py-2 px-3">Action</th>
                              <th className="py-2 px-3">Entity</th>
                              <th className="py-2 px-3">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                            {auditLogs.slice(0, 15).map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">
                                  {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="py-2 px-3 font-semibold">{log.userName || "System"}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px] font-bold">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-500">{log.entity}</td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                                  {log.details}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. OTHER / INTEGRATION */}
                {activeCategory === "OTHER" && (
                  <div className="space-y-6 text-xs">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Integrations, Webhooks & Module Configuration
                      </h2>
                      <p className="text-xs text-slate-400">
                        Connect HRMS with biometric hardware, cloud storage, banking APIs, and accounting software.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Biometric Device Bridge</h4>
                        <p className="text-slate-400 text-[11px]">
                          Connect ZKTeco, Matrix, or eSSL biometric machines over TCP/IP daemon bridge.
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Active Bridge
                          </span>
                          <button className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-semibold">
                            Configure Port
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Corporate Bank NEFT/RTGS Gateway</h4>
                        <p className="text-slate-400 text-[11px]">
                          Direct payout batch transmission to ICICI CIB, HDFC Enet, and SBI Corporate.
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-indigo-600 font-bold">Enabled for Payroll</span>
                          <button className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-semibold">
                            Manage Credentials
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Location Modal */}
        {locModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Add Office Geofence Location
                  </h3>
                </div>
                <button onClick={() => setLocModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateLocation} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Premises Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="e.g. Mumbai Corporate Branch"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                    placeholder="e.g. Bandra Kurla Complex, Bandra East"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newLocLat}
                      onChange={(e) => setNewLocLat(e.target.value)}
                      placeholder="12.9716"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newLocLng}
                      onChange={(e) => setNewLocLng(e.target.value)}
                      placeholder="77.5946"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && "geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setNewLocLat(pos.coords.latitude.toFixed(6));
                            setNewLocLng(pos.coords.longitude.toFixed(6));
                            toast.success("Coordinates Detected", "Using your current device GPS position.");
                          },
                          (err) => toast.error("GPS Error", err.message),
                          { enableHighAccuracy: true }
                        );
                      }
                    }}
                    className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200"
                  >
                    <Navigation size={13} />
                    <span>Detect My Current GPS Location</span>
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Allowed Geofence Radius (Meters)
                  </label>
                  <input
                    type="number"
                    value={newLocRadius}
                    onChange={(e) => setNewLocRadius(Number(e.target.value))}
                    min="50"
                    max="5000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Employees within this radius will be marked as &quot;In Geofence&quot;.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLocModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingLoc}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>{creatingLoc ? "Saving..." : "Add Office Location"}</span>
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

export default function SettingsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <SettingsContent />
    </React.Suspense>
  );
}
