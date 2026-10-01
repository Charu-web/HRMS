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

    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { daysAllowed: "desc" },
    });
    return NextResponse.json({ leaveTypes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leave types" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, daysAllowed, isPaid, carryForward, description, color } = body;
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        daysAllowed: Number(daysAllowed) || 12,
        isPaid: isPaid !== undefined ? !!isPaid : true,
        carryForward: !!carryForward,
        description: description || null,
        color: color || "#3B82F6",
      },
    });

    return NextResponse.json({ success: true, leaveType }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/leaves/types error:", error);
    return NextResponse.json({ error: "Failed to create leave type." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, code, daysAllowed, isPaid, carryForward, description, color } = body;
    if (!id) {
      return NextResponse.json({ error: "Leave type ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code.toUpperCase().trim();
    if (daysAllowed !== undefined) updateData.daysAllowed = Number(daysAllowed);
    if (isPaid !== undefined) updateData.isPaid = Boolean(isPaid);
    if (carryForward !== undefined) updateData.carryForward = Boolean(carryForward);
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;

    const updated = await prisma.leaveType.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, leaveType: updated });
  } catch (error: any) {
    console.error("PUT /api/leaves/types error:", error);
    return NextResponse.json({ error: "Failed to update leave type." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Leave type ID is required." }, { status: 400 });
    }

    // Check if any leave requests reference this type
    const requestCount = await prisma.leaveRequest.count({
      where: { leaveTypeId: id },
    });

    if (requestCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${requestCount} employee leave requests are associated with this leave type. Consider deactivating or updating instead.` },
        { status: 400 }
      );
    }

    // Delete associated balances if any
    await prisma.leaveBalance.deleteMany({
      where: { leaveTypeId: id },
    });

    await prisma.leaveType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Leave type deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/leaves/types error:", error);
    return NextResponse.json({ error: "Failed to delete leave type." }, { status: 500 });
  }
}
