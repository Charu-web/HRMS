import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "MANAGER" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Manager, Admin or HR access required." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const status = body.status || (body.action === "APPROVE" ? "APPROVED" : body.action === "REJECT" ? "REJECTED" : null);
    const reviewerRemarks = body.reviewerRemarks || body.reviewerNotes || body.remarks || "";

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status: must be APPROVED or REJECTED" }, { status: 400 });
    }

    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!correction) {
      return NextResponse.json({ error: "Correction request not found." }, { status: 404 });
    }

    const updated = await prisma.attendanceCorrection.update({
      where: { id },
      data: {
        status,
        reviewerRemarks,
        reviewedBy: auth.name,
      },
    });

    // If approved, update or create attendance record
    if (status === "APPROVED") {
      const diffMs = new Date(correction.requestedCheckOut).getTime() - new Date(correction.requestedCheckIn).getTime();
      const workHours = Math.max(0, Math.round(((diffMs / (1000 * 60 * 60)) - 1.0) * 10) / 10);

      if (correction.attendanceId) {
        await prisma.attendance.update({
          where: { id: correction.attendanceId },
          data: {
            checkIn: correction.requestedCheckIn,
            checkOut: correction.requestedCheckOut,
            status: "PRESENT",
            isLate: false,
            workHours,
          },
        });
      } else {
        await prisma.attendance.create({
          data: {
            employeeId: correction.employeeId,
            date: correction.date,
            checkIn: correction.requestedCheckIn,
            checkOut: correction.requestedCheckOut,
            status: "PRESENT",
            isLate: false,
            workHours,
          },
        });
      }
    }

    // Notify employee
    if (correction.employee.userId) {
      await prisma.notification.create({
        data: {
          userId: correction.employee.userId,
          title: `Attendance Regularization ${status}`,
          message: `Your attendance correction request for ${new Date(correction.date).toLocaleDateString()} was ${status.toLowerCase()}.`,
          type: "ATTENDANCE",
          linkUrl: "/attendance",
        },
      });
    }

    return NextResponse.json({ success: true, correction: updated });
  } catch (error: any) {
    console.error("Update correction error:", error);
    return NextResponse.json({ error: "Failed to update correction." }, { status: 500 });
  }
}
