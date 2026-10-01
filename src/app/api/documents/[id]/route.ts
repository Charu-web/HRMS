import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Role check: non-admin employee can only see their own docs or company docs
    if (auth.role === "EMPLOYEE" && !document.isCompanyDoc && document.employeeId !== auth.employeeId) {
      return NextResponse.json({ error: "Forbidden: You may not access this document." }, { status: 403 });
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager access required." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { verificationStatus, remarks } = body;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        verificationStatus: verificationStatus || document.verificationStatus,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "VERIFY_DOCUMENT",
        entity: "Document",
        entityId: id,
        details: `Document ${document.title} status updated to ${verificationStatus}`,
      },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Only Admin or document owner can delete
    if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && document.employeeId !== auth.employeeId) {
      return NextResponse.json({ error: "Forbidden: You cannot delete this document." }, { status: 403 });
    }

    await prisma.document.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "DELETE_DOCUMENT",
        entity: "Document",
        entityId: id,
        details: `Deleted document ${document.title}`,
      },
    });

    return NextResponse.json({ success: true, message: "Document deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
