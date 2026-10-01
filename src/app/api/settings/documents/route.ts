import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "document_settings" },
    });
    const parsed = setting
      ? JSON.parse(setting.value)
      : {
          allowedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"],
          maxFileSizeMb: 10,
          mandatoryEmployeeDocs: ["Aadhaar Card", "PAN Card", "Educational Certificates", "Relieving Letter"],
          enableExpiryReminders: true,
          expiryReminderDaysNotice: 30,
        };
    return NextResponse.json({ documentSettings: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch document settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const setting = await prisma.systemSetting.upsert({
      where: { key: "document_settings" },
      update: {
        value: JSON.stringify(body),
        category: "DOCUMENTS",
      },
      create: {
        category: "DOCUMENTS",
        key: "document_settings",
        value: JSON.stringify(body),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_DOCUMENT_SETTINGS",
        entity: "SystemSetting",
        entityId: setting.id,
        details: "Updated document management compliance policies and file upload thresholds.",
      },
    });

    return NextResponse.json({ success: true, documentSettings: JSON.parse(setting.value) });
  } catch (error: any) {
    console.error("PUT /api/settings/documents error:", error);
    return NextResponse.json({ error: "Failed to update document settings." }, { status: 500 });
  }
}
