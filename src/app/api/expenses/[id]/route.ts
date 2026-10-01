import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "MANAGER" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Manager or Admin access required." }, { status: 403 });
    }

    const { id } = params;
    const { status, reviewerRemarks } = await req.json();

    if (!["APPROVED", "REJECTED", "REIMBURSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const claim = await prisma.expenseClaim.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status,
        reviewerRemarks,
        reimbursedAt: status === "REIMBURSED" ? new Date() : claim.reimbursedAt,
      },
    });

    // Notify employee
    if (claim.employee.userId) {
      await prisma.notification.create({
        data: {
          userId: claim.employee.userId,
          title: `Expense Claim ${status}`,
          message: `Your claim for "${claim.title}" (₹${claim.amount}) has been ${status.toLowerCase()}.`,
          type: "EXPENSE",
          linkUrl: "/expenses",
        },
      });
    }

    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update expense claim" }, { status: 500 });
  }
}
