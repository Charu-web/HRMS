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
      where: { key: "payroll_config" },
    });
    const parsed = setting ? JSON.parse(setting.value) : {};
    return NextResponse.json({ payroll: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payroll settings" }, { status: 500 });
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
      where: { key: "payroll_config" },
      update: {
        value: JSON.stringify(body),
        category: "PAYROLL",
      },
      create: {
        category: "PAYROLL",
        key: "payroll_config",
        value: JSON.stringify(body),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_PAYROLL_SETTINGS",
        entity: "SystemSetting",
        entityId: setting.id,
        details: "Updated enterprise payroll calculation parameters, EPF thresholds, and pay cycle settings.",
      },
    });

    return NextResponse.json({ success: true, payroll: JSON.parse(setting.value) });
  } catch (error: any) {
    console.error("PUT /api/settings/payroll error:", error);
    return NextResponse.json({ error: "Failed to update payroll settings." }, { status: 500 });
  }
}
