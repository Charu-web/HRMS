import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCosineSimilarity, calculateEuclideanDistance } from "@/lib/face-detection";

function normalizeVector(vec: number[]): number[] {
  if (!vec || vec.length === 0) return [];
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || !auth.employeeId) {
      return NextResponse.json({ error: "Unauthorized or no employee profile linked." }, { status: 401 });
    }

    const body = await req.json();
    const { faceDescriptor, type, punchType, latitude, longitude, accuracy } = body;
    const resolvedType = (type || punchType || "in").toLowerCase() === "out" ? "out" : "in";

    if (!faceDescriptor) {
      return NextResponse.json({ error: "Live facial signature capture is required for verification." }, { status: 400 });
    }

    // Retrieve enrolled template
    const enrollment = await prisma.faceEnrollment.findUnique({
      where: { employeeId: auth.employeeId },
    });

    if (!enrollment || !enrollment.isActive) {
      return NextResponse.json({
        error: "No enrolled facial profile found for your account. Please complete face registration first.",
      }, { status: 400 });
    }

    let rawEnrolledVec: number[] = [];
    let rawLiveVec: number[] = [];
    try {
      rawEnrolledVec = typeof enrollment.faceDescriptor === "string" ? JSON.parse(enrollment.faceDescriptor) : enrollment.faceDescriptor;
      rawLiveVec = typeof faceDescriptor === "string" ? JSON.parse(faceDescriptor) : faceDescriptor;
    } catch {
      return NextResponse.json({ error: "Malformed biometric descriptor vector." }, { status: 400 });
    }

    if (!Array.isArray(rawEnrolledVec) || !Array.isArray(rawLiveVec) || rawEnrolledVec.length === 0 || rawLiveVec.length === 0) {
      return NextResponse.json({ error: "Invalid biometric descriptor length." }, { status: 400 });
    }

    // Ensure vectors are unit-normalized before comparison
    const enrolledVec = normalizeVector(rawEnrolledVec);
    const liveVec = normalizeVector(rawLiveVec);

    // Compute vector distance and similarity checks
    const distance = calculateEuclideanDistance(liveVec, enrolledVec);
    const similarity = calculateCosineSimilarity(liveVec, enrolledVec);

    // Retrieve configurable threshold from system settings (default: 65% match confidence)
    const attendanceRuleSetting = await prisma.systemSetting.findUnique({
      where: { key: "attendance_rules" },
    });
    let rules: any = {};
    if (attendanceRuleSetting?.value) {
      try {
        rules = JSON.parse(attendanceRuleSetting.value);
      } catch (e) {}
    }

    const minMatchConfidence = rules.faceMatchThreshold ?? 65; // e.g. 65%
    const similarityThreshold = minMatchConfidence / 100; // e.g. 0.65
    // For unit vectors: distance = sqrt(2*(1 - similarity))
    // similarity = 0.65 corresponds to distance ~0.836
    const distanceThreshold = rules.faceDistanceThreshold ?? (Math.sqrt(2 * Math.max(0, 1 - similarityThreshold)) + 0.08);

    const isMatch = similarity >= similarityThreshold || distance <= distanceThreshold;
    const matchPercentage = Math.max(0, Math.min(100, Math.round(similarity * 100)));

    if (!isMatch) {
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          userName: auth.name,
          action: "FACE_VERIFICATION_FAILED",
          entity: "Attendance",
          details: `Biometric face mismatch: match confidence ${matchPercentage}% (threshold: ${minMatchConfidence}%, distance: ${distance.toFixed(3)})`,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      return NextResponse.json({
        error: `Face verification failed. Match score (${matchPercentage}%) was below the required security threshold (${minMatchConfidence}%). Please align your face inside the guide oval with adequate lighting.`,
        similarity,
        matchScore: matchPercentage,
        distance,
      }, { status: 400 });
    }

    // Verification PASSED! Now record attendance check-in or check-out
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const now = new Date();

    const employee = await prisma.employee.findUnique({
      where: { id: auth.employeeId },
      include: { shift: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found." }, { status: 404 });
    }

    // Server-side Geofence Enforcement
    let inGeofence = true;
    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
      const { verifyGeofence } = await import("@/lib/geofence");
      const geofenceResult = await verifyGeofence(latitude, longitude, employee.branchId || null);
      inGeofence = geofenceResult.inGeofence;

      if (rules.requireGeofencing && !geofenceResult.inGeofence) {
        return NextResponse.json(
          {
            error: `Geofence violation: Face recognized, but you are ${geofenceResult.nearestDistance}m away from ${geofenceResult.nearestLocationName || "the office"}. Allowed radius is ${geofenceResult.allowedRadius || 500}m.`,
          },
          { status: 400 }
        );
      }
    } else if (rules.requireGeofencing) {
      return NextResponse.json(
        { error: "Geofencing is mandatory. Valid GPS coordinates are required for biometric attendance." },
        { status: 400 }
      );
    }

    let attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (resolvedType === "in") {
      // PREVENT DUPLICATE CHECK-IN
      if (attendance && attendance.checkIn) {
        return NextResponse.json({
          error: `Already punched in for today at ${new Date(attendance.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Duplicate punch prevented.`,
          attendance,
        }, { status: 400 });
      }

      const shiftStartTime = employee.shift?.startTime || rules.officeStart || "09:00";
      const gracePeriod = employee.shift?.gracePeriodMins ?? rules.gracePeriodMinutes ?? 15;
      const [sHour, sMin] = shiftStartTime.split(":").map(Number);
      const shiftThreshold = new Date(today);
      shiftThreshold.setHours(sHour, sMin + gracePeriod, 0, 0);
      const isLate = now.getTime() > shiftThreshold.getTime();

      const locationStr = latitude && longitude
        ? `Face Verified GPS: (${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)})`
        : "Face Biometric Terminal";

      if (attendance) {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkIn: now,
            checkInLocation: locationStr,
            checkInLatitude: latitude || null,
            checkInLongitude: longitude || null,
            checkInAccuracy: accuracy || null,
            checkInMode: "FACE",
            faceVerified: true,
            inGeofence,
            status: "PRESENT",
            isLate,
          },
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            date: today,
            checkIn: now,
            checkInLocation: locationStr,
            checkInLatitude: latitude || null,
            checkInLongitude: longitude || null,
            checkInAccuracy: accuracy || null,
            checkInMode: "FACE",
            faceVerified: true,
            inGeofence,
            status: "PRESENT",
            isLate,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          userName: auth.name,
          action: "FACE_CHECK_IN",
          entity: "Attendance",
          entityId: attendance.id,
          details: `Face authenticated check-in (Match Confidence: ${matchPercentage}%) at ${now.toLocaleTimeString()}`,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Face Verified (${matchPercentage}% match)! Punched in successfully at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        similarity,
        matchScore: matchPercentage,
        attendance,
      });
    } else {
      // CHECK OUT
      if (!attendance || !attendance.checkIn) {
        return NextResponse.json({
          error: "Cannot punch out without an active check-in record for today.",
        }, { status: 400 });
      }

      // PREVENT DUPLICATE CHECK-OUT
      if (attendance.checkOut) {
        return NextResponse.json({
          error: `Already punched out for today at ${new Date(attendance.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Duplicate punch prevented.`,
          attendance,
        }, { status: 400 });
      }

      const checkInTime = new Date(attendance.checkIn);
      const diffMs = now.getTime() - checkInTime.getTime();
      const rawHours = diffMs / (1000 * 60 * 60);
      const breakHours = attendance.breakHours || 1.0;
      const workHours = Math.max(0, parseFloat((rawHours - breakHours).toFixed(2)));

      const shiftEndTime = employee.shift?.endTime || "18:00";
      const [eHour, eMin] = shiftEndTime.split(":").map(Number);
      const shiftEndThreshold = new Date(today);
      shiftEndThreshold.setHours(eHour, eMin, 0, 0);
      const isEarlyExit = now.getTime() < shiftEndThreshold.getTime();
      const overtimeHours = workHours > 8 ? parseFloat((workHours - 8).toFixed(2)) : 0;

      const locationStr = latitude && longitude
        ? `Face Verified GPS: (${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)})`
        : "Face Biometric Terminal";

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: now,
          checkOutLocation: locationStr,
          checkOutLatitude: latitude || null,
          checkOutLongitude: longitude || null,
          checkOutAccuracy: accuracy || null,
          checkOutMode: "FACE",
          inGeofence,
          workHours,
          overtimeHours,
          isEarlyExit,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          userName: auth.name,
          action: "FACE_CHECK_OUT",
          entity: "Attendance",
          entityId: attendance.id,
          details: `Face authenticated check-out (Match Confidence: ${matchPercentage}%) at ${now.toLocaleTimeString()}`,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Face Verified (${matchPercentage}% match)! Punched out successfully at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        similarity,
        matchScore: matchPercentage,
        attendance,
      });
    }
  } catch (error: any) {
    console.error("POST /api/attendance/face/verify error:", error);
    return NextResponse.json({ error: "Failed to verify face attendance." }, { status: 500 });
  }
}
