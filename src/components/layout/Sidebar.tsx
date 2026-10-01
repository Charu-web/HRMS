"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  CheckCircle2,
  BarChart3,
  Building2,
  Sparkles,
  Settings,
  Users,
  CalendarCheck,
  CalendarRange,
  WalletCards,
  Receipt,
  Briefcase,
  Target,
  FileText,
  Megaphone,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
  badge?: string;
  subItems?: { name: string; href: string }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || "EMPLOYEE";

  // Exact required primary navigation order: Home, Approvals, Analytics, Organization, Product Updates, Settings
  const primaryNavItems: NavItem[] = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Approvals", href: "/approvals", icon: CheckCircle2 },
    { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    { name: "Organization", href: "/organization", icon: Building2 },
    { name: "Product Updates", href: "/product-updates", icon: Sparkles },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN"] },
  ];

  // Distinct Core Operations with structured sub-modules
  const operationsNavItems: NavItem[] = [
    { name: "Employees", href: "/employees", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    {
      name: "Attendance",
      href: "/attendance",
      icon: CalendarCheck,
      subItems: [
        { name: "Daily Attendance", href: "/attendance" },
        { name: "Face Attendance", href: "/attendance/face" },
        { name: "Geolocation & Geofence", href: "/attendance/geofence" },
      ],
    },
    { name: "Leave Management", href: "/leaves", icon: CalendarRange },
    {
      name: "Payroll",
      href: "/payroll",
      icon: WalletCards,
      subItems: [
        { name: "Payroll Runs", href: "/payroll" },
        { name: "Salary Structures", href: "/payroll/salary-structures" },
        { name: "Salary Slips", href: "/payroll/salary-slips" },
      ],
    },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Recruitment (ATS)", href: "/recruitment", icon: Briefcase, roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    { name: "Performance", href: "/performance", icon: Target },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Announcements", href: "/announcements", icon: Megaphone },
    { name: "Reports", href: "/reports", icon: PieChart, roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
  ];

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => !item.roles || item.roles.includes(role));

  const visiblePrimary = filterByRole(primaryNavItems);
  const visibleOperations = filterByRole(operationsNavItems);

  return (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-30 select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20 shrink-0">
            Z
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-black text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Zenith<span className="text-indigo-600 dark:text-indigo-400">HR</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Enterprise Suite</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Role Pill Banner */}
      {!collapsed && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                role === "ADMIN" || role === "SUPER_ADMIN"
                  ? "bg-purple-500"
                  : role === "MANAGER"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Role: <span className="uppercase text-indigo-600 dark:text-indigo-400 font-bold">{role.replace("_", " ")}</span>
            </span>
          </div>
          {(role === "ADMIN" || role === "SUPER_ADMIN") && (
            <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
              ENTERPRISE
            </span>
          )}
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-thin">
        {/* Primary Navigation */}
        <div className="space-y-1">
          {visiblePrimary.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all group relative ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon
                  size={19}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Distinct Core HRMS Operations (zero duplicates) */}
        {visibleOperations.length > 0 && (
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Operations
              </p>
            )}
            {visibleOperations.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <div key={item.name} className="space-y-0.5">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs transition-all group relative ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={`shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-indigo-600"
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </Link>

                  {/* Sub-items for Attendance and Payroll */}
                  {!collapsed && item.subItems && isActive && (
                    <div className="pl-7 pr-1 py-1 space-y-0.5 border-l-2 border-indigo-100 dark:border-indigo-900/50 ml-4 my-1">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`block py-1 px-2.5 rounded-lg text-[11px] transition-all ${
                              isSubActive
                                ? "bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <Link
          href={user?.employee ? `/employees/${user.employee.id}` : "/settings"}
          className={`flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <img
            src={
              user?.employee?.profilePhoto ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
            }
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover border border-indigo-200 dark:border-indigo-900 shrink-0 shadow-sm"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "Administrator"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.employee?.department?.name || user?.email}
              </p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
