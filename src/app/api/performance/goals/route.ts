import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cycleId, employeeId, title, description, category, weightage, dueDate } = body;

    const targetEmpId = auth.role === "EMPLOYEE" ? auth.employeeId : (employeeId || auth.employeeId);
    if (!targetEmpId) {
      return NextResponse.json({ error: "Target employee required." }, { status: 400 });
    }

    let activeCycle = cycleId;
    if (!activeCycle) {
      const currentCycle = await prisma.performanceCycle.findFirst({ where: { status: "ACTIVE" } });
      activeCycle = currentCycle?.id;
    }

    const goal = await prisma.goal.create({
      data: {
        cycleId: activeCycle,
        employeeId: targetEmpId,
        title,
        description,
        category: category || "INDIVIDUAL",
        weightage: Number(weightage) || 25,
        progress: 0,
        status: "IN_PROGRESS",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json({ success: true, goal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create goal." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, progress, status } = await req.json();
    const updated = await prisma.goal.update({
      where: { id },
      data: {
        progress: Number(progress),
        status: Number(progress) >= 100 ? "COMPLETED" : (status || "IN_PROGRESS"),
      },
    });

    return NextResponse.json({ success: true, goal: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update goal progress" }, { status: 500 });
  }
}
