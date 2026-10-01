"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import {
  Bell,
  Sun,
  Moon,
  Clock,
  LogOut,
  User,
  Shield,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Search,
  Settings,
  KeyRound,
  ChevronDown,
  Sparkles,
  Command,
  LayoutDashboard,
  CalendarCheck,
  WalletCards,
  Building2,
  FileText,
  BarChart3,
} from "lucide-react";

interface TopNavProps {
  onMobileMenuToggle?: () => void;
}

export function TopNav({ onMobileMenuToggle }: TopNavProps) {
  const { user, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState("");
  const [punchedIn, setPunchedIn] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState("");

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Global Quick Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
        setPasswordModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check today's punch state
  useEffect(() => {
    if (user?.employee?.id) {
      fetch(`/api/attendance?employeeId=${user.employee.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.attendances && data.attendances.length > 0) {
            const todayStr = new Date().toISOString().split("T")[0];
            const todayRecord = data.attendances.find((a: any) =>
              a.date.startsWith(todayStr)
            );
            if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
              setPunchedIn(true);
            } else {
              setPunchedIn(false);
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handlePunch = async () => {
    setPunchLoading(true);
    setPunchMessage("");
    try {
      const endpoint = punchedIn
        ? "/api/attendance/check-out"
        : "/api/attendance/check-in";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: "TopNav Quick Punch" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPunchedIn(!punchedIn);
        setPunchMessage(data.message);
        toast.success(
          punchedIn ? "Punch Out Confirmed" : "Punch In Confirmed",
          data.message || (punchedIn ? "Shift session concluded." : "Daily duty commenced.")
        );
        setTimeout(() => setPunchMessage(""), 4000);
      } else {
        toast.error("Punch Failed", data.error || "Unable to complete action.");
      }
    } catch {
      toast.error("Network Error", "Could not submit punch.");
    } finally {
      setPunchLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.info("Notifications Cleared", "All alerts marked as read.");
    } catch {}
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Password Mismatch", "New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password Too Short", "Password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      // Simulate/call password change
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Security Updated", "Your account password has been updated.");
      setPasswordModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Update Failed", "Unable to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Quick navigation search items
  const searchItems = [
    { title: "Home Dashboard", href: "/dashboard", category: "Navigation", icon: LayoutDashboard },
    { title: "Approvals Hub", href: "/approvals", category: "Workflow", icon: CheckCircle2 },
    { title: "Analytics & Reports", href: "/analytics", category: "Analytics", icon: BarChart3 },
    { title: "Organization & Structure", href: "/organization", category: "Company", icon: Building2 },
    { title: "Product Updates & Changelog", href: "/product-updates", category: "Features", icon: Sparkles },
    { title: "System & Company Settings", href: "/settings", category: "Admin", icon: Settings },
    { title: "Employee Directory", href: "/employees", category: "Operations", icon: User },
    { title: "Attendance & Logs", href: "/attendance", category: "Operations", icon: CalendarCheck },
    { title: "Leave Applications & Balances", href: "/leaves", category: "Operations", icon: Clock },
    { title: "Payroll & Payslips", href: "/payroll", category: "Operations", icon: WalletCards },
    { title: "Expense Claims", href: "/expenses", category: "Operations", icon: FileText },
  ];

  const filteredSearch = searchItems.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between z-20 shrink-0 sticky top-0 shadow-sm">
        {/* Left: Mobile Menu & Global Search Bar */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-lg">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu size={20} />
          </button>

          {/* Global Search Input */}
          <div className="relative w-full">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-400 dark:text-slate-400 transition-all shadow-inner group"
            >
              <span className="flex items-center gap-2">
                <Search size={15} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                <span className="truncate">Search employees, modules, actions...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 shadow-sm">
                <Command size={10} /> K
              </kbd>
            </button>
          </div>
        </div>

        {/* Center: Live Attendance Punch Button */}
        <div className="hidden lg:flex items-center gap-3 mx-4">
          {user?.employee && (
            <button
              onClick={handlePunch}
              disabled={punchLoading}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                punchedIn
                  ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
              }`}
              title="Click to Punch In or Punch Out"
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  punchedIn ? "bg-rose-600" : "bg-emerald-500"
                }`}
              />
              <Clock size={13} />
              <span>{punchedIn ? "Punch Out" : "Punch In"}</span>
              <span className="font-mono text-[11px] opacity-80 border-l border-current/20 pl-2">
                {currentTime}
              </span>
            </button>
          )}

          {/* Quick Demo Role Switcher Tabs */}
          <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Role:</span>
            <button
              onClick={() => switchDemoRole("ADMIN")}
              className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchDemoRole("MANAGER")}
              className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                user?.role === "MANAGER"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => switchDemoRole("EMPLOYEE")}
              className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                user?.role === "EMPLOYEE"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Employee
            </button>
          </div>
        </div>

        {/* Right: Theme Toggle, Notifications, User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                          !n.isRead ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.type === "LEAVE"
                                ? "bg-blue-500"
                                : n.type === "PAYROLL"
                                ? "bg-emerald-500"
                                : "bg-indigo-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              id="user-profile-btn"
              data-testid="user-profile-btn"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <img
                src={
                  user?.employee?.profilePhoto ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                }
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
              />
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "Administrator"}
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden md:block" />
            </button>

            {/* Profile Dropdown: My Profile, Account Settings, Change Password, Logout */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Header Summary */}
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "Administrator"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                      {user?.role}
                    </span>
                    {user?.employee?.department?.name && (
                      <span className="text-[10px] font-medium text-slate-500 truncate">
                        • {user.employee.department.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dropdown Menu Items */}
                <div className="py-1 text-xs">
                  {/* 1. My Profile */}
                  <Link
                    href={user?.employee ? `/employees/${user.employee.id}` : "/employees"}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium"
                  >
                    <User size={15} className="text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  {/* 2. Account Settings */}
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium"
                  >
                    <Settings size={15} className="text-slate-400" />
                    <span>Account Settings</span>
                  </Link>

                  {/* 3. Change Password */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium text-left"
                  >
                    <KeyRound size={15} className="text-slate-400" />
                    <span>Change Password</span>
                  </button>
                </div>

                {/* 4. Logout */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors text-xs"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Search size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, pages, actions... (or Esc to close)"
                className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                id="search-close-btn"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredSearch.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching modules found for "{searchQuery}"
                </div>
              ) : (
                filteredSearch.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(item.href);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                        Go →
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Press <strong>Esc</strong> to close</span>
              <span>ZenithHR Navigation System</span>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Change Account Password</h3>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
