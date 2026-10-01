import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canManageCompany: true,
    canManageEmployees: true,
    canManageAttendance: true,
    canManagePayroll: true,
    canManageLeaves: true,
    canManageSettings: true,
    canViewAuditLogs: true,
    canManageRoles: true,
  },
  ADMIN: {
    canManageCompany: true,
    canManageEmployees: true,
    canManageAttendance: true,
    canManagePayroll: true,
    canManageLeaves: true,
    canManageSettings: true,
    canViewAuditLogs: true,
    canManageRoles: false,
  },
  HR: {
    canManageCompany: false,
    canManageEmployees: true,
    canManageAttendance: true,
    canManagePayroll: true,
    canManageLeaves: true,
    canManageSettings: false,
    canViewAuditLogs: true,
    canManageRoles: false,
  },
  MANAGER: {
    canManageCompany: false,
    canManageEmployees: false,
    canManageAttendance: true,
    canManagePayroll: false,
    canManageLeaves: true,
    canManageSettings: false,
    canViewAuditLogs: false,
    canManageRoles: false,
  },
  EMPLOYEE: {
    canManageCompany: false,
    canManageEmployees: false,
    canManageAttendance: false,
    canManagePayroll: false,
    canManageLeaves: false,
    canManageSettings: false,
    canViewAuditLogs: false,
    canManageRoles: false,
  },
};

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "roles_permissions" },
    });
    const parsed = setting ? JSON.parse(setting.value) : DEFAULT_ROLE_PERMISSIONS;
    return NextResponse.json({ rolePermissions: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch role permissions" }, { status: 500 });
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
      where: { key: "roles_permissions" },
      update: {
        value: JSON.stringify(body),
        category: "SECURITY",
      },
      create: {
        category: "SECURITY",
        key: "roles_permissions",
        value: JSON.stringify(body),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_ROLE_PERMISSIONS",
        entity: "SystemSetting",
        entityId: setting.id,
        details: "Updated role-based access matrix and permission boundaries.",
      },
    });

    return NextResponse.json({ success: true, rolePermissions: JSON.parse(setting.value) });
  } catch (error: any) {
    console.error("PUT /api/settings/roles error:", error);
    return NextResponse.json({ error: "Failed to update role permissions." }, { status: 500 });
  }
}
