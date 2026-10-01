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
        { error: "Face Attendance is mandatory. Please use the Face Check-In option to verify." },
        { status: 400 }
      );
    }

    // Get employee with shift
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

    const now = new Date();

    // Check if shift start time is exceeded beyond grace period
    const shiftStartTime = employee.shift?.startTime || rules.officeStart || "09:00";
    const gracePeriod = employee.shift?.gracePeriodMins ?? rules.gracePeriodMinutes ?? 15;
    const [sHour, sMin] = shiftStartTime.split(":").map(Number);
    const shiftThreshold = new Date(today);
    shiftThreshold.setHours(sHour, sMin + gracePeriod, 0, 0);

    const isLate = now.getTime() > shiftThreshold.getTime();

    // Check if record exists for today
    let attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (attendance && attendance.checkIn) {
      return NextResponse.json({
        error: "Already punched in for today.",
        attendance,
      }, { status: 400 });
    }

    const checkInData = {
      checkIn: now,
      checkInLocation: location,
      checkInLatitude: latitude,
      checkInLongitude: longitude,
      checkInAccuracy: accuracy,
      checkInMode: body.checkInMode || "WEB_PORTAL",
      inGeofence: geofenceResult.inGeofence,
      faceVerified: body.faceVerified === true,
      status: "PRESENT",
      isLate,
    };

    if (attendance) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: checkInData,
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: today,
          ...checkInData,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "CHECK_IN",
        entity: "Attendance",
        entityId: attendance.id,
        details: `Employee punched in at ${now.toLocaleTimeString()}${isLate ? " (Late Arrival)" : ""}${geofenceResult.inGeofence ? " [In Geofence]" : " [Outside Geofence]"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Punched in successfully at ${now.toLocaleTimeString()}`,
      attendance,
      inGeofence: geofenceResult.inGeofence,
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to punch in." }, { status: 500 });
  }
}
