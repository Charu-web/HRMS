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
    const statusParam = searchParams.get("status");
    const employeeIdParam = searchParams.get("employeeId");

    const where: any = {};

    if (auth.role === "EMPLOYEE") {
      where.employeeId = auth.employeeId;
    } else if (auth.role === "MANAGER") {
      // Show leaves for employees they manage, OR their own leaves
      where.OR = [
        { employeeId: auth.employeeId },
        { employee: { managerId: auth.employeeId } },
      ];
    } else {
      if (employeeIdParam && employeeIdParam !== "ALL") {
        where.employeeId = employeeIdParam;
      }
    }

    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            profilePhoto: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaveRequests, leaves: leaveRequests });
  } catch (error: any) {
    console.error("Get leaves error:", error);
    return NextResponse.json({ error: "Failed to fetch leave requests." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || !auth.employeeId) {
      return NextResponse.json({ error: "Unauthorized or no employee profile linked." }, { status: 401 });
    }

    const body = await req.json();
    const { leaveTypeId, startDate, endDate, totalDays, isHalfDay, halfDayType, reason } = body;

    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Leave type, dates, and reason are required." }, { status: 400 });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (eDate.getTime() < sDate.getTime()) {
      return NextResponse.json({ error: "End date cannot be earlier than start date." }, { status: 400 });
    }

    const calculatedDays = isHalfDay ? 0.5 : (totalDays || Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1));

    // Overlapping leave validation
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: auth.employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        AND: [
          { startDate: { lte: eDate } },
          { endDate: { gte: sDate } },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json({
        error: `Overlapping leave request detected between ${new Date(overlapping.startDate).toLocaleDateString()} and ${new Date(overlapping.endDate).toLocaleDateString()}.`,
      }, { status: 400 });
    }

    // Check balance
    const currentYear = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: auth.employeeId,
          leaveTypeId,
          year: currentYear,
        },
      },
    });

    const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });

    if (balance && leaveType?.code !== "UL") {
      const remaining = balance.allocatedDays - (balance.usedDays + balance.pendingDays);
      if (calculatedDays > remaining) {
        return NextResponse.json({
          error: `Insufficient leave balance. You have ${remaining} days available for ${leaveType?.name || "this leave type"}.`,
        }, { status: 400 });
      }
    }

    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: auth.employeeId,
        leaveTypeId,
        startDate: sDate,
        endDate: eDate,
        totalDays: calculatedDays,
        isHalfDay: !!isHalfDay,
        halfDayType: isHalfDay ? halfDayType : null,
        reason,
        status: "PENDING",
      },
    });

    // Increment pending days in balance
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: balance.pendingDays + calculatedDays },
      });
    }

    // Notify Manager or Admin
    const emp = await prisma.employee.findUnique({
      where: { id: auth.employeeId },
      include: { manager: true },
    });

    const notifyUserId = emp?.manager?.userId;
    if (notifyUserId) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          title: "New Leave Application",
          message: `${emp.firstName} ${emp.lastName} applied for ${calculatedDays} day(s) of ${leaveType?.name}.`,
          type: "LEAVE",
          linkUrl: "/leaves",
        },
      });
    }

    return NextResponse.json({ success: true, leaveRequest: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error("Create leave request error:", error);
    return NextResponse.json({ error: "Failed to submit leave request." }, { status: 500 });
  }
}
