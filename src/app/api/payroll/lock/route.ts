import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id, month, year, lock = true } = await req.json();

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

    const shouldLock = Boolean(lock);
    const updated = await prisma.payrollMonth.update({
      where: { id: payrollMonth.id },
      data: {
        isLocked: shouldLock,
        status: shouldLock ? "LOCKED" : "PAID",
        lockedAt: shouldLock ? new Date() : null,
        lockedBy: shouldLock ? auth.name || auth.role : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: shouldLock ? "LOCK_PAYROLL" : "UNLOCK_PAYROLL",
        entity: "PayrollMonth",
        entityId: payrollMonth.id,
        details: `${shouldLock ? "Locked" : "Unlocked"} payroll period ${payrollMonth.month}/${payrollMonth.year} by ${auth.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payroll for ${payrollMonth.month}/${payrollMonth.year} is now ${shouldLock ? "LOCKED" : "UNLOCKED"}.`,
      payrollMonth: updated,
    });
  } catch (error: any) {
    console.error("Lock payroll error:", error);
    return NextResponse.json({ error: "Failed to update payroll lock status." }, { status: 500 });
  }
}
