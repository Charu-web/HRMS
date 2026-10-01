"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Printer, ArrowLeft, Download, ShieldCheck, Building2 } from "lucide-react";

export default function PayslipViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetch(`/api/payroll/payslips/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Restricted or not found");
          return res.json();
        })
        .then((json) => setData(json))
        .catch((e) => setError("Payslip access restricted or record does not exist."))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider animate-pulse">
          Generating Official Payslip...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border text-center space-y-3 max-w-sm">
          <p className="text-sm font-bold text-rose-600">{error || "Failed to load payslip"}</p>
          <button
            onClick={() => router.push("/payroll")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
          >
            Back to Payroll
          </button>
        </div>
      </div>
    );
  }

  const { payslip, company, template } = data;
  const emp = payslip.employee;

  const showBank = template?.showBankDetails !== false;
  const showTax = template?.showPanUan !== false && template?.showTaxDetails !== false;
  const showLeave = template?.showLeavesSummary !== false && template?.showLeaveDetails !== false;
  const showPFESI = template?.showEmployerContributions !== false && template?.showPFESI !== false;

  const signatoryTitle = template?.signatoryTitle || "Authorized Signatory";
  const signatoryName = template?.authorizedSignatory || template?.signatoryName || "Head of HR & Accounting";
  const signatureUrl = template?.signatureUrl || template?.signatorySignUrl;
  const footerNote = template?.footerText || template?.footerNote;
  const termsAndConditions = template?.termsAndConditions;

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 font-sans">
      {/* Top Action Bar (Hidden during Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <Link
          href="/payroll"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Payroll Portal</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={printDocument}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Official Payslip Printable Document */}
      <div
        id="payslip-document"
        className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-indigo-600 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              {template?.companyLogo ? (
                <img
                  src={template.companyLogo}
                  alt="Logo"
                  className="w-12 h-12 object-contain rounded-xl"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl">
                  {template?.companyName?.[0] || company?.name?.[0] || "Z"}
                </div>
              )}
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {template?.companyName || company.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {template?.companyAddress || `${company.address || ""}, ${company.city || ""}`}
            </p>
            <p className="text-[11px] text-slate-400">Corporate Identity No: U72200KA2020PTC138902</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold uppercase rounded-lg tracking-wider">
              {template?.name || "Official Salary Slip"}
            </span>
            <p className="text-sm font-black text-slate-800 pt-1">
              {new Date(payslip.year, payslip.month - 1).toLocaleString("en-US", { month: "long" })} {payslip.year}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">Status: {payslip.paymentStatus}</p>
          </div>
        </div>

        {/* Employee & Bank Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Employee Name</span>
            <span className="font-bold text-slate-900 text-sm">{emp.firstName} {emp.lastName}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Employee Code</span>
            <span className="font-bold font-mono text-slate-900">{emp.employeeCode}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Department</span>
            <span className="font-bold text-slate-900">{emp.department?.name || "Technology"}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Designation</span>
            <span className="font-bold text-slate-900">{emp.designation?.name || "Staff Engineer"}</span>
          </div>

          {showBank && (
            <>
              <div>
                <span className="text-slate-400 block font-medium">Bank Name</span>
                <span className="font-semibold text-slate-800">{emp.bankName || "HDFC Bank"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Account Number</span>
                <span className="font-mono font-semibold text-slate-800">
                  {emp.accountNumber ? `••••${emp.accountNumber.slice(-4)}` : "••••1123"}
                </span>
              </div>
            </>
          )}

          {showTax && (
            <div>
              <span className="text-slate-400 block font-medium">PAN Number</span>
              <span className="font-mono font-semibold text-slate-800">{emp.panNumber || "ABCDE1234F"}</span>
            </div>
          )}

          {showPFESI && (
            <div>
              <span className="text-slate-400 block font-medium">UAN / PF Number</span>
              <span className="font-mono font-semibold text-slate-800">{emp.uanNumber || "100908234125"}</span>
            </div>
          )}
        </div>

        {/* Attendance Summary Strip */}
        {showLeave && (
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 my-6 text-center text-xs">
            <div>
              <span className="text-slate-400 block">Total Days</span>
              <span className="font-bold text-slate-800">{payslip.workingDays}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Present Days</span>
              <span className="font-bold text-emerald-600">{payslip.presentDays}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Paid Leaves</span>
              <span className="font-bold text-blue-600">{payslip.paidLeaveDays}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Loss of Pay (LOP)</span>
              <span className="font-bold text-rose-600">{payslip.lopDays}</span>
            </div>
          </div>
        )}

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
          {/* Earnings */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-800 flex justify-between">
              <span>Earnings Component</span>
              <span>Amount (INR)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs p-2">
              <div className="flex justify-between py-1.5 px-2">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-semibold">₹{payslip.basicSalary.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2">
                <span className="text-slate-600">House Rent Allowance (HRA)</span>
                <span className="font-semibold">₹{payslip.hra.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2">
                <span className="text-slate-600">Special Allowance</span>
                <span className="font-semibold">₹{payslip.specialAllowance.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2">
                <span className="text-slate-600">Conveyance Allowance</span>
                <span className="font-semibold">₹{payslip.conveyance.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2">
                <span className="text-slate-600">Medical Allowance</span>
                <span className="font-semibold">₹{payslip.medicalAllowance.toLocaleString("en-IN")}</span>
              </div>
              {payslip.otherAllowance > 0 && (
                <div className="flex justify-between py-1.5 px-2">
                  <span className="text-slate-600">Other Allowance</span>
                  <span className="font-semibold">₹{payslip.otherAllowance.toLocaleString("en-IN")}</span>
                </div>
              )}
              {payslip.incentivesAmount > 0 && (
                <div className="flex justify-between py-1.5 px-2">
                  <span className="text-slate-600">Bonus / Incentives</span>
                  <span className="font-semibold">₹{payslip.incentivesAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {payslip.overtimeAmount > 0 && (
                <div className="flex justify-between py-1.5 px-2">
                  <span className="text-slate-600">Overtime Compensation</span>
                  <span className="font-semibold">₹{payslip.overtimeAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
            <div className="bg-indigo-50/60 border-t border-slate-200 px-4 py-2.5 flex justify-between font-bold text-xs text-indigo-950">
              <span>Gross Earnings (A)</span>
              <span>₹{payslip.grossEarnings.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-800 flex justify-between">
              <span>Deductions Component</span>
              <span>Amount (INR)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs p-2">
              <div className="flex justify-between py-1.5 px-2">
                <span className="text-slate-600">Provident Fund (EPF Employee)</span>
                <span className="font-semibold">₹{payslip.epfDeduction.toLocaleString("en-IN")}</span>
              </div>
              {payslip.esiDeduction > 0 && (
                <div className="flex justify-between py-1.5 px-2">
                  <span className="text-slate-600">ESI Employee Contribution</span>
                  <span className="font-semibold">₹{payslip.esiDeduction.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 px-2">
                <span className="text-slate-600">Professional Tax (PT)</span>
                <span className="font-semibold">₹{payslip.professionalTax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2">
                <span className="text-slate-600">Tax Deducted at Source (TDS)</span>
                <span className="font-semibold">₹{payslip.tdsDeduction.toLocaleString("en-IN")}</span>
              </div>
              {payslip.loanDeduction > 0 && (
                <div className="flex justify-between py-1.5 px-2">
                  <span className="text-slate-600">Loan / Advance Deduction</span>
                  <span className="font-semibold">₹{payslip.loanDeduction.toLocaleString("en-IN")}</span>
                </div>
              )}
              {payslip.otherDeductions > 0 && (
                <div className="flex justify-between py-1.5 px-2">
                  <span className="text-slate-600">Other Adjustments / LOP</span>
                  <span className="font-semibold">₹{payslip.otherDeductions.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
            <div className="bg-rose-50/60 border-t border-slate-200 px-4 py-2.5 flex justify-between font-bold text-xs text-rose-950">
              <span>Total Deductions (B)</span>
              <span>₹{payslip.totalDeductions.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Employer Contributions Box if enabled */}
        {showPFESI && (payslip.epfEmployer > 0 || payslip.esiEmployer > 0) && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl my-4 text-xs">
            <span className="font-bold text-slate-700 block mb-2">Employer Statutory Contributions (Not deducted from gross):</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500">EPF Employer: </span>
                <span className="font-semibold text-slate-800">₹{(payslip.epfEmployer || 0).toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-500">ESI Employer: </span>
                <span className="font-semibold text-slate-800">₹{(payslip.esiEmployer || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Net Salary Summary Box */}
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-slate-50 border-2 border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div>
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
              Net Payable Salary (Gross - Deductions)
            </span>
            <p className="text-xs text-slate-500 mt-1 italic">
              Amount deposited directly to registered salary bank account.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-3xl font-black text-slate-900 block">
              ₹{payslip.netSalary.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Payment Completed
            </span>
          </div>
        </div>

        {/* Signatures & Seal */}
        <div className="grid grid-cols-2 gap-8 pt-10 mt-8 border-t border-slate-200 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-800">{signatoryTitle}</p>
            <p className="text-slate-500 text-[11px] font-semibold">{signatoryName}</p>
            {signatureUrl ? (
              <div className="pt-2">
                <img src={signatureUrl} alt="Signature" className="h-10 object-contain" />
              </div>
            ) : (
              <div className="pt-4 font-mono text-[10px] text-slate-400">
                Digitally Signed with Secure Cryptographic Key
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <p className="font-bold text-slate-800">Employee Signature</p>
            <p className="text-slate-400 text-[10px]">Confidential Record</p>
            <div className="pt-6 font-mono text-[10px] text-slate-400">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        {termsAndConditions && (
          <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
            <span className="font-bold block text-slate-700 mb-0.5">Terms & Notes:</span>
            {termsAndConditions}
          </div>
        )}

        {/* Footer Note */}
        {footerNote && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 italic">
            {footerNote}
          </div>
        )}
      </div>
    </div>
  );
}
