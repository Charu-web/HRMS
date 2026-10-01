import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || !auth.employeeId) {
      return NextResponse.json({ error: "Unauthorized or no employee profile linked." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const location = body.location || "Web Portal Punch (Self-Service)";
    const latitude = typeof body.latitude === "number" ? body.latitude : null;
    const longitude = typeof body.longitude === "number" ? body.longitude : null;
    const accuracy = typeof body.accuracy === "number" ? body.accuracy : null;

    // Check attendance settings
    const attendanceRuleSetting = await prisma.systemSetting.findUnique({
      where: { key: "attendance_rules" },
    });
    let rules: any = {};
    if (attendanceRuleSetting?.value) {
      try {
        rules = JSON.parse(attendanceRuleSetting.value);
      } catch (e) {}
    }

    if (rules.requireFaceAttendance && !body.faceVerified) {
      return NextResponse.json(
        { error: "Face Attendance is mandatory. Please use the Face Check-Out option to verify." },
        { status: 400 }
      );
    }

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: auth.employeeId },
      include: { shift: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee record not found." }, { status: 404 });
    }

    // Geofence check
    const { verifyGeofence } = await import("@/lib/geofence");
    const geofenceResult = await verifyGeofence(latitude, longitude, employee.branchId || null);

    if (rules.requireGeofencing && !geofenceResult.inGeofence) {
      return NextResponse.json(
        {
          error: `Geofence violation: You are ${geofenceResult.nearestDistance}m away from ${geofenceResult.nearestLocationName || "the office"}. Maximum allowed radius is ${geofenceResult.allowedRadius || 500}m.`,
        },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: auth.employeeId,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (!attendance || !attendance.checkIn) {
      return NextResponse.json({ error: "No punch-in record found for today. Please punch in first." }, { status: 400 });
    }

    const now = new Date();
    const diffMs = now.getTime() - new Date(attendance.checkIn).getTime();
    const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
    // If worked less than break hours, don't deduct more than worked
    const applicableBreak = diffHours >= attendance.breakHours ? attendance.breakHours : 0;
    const workHours = Math.max(0, Math.round((diffHours - applicableBreak) * 10) / 10);
    const overtimeHours = workHours > 8.0 ? Math.round((workHours - 8.0) * 10) / 10 : 0;

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        checkOutLocation: location,
        checkOutLatitude: latitude,
        checkOutLongitude: longitude,
        checkOutAccuracy: accuracy,
        checkOutMode: body.checkOutMode || "WEB_PORTAL",
        workHours,
        overtimeHours,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "CHECK_OUT",
        entity: "Attendance",
        entityId: updated.id,
        details: `Employee punched out at ${now.toLocaleTimeString()}. Worked ${workHours} hrs.${geofenceResult.inGeofence ? " [In Geofence]" : " [Outside Geofence]"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Punched out successfully. Total Work Hours: ${workHours} hrs`,
      attendance: updated,
      inGeofence: geofenceResult.inGeofence,
    });
  } catch (error: any) {
    console.error("Check-out error:", error);
    return NextResponse.json({ error: "Failed to punch out." }, { status: 500 });
  }
}
