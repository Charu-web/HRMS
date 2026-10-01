import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const employeeIdParam = searchParams.get("employeeId");
    const departmentIdParam = searchParams.get("departmentId");

    let targetEmployeeId: string | null | undefined = employeeIdParam;
    if (auth.role === "EMPLOYEE") {
      targetEmployeeId = auth.employeeId;
    }

    const where: any = {};

    if (targetEmployeeId && targetEmployeeId !== "ALL") {
      where.employeeId = targetEmployeeId;
    }

    if (departmentIdParam && departmentIdParam !== "ALL") {
      where.employee = { departmentId: departmentIdParam };
    }

    if (dateParam) {
      const d = new Date(dateParam);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      where.date = { gte: d, lt: nextD };
    } else if (monthParam && yearParam) {
      const m = parseInt(monthParam, 10);
      const y = parseInt(yearParam, 10);
      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 1);
      where.date = { gte: startOfMonth, lt: endOfMonth };
    }

    const attendances = await prisma.attendance.findMany({
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
            shift: true,
          },
        },
        correction: true,
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    // Summary calculation
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let onLeaveCount = 0;
    let halfDayCount = 0;
    let faceVerifiedCount = 0;
    let inGeofenceCount = 0;
    let totalWorkHours = 0;

    attendances.forEach((att) => {
      if (att.status === "PRESENT") presentCount++;
      if (att.status === "ABSENT") absentCount++;
      if (att.status === "ON_LEAVE") onLeaveCount++;
      if (att.status === "HALF_DAY") halfDayCount++;
      if (att.isLate) lateCount++;
      if (att.faceVerified) faceVerifiedCount++;
      if (att.inGeofence) inGeofenceCount++;
      totalWorkHours += att.workHours;
    });

    return NextResponse.json({
      attendances,
      summary: {
        totalRecords: attendances.length,
        presentCount,
        absentCount,
        lateCount,
        onLeaveCount,
        halfDayCount,
        faceVerifiedCount,
        inGeofenceCount,
        avgWorkHours: attendances.length > 0 ? (totalWorkHours / (presentCount || 1)).toFixed(1) : "0.0",
      },
    });
  } catch (error: any) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance records." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager access required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, checkIn, checkOut, breakHours, notes } = body;
    if (!id) {
      return NextResponse.json({ error: "Attendance ID is required." }, { status: 400 });
    }

    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;
    let workHours = 0;
    let overtimeHours = 0;

    if (checkInDate && checkOutDate) {
      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      const diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));
      workHours = Math.round((diffHrs - (Number(breakHours) || 0)) * 10) / 10;
      overtimeHours = workHours > 8 ? Math.round((workHours - 8) * 10) / 10 : 0;
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        status: status || "PRESENT",
        checkIn: checkInDate,
        checkOut: checkOutDate,
        breakHours: Number(breakHours) || 0,
        workHours: Math.max(0, workHours),
        overtimeHours,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE",
        entity: "Attendance",
        entityId: id,
        details: `Attendance record ${id} modified by ${auth.name}. Status: ${status}, Work Hours: ${workHours}${notes ? ` (Notes: ${notes})` : ""}`,
      },
    });

    return NextResponse.json({ success: true, attendance: updated });
  } catch (error: any) {
    console.error("Attendance update error:", error);
    return NextResponse.json({ error: "Failed to update attendance record." }, { status: 500 });
  }
}

