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

    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");

    let targetEmployeeId: string | null | undefined = employeeIdParam;
    if (auth.role === "EMPLOYEE") {
      targetEmployeeId = auth.employeeId;
    }

    const cycles = await prisma.performanceCycle.findMany({
      orderBy: { startDate: "desc" },
    });

    const goalsWhere: any = {};
    if (targetEmployeeId && targetEmployeeId !== "ALL") {
      goalsWhere.employeeId = targetEmployeeId;
    }

    const goals = await prisma.goal.findMany({
      where: goalsWhere,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        cycle: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const reviewsWhere: any = {};
    if (targetEmployeeId && targetEmployeeId !== "ALL") {
      reviewsWhere.employeeId = targetEmployeeId;
    }

    const reviews = await prisma.performanceReview.findMany({
      where: reviewsWhere,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        cycle: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cycles, goals, reviews });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cycleId, employeeId, selfRating, managerRating, selfFeedback, managerFeedback, status } = body;

    // Determine target employee
    const targetEmployeeId = (auth.role === "ADMIN" || auth.role === "MANAGER" || auth.role === "HR") && employeeId
      ? employeeId
      : auth.employeeId;

    if (!targetEmployeeId) {
      return NextResponse.json({ error: "Target employee identifier required." }, { status: 400 });
    }

    // Default cycle if not provided
    let targetCycleId = cycleId;
    if (!targetCycleId) {
      const activeCycle = await prisma.performanceCycle.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      });
      if (!activeCycle) {
        // Create or find any cycle
        const anyCycle = await prisma.performanceCycle.findFirst();
        if (anyCycle) {
          targetCycleId = anyCycle.id;
        } else {
          const newCycle = await prisma.performanceCycle.create({
            data: {
              title: "Annual Review Cycle 2026",
              year: new Date().getFullYear(),
              startDate: new Date(),
              endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              status: "ACTIVE",
            },
          });
          targetCycleId = newCycle.id;
        }
      } else {
        targetCycleId = activeCycle.id;
      }
    }

    // Upsert performance review
    const review = await prisma.performanceReview.create({
      data: {
        cycleId: targetCycleId,
        employeeId: targetEmployeeId,
        reviewerId: auth.role === "EMPLOYEE" ? null : auth.employeeId || null,
        selfRating: selfRating ? Number(selfRating) : null,
        managerRating: managerRating ? Number(managerRating) : null,
        finalRating: managerRating ? Number(managerRating) : (selfRating ? Number(selfRating) : 4.0),
        selfFeedback: selfFeedback || null,
        managerFeedback: managerFeedback || null,
        status: status || (managerRating ? "COMPLETED" : "SUBMITTED"),
        completedAt: managerRating ? new Date() : null,
      },
      include: {
        employee: true,
        cycle: true,
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/performance error:", error);
    return NextResponse.json({ error: "Failed to submit performance review." }, { status: 500 });
  }
}
