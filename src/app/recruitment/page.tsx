"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Briefcase,
  UserPlus,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Plus,
  X,
  ChevronRight,
  Filter,
  ArrowRight,
  Video,
} from "lucide-react";

export default function RecruitmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [kanban, setKanban] = useState<Record<string, any[]>>({});
  const [selectedJob, setSelectedJob] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // New Job Modal
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDept, setJobDept] = useState("");
  const [jobOpenings, setJobOpenings] = useState("2");
  const [jobDesc, setJobDesc] = useState("");
  const [jobSubmitting, setJobSubmitting] = useState(false);

  // Candidate Stage Move Modal / Quick Action
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<any>(null);
  const [newStage, setNewStage] = useState("SCREENING");
  const [stageNotes, setStageNotes] = useState("");

  // Add Candidate Modal
  const [addCandModalOpen, setAddCandModalOpen] = useState(false);
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candPhone, setCandPhone] = useState("");
  const [candJobId, setCandJobId] = useState("");
  const [candCompany, setCandCompany] = useState("");
  const [candCtc, setCandCtc] = useState("");
  const [candExpCtc, setCandExpCtc] = useState("");
  const [candNotice, setCandNotice] = useState("30");
  const [candSubmitting, setCandSubmitting] = useState(false);

  // Schedule Interview Modal
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [intRound, setIntRound] = useState("Technical Round 1");
  const [intDate, setIntDate] = useState(new Date().toISOString().split("T")[0]);
  const [intTime, setIntTime] = useState("14:30");
  const [intInterviewer, setIntInterviewer] = useState("Priya Nair (Engineering Manager)");

  const fetchRecruitmentData = async () => {
    try {
      setLoading(true);
      const [jobsRes, candRes, orgRes] = await Promise.all([
        fetch("/api/recruitment/jobs"),
        fetch(`/api/recruitment/candidates${selectedJob !== "ALL" ? `?jobOpeningId=${selectedJob}` : ""}`),
        fetch("/api/organization"),
      ]);

      if (jobsRes.ok) {
        const d = await jobsRes.json();
        setJobs(d.jobs || []);
      }
      if (candRes.ok) {
        const d = await candRes.json();
        setKanban(d.kanban || {});
      }
      if (orgRes.ok) {
        const d = await orgRes.json();
        setDepartments(d.departments || []);
        if (d.departments?.length > 0 && !jobDept) {
          setJobDept(d.departments[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitmentData();
  }, [selectedJob]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobSubmitting(true);
    try {
      const res = await fetch("/api/recruitment/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle,
          departmentId: jobDept,
          openingsCount: jobOpenings,
          description: jobDesc,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Job Opening Created", `Requisition for "${jobTitle}" has been opened.`);
        setJobModalOpen(false);
        setJobTitle("");
        setJobDesc("");
        fetchRecruitmentData();
      } else {
        toast.error("Creation Failed", data.error || "Failed to create job opening.");
      }
    } catch (e) {
      toast.error("Network Error", "Unable to create job requisition.");
    } finally {
      setJobSubmitting(false);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName || !candEmail) {
      toast.error("Required Fields", "Candidate name and email are mandatory.");
      return;
    }
    const targetJobId = candJobId || (jobs.length > 0 ? jobs[0].id : "");
    if (!targetJobId) {
      toast.error("Job Required", "Please select a job requisition for this candidate.");
      return;
    }
    setCandSubmitting(true);
    try {
      const res = await fetch("/api/recruitment/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobOpeningId: targetJobId,
          fullName: candName,
          email: candEmail,
          phone: candPhone || undefined,
          currentCompany: candCompany || undefined,
          currentCtc: candCtc ? Number(candCtc) : undefined,
          expectedCtc: candExpCtc ? Number(candExpCtc) : undefined,
          noticePeriodDays: candNotice ? Number(candNotice) : 30,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Candidate Registered", `Application for ${candName} added to the pipeline.`);
        setAddCandModalOpen(false);
        setCandName("");
        setCandEmail("");
        setCandPhone("");
        setCandCompany("");
        setCandCtc("");
        setCandExpCtc("");
        fetchRecruitmentData();
      } else {
        toast.error("Registration Failed", data.error || "Could not add candidate.");
      }
    } catch {
      toast.error("Network Error", "Unable to register candidate application.");
    } finally {
      setCandSubmitting(false);
    }
  };

  const handleUpdateStage = async (candidateId: string, targetStage: string) => {
    try {
      const res = await fetch(`/api/recruitment/candidates/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStage,
          stageNotes: stageNotes || `Moved to ${targetStage}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Stage Updated", `Candidate advanced to ${targetStage} stage.`);
        setCandidateModalOpen(false);
        setActiveCandidate(null);
        fetchRecruitmentData();
      } else {
        toast.error("Update Failed", data.error || "Could not move candidate stage.");
      }
    } catch (e) {
      toast.error("Network Error", "Unable to update candidate stage.");
    }
  };

  const STAGES = [
    { key: "APPLIED", label: "Applied", color: "border-slate-300 dark:border-slate-700" },
    { key: "SCREENING", label: "Screening", color: "border-blue-400" },
    { key: "INTERVIEW", label: "Interview", color: "border-indigo-500" },
    { key: "SELECTED", label: "Selected", color: "border-teal-500" },
    { key: "OFFERED", label: "Offered", color: "border-purple-500" },
    { key: "JOINED", label: "Joined", color: "border-emerald-500" },
    { key: "REJECTED", label: "Rejected", color: "border-rose-400" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Briefcase className="text-indigo-600 dark:text-indigo-400" />
              Recruitment & ATS Pipeline
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visual Kanban applicant pipeline, candidate screenings, interview loops, and offer rollouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddCandModalOpen(true)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <UserPlus size={16} />
              <span>Add Candidate</span>
            </button>
            <button
              onClick={() => setJobModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <Plus size={16} />
              <span>Post Job Opening</span>
            </button>
          </div>
        </div>

        {/* Job Openings Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Job Openings ({jobs.length})
            </span>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="px-3 py-1 bg-white dark:bg-slate-900 border rounded-xl text-xs font-semibold"
            >
              <option value="ALL">All Requisitions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job.id === selectedJob ? "ALL" : job.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedJob === job.id
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-md"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{job.title}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {job.department?.name}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {job.openingsCount} Open
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                  <span>{job.experienceYears}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {job._count?.candidates || 0} Applicants
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Stage Kanban Pipeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Candidate Pipeline Board</h3>
            <span className="text-xs text-slate-400">Click candidate card to progress stage or review feedback</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 overflow-x-auto min-h-[480px]">
            {STAGES.map((st) => {
              const list = kanban[st.key] || [];

              return (
                <div
                  key={st.key}
                  className={`bg-slate-100/60 dark:bg-slate-900/40 rounded-2xl p-3 border-t-4 ${st.color} border-slate-200 dark:border-slate-800 flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        {st.label}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-xs">
                        {list.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {list.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setActiveCandidate(c);
                            setNewStage(c.status);
                            setCandidateModalOpen(true);
                          }}
                          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-indigo-400 cursor-pointer transition-all space-y-1.5"
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                              {c.fullName}
                            </h4>
                            <div className="flex items-center text-amber-500 text-[10px]">
                              <Star size={10} fill="currentColor" />
                              <span className="ml-0.5 font-bold">{c.rating}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{c.jobOpening?.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                            <span>CTC: ₹{((c.expectedCtc || 2000000) / 100000).toFixed(1)}L</span>
                            <span>{c.noticePeriodDays}d Notice</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Candidate Stage Progression Modal */}
        {candidateModalOpen && activeCandidate && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {activeCandidate.fullName}
                  </h3>
                  <span className="text-xs text-indigo-600">{activeCandidate.jobOpening?.title}</span>
                </div>
                <button onClick={() => setCandidateModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <p><span className="text-slate-400">Email:</span> {activeCandidate.email}</p>
                  <p><span className="text-slate-400">Phone:</span> {activeCandidate.phone}</p>
                  <p><span className="text-slate-400">Current Employer:</span> {activeCandidate.currentCompany || "N/A"}</p>
                  <p><span className="text-slate-400">Current / Expected CTC:</span> ₹{((activeCandidate.currentCtc || 1800000)/100000).toFixed(1)}L / ₹{((activeCandidate.expectedCtc || 2400000)/100000).toFixed(1)}L</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transition Pipeline Stage:
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stage Notes & Evaluation:
                  </label>
                  <textarea
                    rows={2}
                    value={stageNotes}
                    onChange={(e) => setStageNotes(e.target.value)}
                    placeholder="e.g. Cleared technical interview with 4.5/5 rating..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCandidateModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStage(activeCandidate.id, newStage)}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    Update Stage
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post Job Modal */}
        {jobModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Post New Job Opening</h3>
                <button onClick={() => setJobModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Security Architect"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Department</label>
                    <select
                      value={jobDept}
                      onChange={(e) => setJobDept(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Headcount</label>
                    <input
                      type="number"
                      value={jobOpenings}
                      onChange={(e) => setJobOpenings(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Job Description</label>
                  <textarea
                    rows={3}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Key responsibilities and qualifications..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setJobModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={jobSubmitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    {jobSubmitting ? "Posting..." : "Publish Opening"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Candidate Modal */}
        {addCandModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Register Candidate Application</h3>
                <button onClick={() => setAddCandModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCandidate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Target Job Requisition *</label>
                  <select
                    value={candJobId || (jobs[0]?.id || "")}
                    onChange={(e) => setCandJobId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.title} ({j.department?.name})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      placeholder="e.g. Ananya Patel"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={candEmail}
                      onChange={(e) => setCandEmail(e.target.value)}
                      placeholder="ananya@example.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={candPhone}
                      onChange={(e) => setCandPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Current Company</label>
                    <input
                      type="text"
                      value={candCompany}
                      onChange={(e) => setCandCompany(e.target.value)}
                      placeholder="e.g. Infosys / TCS"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold mb-1">Current CTC (₹)</label>
                    <input
                      type="number"
                      value={candCtc}
                      onChange={(e) => setCandCtc(e.target.value)}
                      placeholder="1200000"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Expected CTC (₹)</label>
                    <input
                      type="number"
                      value={candExpCtc}
                      onChange={(e) => setCandExpCtc(e.target.value)}
                      placeholder="1600000"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Notice (Days)</label>
                    <input
                      type="number"
                      value={candNotice}
                      onChange={(e) => setCandNotice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddCandModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={candSubmitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    {candSubmitting ? "Adding..." : "Add to Pipeline"}
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
