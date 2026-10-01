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
      where: { key: "employee_settings" },
    });
    const parsed = setting
      ? JSON.parse(setting.value)
      : {
          codePrefix: "EMP",
          codeDigits: 4,
          defaultProbationMonths: 3,
          defaultNoticePeriodDays: 30,
          requireAadhaar: true,
          requirePan: true,
          requireEmergencyContact: true,
          allowSelfProfileEdit: true,
        };
    return NextResponse.json({ employeeSettings: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch employee settings" }, { status: 500 });
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
      where: { key: "employee_settings" },
      update: {
        value: JSON.stringify(body),
        category: "EMPLOYEE",
      },
      create: {
        category: "EMPLOYEE",
        key: "employee_settings",
        value: JSON.stringify(body),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_EMPLOYEE_SETTINGS",
        entity: "SystemSetting",
        entityId: setting.id,
        details: "Updated employee management rules, onboarding defaults, and code patterns.",
      },
    });

    return NextResponse.json({ success: true, employeeSettings: JSON.parse(setting.value) });
  } catch (error: any) {
    console.error("PUT /api/settings/employee error:", error);
    return NextResponse.json({ error: "Failed to update employee settings." }, { status: 500 });
  }
}
