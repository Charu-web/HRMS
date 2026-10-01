import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: any = {};
    if (auth.role === "EMPLOYEE") {
      where.employeeId = auth.employeeId;
    }

    const corrections = await prisma.attendanceCorrection.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        attendance: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ corrections });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch corrections." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || !auth.employeeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { attendanceId, date, requestedCheckIn, requestedCheckOut, reason } = body;

    if (!date || !requestedCheckIn || !requestedCheckOut || !reason) {
      return NextResponse.json({ error: "Date, requested times, and justification reason are required." }, { status: 400 });
    }

    const correction = await prisma.attendanceCorrection.create({
      data: {
        employeeId: auth.employeeId,
        attendanceId: attendanceId || null,
        date: new Date(date),
        requestedCheckIn: new Date(requestedCheckIn),
        requestedCheckOut: new Date(requestedCheckOut),
        reason,
        status: "PENDING",
      },
    });

    // Notify manager
    const emp = await prisma.employee.findUnique({
      where: { id: auth.employeeId },
      include: { manager: true },
    });

    if (emp?.manager?.userId) {
      await prisma.notification.create({
        data: {
          userId: emp.manager.userId,
          title: "Attendance Regularization Request",
          message: `${emp.firstName} ${emp.lastName} requested attendance regularization for ${new Date(date).toLocaleDateString()}.`,
          type: "ATTENDANCE",
          linkUrl: "/attendance",
        },
      });
    }

    return NextResponse.json({ success: true, correction }, { status: 201 });
  } catch (error: any) {
    console.error("Create correction error:", error);
    return NextResponse.json({ error: "Failed to submit correction request." }, { status: 500 });
  }
}
