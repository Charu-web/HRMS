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
      where: { key: "security_policy" },
    });
    const parsed = setting ? JSON.parse(setting.value) : {};
    return NextResponse.json({ security: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch security settings" }, { status: 500 });
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
      where: { key: "security_policy" },
      update: {
        value: JSON.stringify(body),
        category: "SECURITY",
      },
      create: {
        category: "SECURITY",
        key: "security_policy",
        value: JSON.stringify(body),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_SECURITY_SETTINGS",
        entity: "SystemSetting",
        entityId: setting.id,
        details: "Updated enterprise password requirements, lockout policies, and session timeout limits.",
      },
    });

    return NextResponse.json({ success: true, security: JSON.parse(setting.value) });
  } catch (error: any) {
    console.error("PUT /api/settings/security error:", error);
    return NextResponse.json({ error: "Failed to update security settings." }, { status: 500 });
  }
}
