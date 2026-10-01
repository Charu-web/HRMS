"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Megaphone, Plus, X, AlertCircle, Calendar, Sparkles, Send, Trash2 } from "lucide-react";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("GENERAL");
  const [category, setCategory] = useState("COMPANY");
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, priority, category }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Broadcast Dispatched", "Announcement published and broadcast notification sent.");
        setModalOpen(false);
        setTitle("");
        setContent("");
        fetchAnnouncements();
      } else {
        toast.error("Broadcast Failed", data.error || "Could not publish announcement.");
      }
    } catch (err) {
      toast.error("Network Error", "Unable to broadcast announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "HR";

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Announcement Removed", "Bulletin has been archived.");
        fetchAnnouncements();
      } else {
        toast.error("Action Failed", "Could not remove announcement.");
      }
    } catch {
      toast.error("Network Error", "Unable to remove announcement.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Megaphone className="text-indigo-600 dark:text-indigo-400" />
              Company Announcements
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Broadcast corporate updates, holiday closures, policy revisions, and town halls.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Broadcast Announcement</span>
            </button>
          )}
        </div>

        {/* Announcements List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-16 text-center text-slate-400">Loading bulletins...</div>
          ) : announcements.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-slate-400">No active announcements.</div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        ann.priority === "URGENT"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : ann.priority === "IMPORTANT"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(ann.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          title="Archive bulletin"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ann.content}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Published by: {ann.publishedByName}</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">ZenithHR Broadcast</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Broadcast Announcement</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Bulletin Headline *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Annual Company Offsite 2026 Announced"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      <option value="GENERAL">General Notice</option>
                      <option value="IMPORTANT">Important</option>
                      <option value="URGENT">Urgent Alert</option>
                      <option value="EVENT">Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      <option value="COMPANY">Company Wide</option>
                      <option value="HR_POLICY">HR Policy</option>
                      <option value="HOLIDAY">Holiday</option>
                      <option value="EVENT">Social Event</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Announcement Body *</label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Detailed message sent to all employee feeds and notification centers..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>{submitting ? "Broadcasting..." : "Broadcast to All"}</span>
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
