import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobOpeningId");

    const where: any = {};
    if (jobId && jobId !== "ALL") {
      where.jobOpeningId = jobId;
    }

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        jobOpening: {
          select: {
            id: true,
            title: true,
            department: { select: { name: true } },
          },
        },
        interviews: {
          orderBy: { scheduledAt: "asc" },
        },
      },
      orderBy: { appliedDate: "desc" },
    });

    // Group by pipeline stages
    const pipelineStages = ["APPLIED", "SCREENING", "INTERVIEW", "SELECTED", "OFFERED", "JOINED", "REJECTED"];
    const kanban: Record<string, any[]> = {};
    pipelineStages.forEach((stage) => {
      kanban[stage] = candidates.filter((c) => c.status === stage);
    });

    return NextResponse.json({ candidates, kanban });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobOpeningId, fullName, email, phone, currentCompany, currentCtc, expectedCtc, noticePeriodDays } = body;

    const candidate = await prisma.candidate.create({
      data: {
        jobOpeningId,
        fullName,
        email,
        phone,
        currentCompany,
        currentCtc: currentCtc ? Number(currentCtc) : null,
        expectedCtc: expectedCtc ? Number(expectedCtc) : null,
        noticePeriodDays: noticePeriodDays ? Number(noticePeriodDays) : 30,
        status: "APPLIED",
        rating: 4,
      },
    });

    return NextResponse.json({ success: true, candidate }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add candidate" }, { status: 500 });
  }
}
