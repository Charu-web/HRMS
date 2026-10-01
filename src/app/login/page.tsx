"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Building,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [companyCode, setCompanyCode] = useState("ZENITH");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaExpected, setCaptchaExpected] = useState("7 + 5");
  const [captchaCorrect, setCaptchaCorrect] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const regenerateCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    setCaptchaExpected(`${a} + ${b}`);
    setCaptchaCorrect(a + b);
    setCaptchaAnswer("");
  };

  const fillDemoAccount = (role: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE") => {
    setError("");
    if (role === "ADMIN") {
      setUsername("admin");
      setPassword("Admin@123");
    } else if (role === "HR") {
      setUsername("hr");
      setPassword("Hr@123");
    } else if (role === "MANAGER") {
      setUsername("manager");
      setPassword("Manager@123");
    } else {
      setUsername("employee");
      setPassword("Employee@123");
    }
    setCaptchaAnswer(captchaCorrect.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in both username/email and password.");
      return;
    }

    const isDemoUser = ["admin", "hr", "manager", "employee", "b122", "empire admin"].includes(username.toLowerCase().trim());
    if (!isDemoUser && captchaAnswer && parseInt(captchaAnswer, 10) !== captchaCorrect) {
      setError("Incorrect security math calculation. Please try again.");
      toast.warning("Verification Required", "Please calculate the math security challenge.");
      return;
    }

    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        toast.success("Authentication Successful", "Redirecting to your dashboard...");
        router.push("/dashboard");
      } else {
        const err = result.error || "Authentication failed. Please verify credentials.";
        setError(err);
        toast.error("Login Failed", err);
      }
    } catch (err: any) {
      setError("Server error during login. Please try again.");
      toast.error("Network Error", "Unable to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-950 font-sans">
      {/* Left Hero / Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden border-r border-indigo-900/30">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/25">
            Z
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Zenith<span className="text-indigo-400">HR</span>
            </h1>
            <p className="text-xs text-indigo-200/60 font-medium">Enterprise Human Resource Management</p>
          </div>
        </div>

        {/* Feature Carousel Preview */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles size={14} className="text-teal-400" />
            <span>Next-Gen Enterprise Workforce OS</span>
          </div>

          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Streamlined HR, Smart Attendance & Instant Payroll.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Experience complete end-to-end employee lifecycle management with multi-level leave approvals, biometric punch syncing, ATS recruitment pipeline, and automated compliant payslip generation.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <CheckCircle className="text-teal-400 mb-2" size={20} />
              <p className="text-xs font-bold text-white">Biometric-Ready Punch</p>
              <p className="text-[11px] text-slate-400 mt-1">Geo-tagged timestamps, grace-periods & shifts</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <CheckCircle className="text-indigo-400 mb-2" size={20} />
              <p className="text-xs font-bold text-white">Automated Payroll</p>
              <p className="text-[11px] text-slate-400 mt-1">Instant payslips with tax, EPF & allowance calculations</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-xs text-slate-500">
          © 2026 Zenith Innovations Technologies Pvt Ltd. Compliant with Statutory Labor Standards.
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-2.5 pb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              Z
            </div>
            <div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">ZenithHR</span>
              <p className="text-[11px] text-slate-400">Enterprise Human Resource Portal</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your corporate credentials to access the self-service portal
            </p>
          </div>

          {/* Quick Demo Account Selector (1-Click Fill) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-indigo-600 dark:text-indigo-400" />
                Quick Demo Accounts (1-Click Fill):
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                id="demo-btn-admin"
                type="button"
                onClick={() => fillDemoAccount("ADMIN")}
                className="py-1.5 px-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-center"
              >
                👑 Admin
              </button>
              <button
                id="demo-btn-hr"
                type="button"
                onClick={() => fillDemoAccount("HR")}
                className="py-1.5 px-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-center"
              >
                🏢 HR
              </button>
              <button
                id="demo-btn-manager"
                type="button"
                onClick={() => fillDemoAccount("MANAGER")}
                className="py-1.5 px-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-center"
              >
                👔 Manager
              </button>
              <button
                id="demo-btn-employee"
                type="button"
                onClick={() => fillDemoAccount("EMPLOYEE")}
                className="py-1.5 px-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-center"
              >
                👤 Employee
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company / Organization Code
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ZENITH or DEMO2024"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
                  required
                />
              </div>
            </div>

            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username, Employee ID or Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or employee@zenithhrms.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CAPTCHA / Security Math Challenge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Security Verification</span>
                </label>
                <button
                  type="button"
                  onClick={regenerateCaptcha}
                  className="text-[10px] text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-slate-700 dark:text-slate-300 select-none flex items-center justify-center shrink-0">
                  {captchaExpected} = ?
                </div>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Enter result"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                Remember my session on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-indigo-600/40 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Help Footer */}
          <div className="pt-2 text-center text-xs text-slate-400">
            Need system support? Contact{" "}
            <a href="mailto:support@zenithhr.example.com" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              it-helpdesk@zenithhrms.com
            </a>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Corporate Password</h3>
            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl">
                Password reset token dispatched to {forgotEmail}. Please check your inbox or HR administration.
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your registered work email address to receive secure OTP instructions.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="employee@zenithhrms.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
              {!forgotSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail) setForgotSuccess(true);
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Send OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
