import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const where: any = {};
    if (auth.role === "EMPLOYEE") {
      where.employeeId = auth.employeeId;
    } else if (auth.role === "MANAGER") {
      where.OR = [
        { employeeId: auth.employeeId },
        { employee: { managerId: auth.employeeId } },
      ];
    }

    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    }

    const expenses = await prisma.expenseClaim.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            profilePhoto: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalPending = 0;
    let totalApproved = 0;
    let totalReimbursed = 0;

    expenses.forEach((e) => {
      if (e.status === "PENDING") totalPending += e.amount;
      if (e.status === "APPROVED") totalApproved += e.amount;
      if (e.status === "REIMBURSED") totalReimbursed += e.amount;
    });

    return NextResponse.json({
      expenses,
      summary: {
        totalClaims: expenses.length,
        totalPending,
        totalApproved,
        totalReimbursed,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || !auth.employeeId) {
      return NextResponse.json({ error: "Unauthorized or no employee profile linked." }, { status: 401 });
    }

    const body = await req.json();
    const { title, category, amount, description, receiptUrl } = body;

    if (!title || !category || !amount || !description) {
      return NextResponse.json({ error: "Title, category, amount, and description are required." }, { status: 400 });
    }

    const newExpense = await prisma.expenseClaim.create({
      data: {
        employeeId: auth.employeeId,
        title,
        category,
        amount: parseFloat(amount),
        description,
        receiptUrl: receiptUrl || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
        status: "PENDING",
      },
    });

    // Notify manager
    const emp = await prisma.employee.findUnique({
      where: { id: auth.employeeId },
      include: { manager: true },
    });

    if (emp?.manager?.userId) {
      await prisma.notification.create({
        data: {
          userId: emp.manager.userId,
          title: "New Expense Claim Submitted",
          message: `${emp.firstName} ${emp.lastName} submitted an expense claim of ₹${amount} for ${title}.`,
          type: "EXPENSE",
          linkUrl: "/expenses",
        },
      });
    }

    return NextResponse.json({ success: true, expense: newExpense }, { status: 201 });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Failed to submit expense claim." }, { status: 500 });
  }
}
