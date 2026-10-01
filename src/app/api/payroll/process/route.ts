import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { month, year, action } = await req.json();
    if (!month || !year) {
      return NextResponse.json({ error: "Month and Year are required." }, { status: 400 });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    // Check if payroll month exists and is locked
    let payrollMonth = await prisma.payrollMonth.findUnique({
      where: {
        month_year: { month: m, year: y },
      },
    });

    if (payrollMonth && payrollMonth.isLocked) {
      return NextResponse.json(
        { error: "This payroll month has been locked and cannot be recalculated or modified." },
        { status: 400 }
      );
    }

    // Get active salary slip template
    const defaultTemplate = await prisma.salarySlipTemplate.findFirst({
      where: { isDefault: true },
    });

    // Get all active employees with salary structure
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        salaryStructure: true,
      },
    });

    if (employees.length === 0) {
      return NextResponse.json({ error: "No active employees found." }, { status: 400 });
    }

    // Upsert Payroll Month
    const targetStatus = action === "GENERATE_DRAFT" ? "DRAFT" : "PAID";
    if (!payrollMonth) {
      payrollMonth = await prisma.payrollMonth.create({
        data: {
          month: m,
          year: y,
          status: targetStatus,
        },
      });
    }

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let processedCount = 0;

    for (const emp of employees) {
      const struct = emp.salaryStructure;
      // Allowances / Earnings
      const base = struct?.basicSalary || 40000;
      const hra = struct?.hra || 20000;
      const special = struct?.specialAllowance || 12000;
      const conveyance = struct?.conveyance || 2000;
      const medical = struct?.medicalAllowance || 1500;
      const otherAllowance = struct?.otherAllowance || 0;
      const bonus = struct?.bonus || 0;
      const incentives = struct?.incentives || 0;
      const overtime = 0;

      const gross = base + hra + special + conveyance + medical + otherAllowance + bonus + incentives + overtime;

      // Deductions
      const epf = struct?.epfEmployee || 1800;
      const esi = struct?.esiEmployee || 0;
      const pt = struct?.professionalTax || 200;
      const tds = struct?.tds || Math.round(base * 0.08);
      const loan = struct?.loanDeduction || 0;
      const leaveDeduction = 0;

      const deductions = epf + esi + pt + tds + loan + leaveDeduction;
      const net = gross - deductions;

      // Employer contributions
      const epfEmployer = struct?.epfEmployer || 1800;
      const esiEmployer = struct?.esiEmployer || 0;

      totalGross += gross;
      totalDeductions += deductions;
      totalNet += net;
      processedCount++;

      // Upsert payslip
      await prisma.payslip.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: m,
            year: y,
          },
        },
        update: {
          basicSalary: base,
          hra,
          specialAllowance: special,
          conveyance,
          medicalAllowance: medical,
          otherAllowance,
          incentivesAmount: incentives,
          grossEarnings: gross,
          epfDeduction: epf,
          esiDeduction: esi,
          professionalTax: pt,
          tdsDeduction: tds,
          loanDeduction: loan,
          leaveDeduction,
          totalDeductions: deductions,
          epfEmployer,
          esiEmployer,
          netSalary: net,
          payrollMonthId: payrollMonth.id,
          templateId: defaultTemplate?.id || null,
          paymentStatus: targetStatus === "PAID" ? "PAID" : "PENDING",
          paymentDate: targetStatus === "PAID" ? new Date() : null,
        },
        create: {
          employeeId: emp.id,
          payrollMonthId: payrollMonth.id,
          templateId: defaultTemplate?.id || null,
          month: m,
          year: y,
          basicSalary: base,
          hra,
          specialAllowance: special,
          conveyance,
          medicalAllowance: medical,
          otherAllowance,
          incentivesAmount: incentives,
          grossEarnings: gross,
          epfDeduction: epf,
          esiDeduction: esi,
          professionalTax: pt,
          tdsDeduction: tds,
          loanDeduction: loan,
          leaveDeduction,
          totalDeductions: deductions,
          epfEmployer,
          esiEmployer,
          netSalary: net,
          workingDays: 30,
          presentDays: 28,
          paidLeaveDays: 2,
          lopDays: 0,
          paymentStatus: targetStatus === "PAID" ? "PAID" : "PENDING",
          paymentDate: targetStatus === "PAID" ? new Date() : null,
        },
      });

      // Send payslip notification to employee if paid
      if (emp.userId && targetStatus === "PAID") {
        await prisma.notification.create({
          data: {
            userId: emp.userId,
            title: `Payslip Available for ${new Date(y, m - 1).toLocaleString("en-US", { month: "long" })} ${y}`,
            message: `Your net salary of ₹${net.toLocaleString("en-IN")} has been credited. View your payslip.`,
            type: "PAYROLL",
            linkUrl: "/payroll",
          },
        });
      }
    }

    // Update payroll month
    await prisma.payrollMonth.update({
      where: { id: payrollMonth.id },
      data: {
        status: targetStatus,
        processedAt: new Date(),
        totalEmployees: processedCount,
        totalGross,
        totalDeductions,
        totalNet,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "PROCESS_PAYROLL",
        entity: "PayrollMonth",
        entityId: payrollMonth.id,
        details: `Processed payroll for ${m}/${y}: ${processedCount} employees, Net Disbursed: ₹${totalNet.toLocaleString("en-IN")}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payroll processed successfully for ${processedCount} employees.`,
      summary: {
        month: m,
        year: y,
        totalEmployees: processedCount,
        totalGross,
        totalDeductions,
        totalNet,
      },
    });
  } catch (error: any) {
    console.error("Process payroll error:", error);
    return NextResponse.json({ error: "Failed to process payroll." }, { status: 500 });
  }
}
