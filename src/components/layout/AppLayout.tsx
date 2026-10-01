"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarRange,
  WalletCards,
  Receipt,
  Briefcase,
  Target,
  FileText,
  Megaphone,
  BarChart3,
  Settings,
  X,
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-600/30 animate-bounce">
          Z
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wider uppercase animate-pulse">
          Loading ZenithHR...
        </p>
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  const role = user?.role || "EMPLOYEE";
  const mobileNavItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Approvals", href: "/approvals", icon: CalendarRange },
    { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    { name: "Organization", href: "/organization", icon: Building2 },
    { name: "Product Updates", href: "/product-updates", icon: Megaphone },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "ADMIN"] },
    { name: "Employees", href: "/employees", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    { name: "Attendance", href: "/attendance", icon: CalendarCheck },
    { name: "Leave Management", href: "/leaves", icon: CalendarRange },
    { name: "Payroll", href: "/payroll", icon: WalletCards },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Recruitment (ATS)", href: "/recruitment", icon: Briefcase, roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    { name: "Performance", href: "/performance", icon: Target },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Announcements", href: "/announcements", icon: Megaphone },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
  ].filter((item) => !item.roles || item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-slate-900 z-50 p-4 transform transition-transform duration-300 md:hidden shadow-2xl flex flex-col ${
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              Z
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white">ZenithHR</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMobileMenuToggle={() => setMobileDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
