import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: role } = params;
    const permissions = await prisma.rolePermission.findMany({
      where: { role },
      orderBy: { module: "asc" },
    });
    return NextResponse.json({ permissions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch role permissions" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const { id: role } = params;
    const body = await req.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "Permissions array required." }, { status: 400 });
    }

    for (const p of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_module: {
            role,
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
          role,
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

    const updated = await prisma.rolePermission.findMany({
      where: { role },
      orderBy: { module: "asc" },
    });

    return NextResponse.json({ success: true, permissions: updated });
  } catch (error) {
    console.error("PUT /api/roles/[id]/permissions error:", error);
    return NextResponse.json({ error: "Failed to update role permissions." }, { status: 500 });
  }
}
