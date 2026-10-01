import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function calculateEuclideanDistance(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) return 999;
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || !auth.employeeId) {
      return NextResponse.json({ error: "Unauthorized or no employee profile linked." }, { status: 401 });
    }

    const body = await req.json();
    const { faceDescriptor, type = "in", latitude, longitude, accuracy } = body;

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

    let enrolledVec: number[] = [];
    let liveVec: number[] = [];
    try {
      enrolledVec = typeof enrollment.faceDescriptor === "string" ? JSON.parse(enrollment.faceDescriptor) : enrollment.faceDescriptor;
      liveVec = typeof faceDescriptor === "string" ? JSON.parse(faceDescriptor) : faceDescriptor;
    } catch {
      return NextResponse.json({ error: "Malformed biometric descriptor vector." }, { status: 400 });
    }

    // Perform vector distance and similarity checks
    const distance = calculateEuclideanDistance(liveVec, enrolledVec);
    const similarity = calculateCosineSimilarity(liveVec, enrolledVec);

    // Standard face verification thresholds (Euclidean < 0.6 or Cosine similarity > 0.80)
    const isMatch = distance < 0.65 || similarity > 0.78;

    if (!isMatch) {
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          userName: auth.name,
          action: "FACE_VERIFICATION_FAILED",
          entity: "Attendance",
          details: `Biometric face mismatch (distance: ${distance.toFixed(3)}, similarity: ${(similarity * 100).toFixed(1)}%)`,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      return NextResponse.json({
        error: `Face verification failed. Match score (${(similarity * 100).toFixed(1)}%) was below the required security confidence threshold.`,
        similarity,
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

    // Check geofence rules
    const attendanceRuleSetting = await prisma.systemSetting.findUnique({
      where: { key: "attendance_rules" },
    });
    let rules: any = {};
    if (attendanceRuleSetting?.value) {
      try {
        rules = JSON.parse(attendanceRuleSetting.value);
      } catch (e) {}
    }

    let inGeofence = true;
    if (latitude && longitude) {
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
        { error: "Geofencing is mandatory. GPS location coordinates are required for attendance." },
        { status: 400 }
      );
    }

    let attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (type === "in") {
      if (attendance && attendance.checkIn) {
        return NextResponse.json({ error: "Already punched in for today.", attendance }, { status: 400 });
      }

      const shiftStartTime = employee.shift?.startTime || "09:00";
      const gracePeriod = employee.shift?.gracePeriodMins ?? 15;
      const [sHour, sMin] = shiftStartTime.split(":").map(Number);
      const shiftThreshold = new Date(today);
      shiftThreshold.setHours(sHour, sMin + gracePeriod, 0, 0);
      const isLate = now.getTime() > shiftThreshold.getTime();

      const locationStr = latitude && longitude ? `Face Verified GPS: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : "Face Recognition Terminal";

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
          details: `Face authenticated check-in (Confidence: ${(similarity * 100).toFixed(1)}%) at ${now.toLocaleTimeString()}`,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Face Verified! Punched in successfully at ${now.toLocaleTimeString()}`,
        similarity,
        attendance,
      });
    } else {
      // CHECK OUT
      if (!attendance || !attendance.checkIn) {
        return NextResponse.json({ error: "Cannot check out without an active check-in record." }, { status: 400 });
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

      const locationStr = latitude && longitude ? `Face Verified GPS: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : "Face Recognition Terminal";

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
          details: `Face authenticated check-out (Confidence: ${(similarity * 100).toFixed(1)}%) at ${now.toLocaleTimeString()}`,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Face Verified! Punched out successfully at ${now.toLocaleTimeString()}`,
        similarity,
        attendance,
      });
    }
  } catch (error: any) {
    console.error("POST /api/attendance/face/verify error:", error);
    return NextResponse.json({ error: "Failed to verify face attendance." }, { status: 500 });
  }
}
