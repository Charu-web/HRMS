import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || auth.employeeId;

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
      },
      include: {
        leaveType: true,
      },
    });

    const formatted = balances.map((b) => ({
      id: b.id,
      leaveTypeId: b.leaveTypeId,
      name: b.leaveType.name,
      code: b.leaveType.code,
      color: b.leaveType.color,
      allocated: b.allocatedDays,
      used: b.usedDays,
      pending: b.pendingDays,
      available: Math.max(0, b.allocatedDays - b.usedDays - b.pendingDays),
    }));

    return NextResponse.json({ balances: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch leave balances." }, { status: 500 });
  }
}
