"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Target,
  Award,
  Star,
  CheckCircle,
  Plus,
  X,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function PerformancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cycles, setCycles] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Goal Modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalWeightage, setGoalWeightage] = useState("30");
  const [goalCategory, setGoalCategory] = useState("TECHNICAL");
  const [submitting, setSubmitting] = useState(false);

  // Progress update state
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  const [sliderProgress, setSliderProgress] = useState(0);

  // Review Submission Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewEmpId, setReviewEmpId] = useState("");
  const [reviewRating, setReviewRating] = useState("4.5");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/performance");
      if (res.ok) {
        const data = await res.json();
        setCycles(data.cycles || []);
        setGoals(data.goals || []);
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const d = await res.json();
        setEmployeesList(d.employees || []);
        if (d.employees?.length > 0 && !reviewEmpId) {
          setReviewEmpId(d.employees[0].id);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchPerformance();
    fetchEmployees();
  }, [user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      const isManager = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.role === "HR";
      const payload: any = {
        employeeId: isManager && reviewEmpId ? reviewEmpId : (user?.employee?.id || ""),
      };
      if (isManager) {
        payload.managerRating = parseFloat(reviewRating);
        payload.managerFeedback = reviewFeedback;
      } else {
        payload.selfRating = parseFloat(reviewRating);
        payload.selfFeedback = reviewFeedback;
      }

      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success("Review Submitted", "Performance evaluation record saved.");
        setReviewModalOpen(false);
        setReviewFeedback("");
        fetchPerformance();
      } else {
        toast.error("Submission Failed", d.error || "Failed to submit review.");
      }
    } catch {
      toast.error("Network Error", "Unable to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/performance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalTitle,
          description: goalDesc,
          weightage: goalWeightage,
          category: goalCategory,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Goal Registered", "New OKR milestone added to your review cycle.");
        setGoalModalOpen(false);
        setGoalTitle("");
        setGoalDesc("");
        fetchPerformance();
      } else {
        toast.error("Creation Failed", data.error || "Failed to create performance goal.");
      }
    } catch (err) {
      toast.error("Network Error", "Unable to create goal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (id: string, progress: number) => {
    try {
      const res = await fetch("/api/performance/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, progress }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Progress Updated", `Goal target completion updated to ${progress}%.`);
        setUpdatingGoalId(null);
        fetchPerformance();
      } else {
        toast.error("Update Failed", data.error || "Could not update progress.");
      }
    } catch (e) {
      toast.error("Network Error", "Unable to update goal progress.");
    }
  };

  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
      : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Target className="text-indigo-600 dark:text-indigo-400" />
              Performance & OKRs
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Track strategic objectives, key results, self-appraisals, and 360-degree manager evaluations.
            </p>
          </div>

          <button
            onClick={() => setGoalModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create Goal / KPI</span>
          </button>
        </div>

        {/* Cycle Banner */}
        {cycles.length > 0 && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                Active Appraisal Cycle
              </span>
              <h2 className="text-xl font-black">{cycles[0].title}</h2>
              <p className="text-xs text-indigo-200">
                Evaluation Window: {new Date(cycles[0].startDate).toLocaleDateString()} -{" "}
                {new Date(cycles[0].endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-2xl font-black text-teal-400">{avgProgress}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Goal Completion</span>
              </div>
              <div>
                <span className="text-2xl font-black text-indigo-400">{goals.length}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Goals</span>
              </div>
              <div>
                <span className="text-2xl font-black text-amber-400">{reviews.length}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Reviews Filed</span>
              </div>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Goals & KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      Weight: {g.weightage}%
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        g.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{g.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{g.description}</p>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{g.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>

                  {/* Progress slider toggle */}
                  {updatingGoalId === g.id ? (
                    <div className="pt-2 space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={sliderProgress}
                        onChange={(e) => setSliderProgress(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setUpdatingGoalId(null)}
                          className="px-2 py-1 text-[11px] text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateProgress(g.id, sliderProgress)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                        >
                          Save {sliderProgress}%
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setUpdatingGoalId(g.id);
                        setSliderProgress(g.progress);
                      }}
                      className="w-full py-1 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Update Progress Slider
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Performance Reviews & Evaluations</h3>
            <button
              onClick={() => setReviewModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Award size={14} />
              <span>Submit Evaluation</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {rev.employee.firstName} {rev.employee.lastName}
                    </h4>
                    <p className="text-xs text-slate-400">{rev.cycle.title}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-3 py-1 rounded-xl">
                    <Star size={14} fill="currentColor" />
                    <span className="font-black text-sm">{rev.finalRating || "4.8"} / 5.0</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Self-Assessment</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 italic">
                      "{rev.selfFeedback || "Achieved deliverables and optimized sprint workflows."}"
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      Manager Feedback ({rev.reviewer ? `${rev.reviewer.firstName} ${rev.reviewer.lastName}` : "Reviewer"})
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 italic">
                      "{rev.managerFeedback || "Consistently exceeds performance expectations and mentors team."}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Goal Modal */}
        {goalModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Performance Goal</h3>
                <button onClick={() => setGoalModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Goal Objective Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Lead Kubernetes Cluster Zero-Downtime Migration"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Weightage (%)</label>
                    <input
                      type="number"
                      value={goalWeightage}
                      onChange={(e) => setGoalWeightage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Category</label>
                    <select
                      value={goalCategory}
                      onChange={(e) => setGoalCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      <option value="TECHNICAL">Technical Excellence</option>
                      <option value="LEADERSHIP">Leadership & Mentorship</option>
                      <option value="BUSINESS">Business Impact & OKRs</option>
                      <option value="QUALITY">Quality & Compliance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Measurable Key Results (Description)</label>
                  <textarea
                    rows={3}
                    value={goalDesc}
                    onChange={(e) => setGoalDesc(e.target.value)}
                    placeholder="Specific milestones, metrics, and deliverable targets..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGoalModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    {submitting ? "Saving..." : "Save Goal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submit Review Modal */}
        {reviewModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Submit Performance Evaluation</h3>
                <button onClick={() => setReviewModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
                {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.role === "HR") && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Employee *
                    </label>
                    <select
                      value={reviewEmpId}
                      onChange={(e) => setReviewEmpId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      {employeesList.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rating Score (1.0 to 5.0) *
                  </label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="5.0">5.0 — Outstanding / Role Model</option>
                    <option value="4.5">4.5 — Exceeds Expectations</option>
                    <option value="4.0">4.0 — Fully Meets Standards</option>
                    <option value="3.5">3.5 — Satisfactory / Good</option>
                    <option value="3.0">3.0 — Needs Minor Development</option>
                    <option value="2.0">2.0 — Needs Significant Improvement</option>
                    <option value="1.0">1.0 — Unsatisfactory</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Evaluation Notes & Qualitative Feedback *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Describe strengths, project accomplishments, leadership traits, and growth areas..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
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
