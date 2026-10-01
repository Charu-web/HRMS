import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { employeeId, faceDescriptor, photoUrl, consentGiven } = body;

    const targetEmployeeId = (auth.role === "ADMIN" || auth.role === "SUPER_ADMIN" || auth.role === "HR") && employeeId
      ? employeeId
      : auth.employeeId;

    if (!targetEmployeeId) {
      return NextResponse.json({ error: "Employee identifier is required." }, { status: 400 });
    }

    if (!consentGiven) {
      return NextResponse.json({ error: "Biometric enrollment requires employee explicit consent." }, { status: 400 });
    }

    if (!faceDescriptor || (Array.isArray(faceDescriptor) && faceDescriptor.length < 10)) {
      return NextResponse.json({ error: "Valid biometric face descriptor points are required." }, { status: 400 });
    }

    const descriptorString = typeof faceDescriptor === "string"
      ? faceDescriptor
      : JSON.stringify(faceDescriptor);

    const enrollment = await prisma.faceEnrollment.upsert({
      where: { employeeId: targetEmployeeId },
      update: {
        faceDescriptor: descriptorString,
        photoUrl: photoUrl || null,
        consentGiven: true,
        consentTimestamp: new Date(),
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        employeeId: targetEmployeeId,
        faceDescriptor: descriptorString,
        photoUrl: photoUrl || null,
        consentGiven: true,
        consentTimestamp: new Date(),
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "ENROLL_FACE_BIOMETRIC",
        entity: "FaceEnrollment",
        entityId: enrollment.id,
        details: `Enrolled facial biometric signature for employee ID: ${targetEmployeeId}`,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Facial biometric profile enrolled successfully.",
      enrollment: {
        id: enrollment.id,
        employeeId: enrollment.employeeId,
        consentTimestamp: enrollment.consentTimestamp,
        enrolledAt: enrollment.enrolledAt,
      },
    });
  } catch (error: any) {
    console.error("POST /api/attendance/face/enroll error:", error);
    return NextResponse.json({ error: "Failed to enroll facial biometric profile." }, { status: 500 });
  }
}
