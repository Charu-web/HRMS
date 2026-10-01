import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await prisma.rolePermission.findMany({
      orderBy: [{ role: "asc" }, { module: "asc" }],
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("GET /api/permissions error:", error);
    return NextResponse.json({ error: "Failed to fetch permissions." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { permissions } = body; // Array of { role, module, canView, canCreate, canEdit, canDelete, canApprove, canExport }

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "Permissions array required." }, { status: 400 });
    }

    for (const p of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_module: {
            role: p.role,
            module: p.module,
          },
        },
        update: {
          canView: !!p.canView,
          canCreate: !!p.canCreate,
          canEdit: !!p.canEdit,
          canDelete: !!p.canDelete,
          canApprove: !!p.canApprove,
          canExport: !!p.canExport,
        },
        create: {
          role: p.role,
          module: p.module,
          canView: !!p.canView,
          canCreate: !!p.canCreate,
          canEdit: !!p.canEdit,
          canDelete: !!p.canDelete,
          canApprove: !!p.canApprove,
          canExport: !!p.canExport,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_PERMISSIONS_MATRIX",
        entity: "RolePermission",
        details: `Updated ${permissions.length} RBAC permission matrix rules.`,
      },
    });

    const updated = await prisma.rolePermission.findMany({
      orderBy: [{ role: "asc" }, { module: "asc" }],
    });

    return NextResponse.json({ success: true, permissions: updated });
  } catch (error) {
    console.error("PUT /api/permissions error:", error);
    return NextResponse.json({ error: "Failed to update permissions." }, { status: 500 });
  }
}
