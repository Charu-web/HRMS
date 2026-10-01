import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR" && auth.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Recruiter access required." }, { status: 403 });
    }

    const { id } = params;
    const { status, stageNotes, rating } = await req.json();

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(stageNotes !== undefined ? { stageNotes } : {}),
        ...(rating !== undefined ? { rating: Number(rating) } : {}),
      },
    });

    return NextResponse.json({ success: true, candidate: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const { id } = params;

    // Delete associated interview schedules first if any
    await prisma.interview.deleteMany({
      where: { candidateId: id },
    });

    await prisma.candidate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Candidate application deleted." });
  } catch (error) {
    console.error("DELETE /api/recruitment/candidates/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
