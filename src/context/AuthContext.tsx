"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface UserEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  profilePhoto?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  joiningDate?: string | null;
  status: string;
  departmentId?: string | null;
  designationId?: string | null;
  branchId?: string | null;
  shiftId?: string | null;
  department?: { id: string; name: string; code: string } | null;
  designation?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; city: string } | null;
  shift?: { id: string; name: string; startTime: string; endTime: string } | null;
  manager?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
  employee?: UserEmployee | null;
  unreadNotifications?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchDemoRole: (role: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Network error during login" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const switchDemoRole = async (role: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE") => {
    setLoading(true);
    let username = "admin";
    let password = "Admin@123";
    if (role === "HR") {
      username = "hr";
      password = "Hr@123";
    } else if (role === "MANAGER") {
      username = "manager";
      password = "Manager@123";
    } else if (role === "EMPLOYEE") {
      username = "employee";
      password = "Employee@123";
    }

    const res = await login(username, password);
    setLoading(false);
    if (res.success) {
      router.push("/dashboard");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: fetchCurrentUser,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
