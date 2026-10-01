"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  ShieldCheck,
  Plus,
  X,
  ExternalLink,
  Eye,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [docTypeTab, setDocTypeTab] = useState<"company" | "employee">("company");

  // Upload Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("POLICY");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isCompanyDoc, setIsCompanyDoc] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (categoryFilter !== "ALL") query.append("category", categoryFilter);
      if (docTypeTab === "company") query.append("isCompany", "true");

      const res = await fetch(`/api/documents?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter, docTypeTab, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File Too Large", "Maximum document size is 5MB.");
        return;
      }
      setFileName(file.name);
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      setFileSize(sizeStr);

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setFileUrl(loadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      toast.error("File Required", "Please select a document file from your computer to upload.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          fileName: fileName || `${title.replace(/\s+/g, "_")}.pdf`,
          fileUrl,
          fileSize: fileSize || "1.0 MB",
          isCompanyDoc,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Document Uploaded", `"${title}" has been saved to the secure vault.`);
        setUploadModalOpen(false);
        setTitle("");
        setFileName("");
        setFileUrl("");
        setFileSize("");
        fetchDocuments();
      } else {
        toast.error("Upload Failed", data.error || "Failed to store document.");
      }
    } catch (e) {
      toast.error("Network Error", "Unable to upload document.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${docTitle}"?`)) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Document Deleted", `"${docTitle}" removed from the repository.`);
        fetchDocuments();
      } else {
        const err = await res.json();
        toast.error("Delete Failed", err.error || "Unable to delete document.");
      }
    } catch {
      toast.error("Network Error", "Failed to delete document.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: newStatus }),
      });
      if (res.ok) {
        toast.success("Status Updated", `Document marked as ${newStatus}.`);
        fetchDocuments();
      } else {
        toast.error("Update Failed", "Could not verify document.");
      }
    } catch {
      toast.error("Network Error", "Unable to change status.");
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isManager = user?.role === "MANAGER";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="text-indigo-600 dark:text-indigo-400" />
              Document Management Vault
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Store, inspect and verify employee KYC files, contracts, policy handbooks, and compliance notices.
            </p>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDocTypeTab("company")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                docTypeTab === "company"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Company Policies & Handbooks
            </button>
            <button
              onClick={() => setDocTypeTab("employee")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                docTypeTab === "employee"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Employee KYC & Credentials
            </button>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Categories</option>
            <option value="POLICY">Policy</option>
            <option value="IDENTIFICATION">Identification / KYC</option>
            <option value="EDUCATION">Education & Degree</option>
            <option value="CONTRACT">Contract & NDA</option>
            <option value="CERTIFICATE">Certificate</option>
          </select>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-slate-400">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-400">No documents found.</div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                        {doc.category}
                      </span>
                      {doc.fileSize && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.fileSize}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1 truncate" title={doc.title}>
                      {doc.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{doc.fileName}</p>
                    {doc.employee && (
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                        Uploaded by {doc.employee.firstName} {doc.employee.lastName} ({doc.employee.employeeCode})
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {isAdmin || isManager ? (
                      <select
                        value={doc.verificationStatus}
                        onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-none cursor-pointer outline-none ${
                          doc.verificationStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : doc.verificationStatus === "REJECTED"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc.verificationStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : doc.verificationStatus === "REJECTED"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Preview Document"
                    >
                      <Eye size={14} />
                    </button>
                    <a
                      href={doc.fileUrl}
                      download={doc.fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                    {(isAdmin || doc.employeeId === user?.employee?.id) && (
                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upload Modal */}
        {uploadModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Upload New Document</h3>
                <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Health Insurance Handbook 2026"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      <option value="POLICY">Policy</option>
                      <option value="IDENTIFICATION">Identification</option>
                      <option value="EDUCATION">Education</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="CERTIFICATE">Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Scope</label>
                    <select
                      value={isCompanyDoc ? "company" : "employee"}
                      onChange={(e) => setIsCompanyDoc(e.target.value === "company")}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    >
                      {isAdmin && <option value="company">Company-Wide</option>}
                      <option value="employee">Personal / KYC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Attach File (PDF, PNG, JPG, DOC)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                  />
                  {fileName && (
                    <p className="text-[11px] text-emerald-600 mt-1 font-mono">
                      Selected: {fileName} ({fileSize})
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 text-slate-500 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    {submitting ? "Uploading..." : "Save to Vault"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {previewDoc.title}
                  </h3>
                  <p className="text-xs text-slate-400">{previewDoc.fileName} • {previewDoc.fileSize || "1.2 MB"}</p>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 min-h-[300px] flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800">
                {previewDoc.fileUrl?.startsWith("data:image/") ? (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-[400px] object-contain rounded-xl"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <FileText size={48} className="mx-auto text-indigo-500" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.fileName}</p>
                      <p className="text-xs text-slate-400">Category: {previewDoc.category} | Status: {previewDoc.verificationStatus}</p>
                    </div>
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                    >
                      <Download size={14} />
                      <span>Open / Download Original File</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

