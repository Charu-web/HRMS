"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Sparkles,
  Search,
  Filter,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  ArrowUpDown,
  Send,
  Bell,
  Share2,
} from "lucide-react";

interface ProductUpdateItem {
  id: string;
  title: string;
  category: string;
  updateType: string;
  shortDescription: string;
  fullDescription: string;
  image?: string | null;
  publishDate: string;
  status: "Draft" | "Scheduled" | "Published" | "Archived" | string;
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
  userReaction?: "LIKE" | "DISLIKE" | null;
  commentsCount: number;
  comments?: Array<{
    id: string;
    userName: string;
    userRole?: string | null;
    comment: string;
    createdAt: string;
  }>;
}

const CATEGORIES = [
  "All",
  "Employee Self Service",
  "Attendance",
  "Leave Management",
  "Payroll",
  "Recruitment",
  "Performance",
  "Analytics",
  "Mobile App",
  "Security",
  "General",
];

const UPDATE_TYPES = ["New", "Update", "Improvement", "Fix", "Announcement"];

export default function ProductUpdatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [updates, setUpdates] = useState<ProductUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [detailUpdate, setDetailUpdate] = useState<ProductUpdateItem | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Admin Create/Edit Modal
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Attendance");
  const [formUpdateType, setFormUpdateType] = useState("New");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formFullDesc, setFormFullDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formPublishDate, setFormPublishDate] = useState(new Date().toISOString().split("T")[0]);
  const [formStatus, setFormStatus] = useState("PUBLISHED");
  const [savingForm, setSavingForm] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchQuery.trim()) query.append("search", searchQuery.trim());
      if (selectedCategory !== "All") query.append("category", selectedCategory);
      if (isAdmin && selectedStatus !== "ALL") query.append("status", selectedStatus);
      query.append("sort", sortBy);
      query.append("page", page.toString());
      query.append("limit", "8");

      const res = await fetch(`/api/product-updates?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Fetch Error", "Unable to load product updates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [selectedCategory, selectedStatus, sortBy, page, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUpdates();
  };

  const handleReaction = async (updateId: string, type: "LIKE" | "DISLIKE") => {
    try {
      const res = await fetch(`/api/product-updates/${updateId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REACT", type }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === updateId
              ? {
                  ...u,
                  likesCount: data.likesCount,
                  dislikesCount: data.dislikesCount,
                  userReaction: data.userReaction,
                }
              : u
          )
        );

        if (detailUpdate && detailUpdate.id === updateId) {
          setDetailUpdate((prev) =>
            prev
              ? {
                  ...prev,
                  likesCount: data.likesCount,
                  dislikesCount: data.dislikesCount,
                  userReaction: data.userReaction,
                }
              : null
          );
        }
      }
    } catch {
      toast.error("Feedback Error", "Unable to save reaction.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailUpdate || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/product-updates/${detailUpdate.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "COMMENT", comment: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Feedback Submitted", "Thank you for contributing your feedback!");
        setCommentText("");

        // Refresh detail view
        const refreshedRes = await fetch(`/api/product-updates/${detailUpdate.id}`);
        if (refreshedRes.ok) {
          const refData = await refreshedRes.json();
          setDetailUpdate(refData.update);
        }
        fetchUpdates();
      } else {
        const err = await res.json();
        toast.error("Feedback Failed", err.error || "Unable to submit comment.");
      }
    } catch {
      toast.error("Network Error", "Unable to post feedback.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle("");
    setFormCategory("Attendance");
    setFormUpdateType("New");
    setFormShortDesc("");
    setFormFullDesc("");
    setFormImage("");
    setFormPublishDate(new Date().toISOString().split("T")[0]);
    setFormStatus("PUBLISHED");
    setAdminModalOpen(true);
  };

  const openEditModal = (item: ProductUpdateItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormUpdateType(item.updateType);
    setFormShortDesc(item.shortDescription);
    setFormFullDesc(item.fullDescription);
    setFormImage(item.image || "");
    setFormPublishDate(new Date(item.publishDate).toISOString().split("T")[0]);
    setFormStatus(item.status);
    setAdminModalOpen(true);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);

    try {
      const url = editingId ? `/api/product-updates/${editingId}` : `/api/product-updates`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          updateType: formUpdateType,
          shortDescription: formShortDesc,
          fullDescription: formFullDesc,
          image: formImage || undefined,
          publishDate: formPublishDate,
          status: formStatus,
        }),
      });

      if (res.ok) {
        toast.success(
          editingId ? "Update Saved" : "Update Created",
          `"${formTitle}" is now ${formStatus.toLowerCase()}.`
        );
        setAdminModalOpen(false);
        fetchUpdates();
      } else {
        const err = await res.json();
        toast.error("Save Failed", err.error || "Failed to persist update.");
      }
    } catch {
      toast.error("Network Error", "Failed to save update.");
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeleteUpdate = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/product-updates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Update Deleted", `"${title}" has been removed.`);
        if (detailUpdate?.id === id) setDetailUpdate(null);
        fetchUpdates();
      } else {
        const err = await res.json();
        toast.error("Delete Failed", err.error || "Unable to remove update.");
      }
    } catch {
      toast.error("Network Error", "Unable to delete update.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/product-updates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Status Updated", `Update marked as ${newStatus}.`);
        fetchUpdates();
      }
    } catch {
      toast.error("Network Error", "Unable to change update status.");
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "New":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Update":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "Improvement":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Fix":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Announcement":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Product Updates
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Discover what's new, system releases, feature enhancements, and compliance advisories.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search releases & features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>

            {isAdmin && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <Plus size={16} />
                <span>New Release</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills & Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong>{updates.length}</strong> of {totalCount} updates
              </span>

              {isAdmin && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="font-semibold text-slate-400">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setPage(1);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={() => setSortBy(sortBy === "latest" ? "oldest" : "latest")}
              className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
            >
              <ArrowUpDown size={13} />
              <span>{sortBy === "latest" ? "Latest First" : "Oldest First"}</span>
            </button>
          </div>
        </div>

        {/* Updates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse p-6 space-y-4"
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-16 text-center space-y-3">
            <Sparkles size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No Product Updates Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no updates matching your search criteria or category filter. Check back soon for the latest features!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {updates.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                {/* Image Banner */}
                {item.image ? (
                  <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md bg-white/90 dark:bg-slate-900/90 shadow-sm ${getTypeBadgeClass(
                          item.updateType
                        )}`}
                      >
                        {item.updateType}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-900/70 text-white backdrop-blur-md">
                        {item.category}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            item.status === "PUBLISHED"
                              ? "bg-emerald-500 text-white"
                              : item.status === "DRAFT"
                              ? "bg-slate-700 text-white"
                              : item.status === "SCHEDULED"
                              ? "bg-amber-500 text-white"
                              : "bg-rose-500 text-white"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${getTypeBadgeClass(
                          item.updateType
                        )}`}
                      >
                        {item.updateType}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {item.category}
                      </span>
                    </div>
                    {isAdmin && (
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          item.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>
                )}

                {/* Card Content */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Calendar size={13} />
                      <span>{new Date(item.publishDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>

                    <h3
                      onClick={() => setDetailUpdate(item)}
                      className="font-bold text-base text-slate-900 dark:text-white leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {item.shortDescription}
                    </p>
                  </div>

                  {/* Actions & Interactions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      {/* Read More button */}
                      <button
                        onClick={() => setDetailUpdate(item)}
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Read Full Release</span>
                        <ChevronRight size={14} />
                      </button>

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="Edit Release"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUpdate(item.id, item.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                            title="Delete Release"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reactions Bar */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReaction(item.id, "LIKE")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                            item.userReaction === "LIKE"
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                          }`}
                        >
                          <ThumbsUp size={13} className={item.userReaction === "LIKE" ? "fill-indigo-600" : ""} />
                          <span>{item.likesCount}</span>
                        </button>

                        <button
                          onClick={() => handleReaction(item.id, "DISLIKE")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                            item.userReaction === "DISLIKE"
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                          }`}
                        >
                          <ThumbsDown size={13} className={item.userReaction === "DISLIKE" ? "fill-rose-600" : ""} />
                          <span>{item.dislikesCount}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setDetailUpdate(item)}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-600"
                      >
                        <MessageSquare size={13} />
                        <span>{item.commentsCount} Feedback</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {detailUpdate && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getTypeBadgeClass(
                        detailUpdate.updateType
                      )}`}
                    >
                      {detailUpdate.updateType}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{detailUpdate.category}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(detailUpdate.publishDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {detailUpdate.title}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailUpdate(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {detailUpdate.image && (
                <div className="rounded-2xl overflow-hidden max-h-72 w-full">
                  <img src={detailUpdate.image} alt={detailUpdate.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Full Description formatted */}
              <div className="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {detailUpdate.fullDescription || detailUpdate.shortDescription}
              </div>

              {/* Reactions Bar in Detail */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReaction(detailUpdate.id, "LIKE")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      detailUpdate.userReaction === "LIKE"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <ThumbsUp size={14} />
                    <span>Helpful ({detailUpdate.likesCount})</span>
                  </button>

                  <button
                    onClick={() => handleReaction(detailUpdate.id, "DISLIKE")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      detailUpdate.userReaction === "DISLIKE"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <ThumbsDown size={14} />
                    <span>Not Useful ({detailUpdate.dislikesCount})</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Eye size={13} />
                  <span>{detailUpdate.viewsCount} Views</span>
                </div>
              </div>

              {/* Comments / Feedback Section */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={16} />
                  <span>Feedback & Discussion ({detailUpdate.comments?.length || 0})</span>
                </h4>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Share feedback, ask questions or report suggestions..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{submittingComment ? "Posting..." : "Submit"}</span>
                  </button>
                </form>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {detailUpdate.comments && detailUpdate.comments.length > 0 ? (
                    detailUpdate.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {c.userName}
                            {c.userRole && (
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {c.userRole}
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{c.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No feedback yet. Be the first to share your thoughts on this update!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Create / Edit Modal */}
        {adminModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingId ? "Edit Product Update" : "Publish New Product Update"}
                </h3>
                <button onClick={() => setAdminModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUpdate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Release Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Multi-tier Leave Approvals & Sandwiched Weekend Rules"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Update Type *</label>
                    <select
                      value={formUpdateType}
                      onChange={(e) => setFormUpdateType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      {UPDATE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Short Description (Summary) *</label>
                  <textarea
                    required
                    rows={2}
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    placeholder="Brief 1-2 sentence overview for the card..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Full Detailed Notes</label>
                  <textarea
                    rows={5}
                    value={formFullDesc}
                    onChange={(e) => setFormFullDesc(e.target.value)}
                    placeholder="Comprehensive release notes, feature highlights, and instructions..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Banner Image URL</label>
                    <input
                      type="url"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Status *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Publish Date</label>
                  <input
                    type="date"
                    value={formPublishDate}
                    onChange={(e) => setFormPublishDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingForm}
                    className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingForm ? "Saving..." : editingId ? "Save Changes" : "Create Release"}
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
