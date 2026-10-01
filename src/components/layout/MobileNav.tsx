"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarRange,
  WalletCards,
  User,
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const profileHref = user?.employee ? `/employees/${user.employee.id}` : "/settings";

  const navItems = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Attendance", href: "/attendance", icon: CalendarCheck },
    { label: "Leave", href: "/leaves", icon: CalendarRange },
    { label: "Payslip", href: "/payroll", icon: WalletCards },
    { label: "Profile", href: profileHref, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            <Icon size={20} className={isActive ? "scale-110 transition-transform" : ""} />
            <span className="text-[10px] mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
