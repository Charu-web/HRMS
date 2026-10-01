import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id, month, year } = await req.json();

    let payrollMonth;
    if (id) {
      payrollMonth = await prisma.payrollMonth.findUnique({ where: { id } });
    } else if (month && year) {
      payrollMonth = await prisma.payrollMonth.findUnique({
        where: { month_year: { month: parseInt(month, 10), year: parseInt(year, 10) } },
      });
    }

    if (!payrollMonth) {
      return NextResponse.json({ error: "Payroll record not found for the specified period." }, { status: 404 });
    }

    if (payrollMonth.isLocked) {
      return NextResponse.json({ error: "This payroll month is already locked." }, { status: 400 });
    }

    const updated = await prisma.payrollMonth.update({
      where: { id: payrollMonth.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: auth.name || auth.role,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "APPROVE_PAYROLL",
        entity: "PayrollMonth",
        entityId: payrollMonth.id,
        details: `Approved payroll for ${payrollMonth.month}/${payrollMonth.year} by ${auth.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payroll for ${payrollMonth.month}/${payrollMonth.year} has been approved.`,
      payrollMonth: updated,
    });
  } catch (error: any) {
    console.error("Approve payroll error:", error);
    return NextResponse.json({ error: "Failed to approve payroll." }, { status: 500 });
  }
}
