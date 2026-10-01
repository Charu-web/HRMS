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
    const targetEmployeeId = (auth.role === "ADMIN" || auth.role === "SUPER_ADMIN" || auth.role === "HR")
      ? (searchParams.get("employeeId") || auth.employeeId)
      : auth.employeeId;

    if (!targetEmployeeId) {
      return NextResponse.json({ error: "No employee profile found." }, { status: 404 });
    }

    // Check enrollment
    const enrollment = await prisma.faceEnrollment.findUnique({
      where: { employeeId: targetEmployeeId },
      select: {
        id: true,
        employeeId: true,
        photoUrl: true,
        consentGiven: true,
        consentTimestamp: true,
        isActive: true,
        enrolledAt: true,
      },
    });

    // Check system setting for face attendance
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "attendance_rules" },
    });

    let enableFaceAttendance = true;
    if (setting) {
      try {
        const val = JSON.parse(setting.value);
        if (val.enableFaceAttendance !== undefined) {
          enableFaceAttendance = !!val.enableFaceAttendance;
        }
      } catch {}
    }

    return NextResponse.json({
      isEnrolled: !!enrollment && enrollment.isActive,
      enrollment: enrollment || null,
      enableFaceAttendance,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/face/status error:", error);
    return NextResponse.json({ error: "Failed to check face enrollment status." }, { status: 500 });
  }
}
