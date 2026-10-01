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
      where: { key: "leave_policies" },
    });
    const parsed = setting ? JSON.parse(setting.value) : {};
    return NextResponse.json({ leave: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leave settings" }, { status: 500 });
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
      where: { key: "leave_policies" },
      update: {
        value: JSON.stringify(body),
        category: "LEAVE",
      },
      create: {
        category: "LEAVE",
        key: "leave_policies",
        value: JSON.stringify(body),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_LEAVE_SETTINGS",
        entity: "SystemSetting",
        entityId: setting.id,
        details: "Updated leave policies, accruals, and carry-forward limits.",
      },
    });

    return NextResponse.json({ success: true, leave: JSON.parse(setting.value) });
  } catch (error: any) {
    console.error("PUT /api/settings/leave error:", error);
    return NextResponse.json({ error: "Failed to update leave settings." }, { status: 500 });
  }
}
