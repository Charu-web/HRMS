import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const job = await prisma.jobOpening.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        candidates: {
          orderBy: { appliedDate: "desc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job opening not found." }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch job opening" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR" && auth.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Recruiter access required." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, departmentId, designationId, openingsCount, experienceYears, location, employmentType, description, requirements, status } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (departmentId) updateData.departmentId = departmentId;
    if (designationId !== undefined) updateData.designationId = designationId || null;
    if (openingsCount !== undefined) updateData.openingsCount = Number(openingsCount);
    if (experienceYears !== undefined) updateData.experienceYears = experienceYears;
    if (location !== undefined) updateData.location = location;
    if (employmentType !== undefined) updateData.employmentType = employmentType;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (status) updateData.status = status;

    const updated = await prisma.jobOpening.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, job: updated });
  } catch (error) {
    console.error("PUT /api/recruitment/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to update job opening" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id } = params;

    // Check if candidates are applied
    const candidateCount = await prisma.candidate.count({
      where: { jobOpeningId: id },
    });

    if (candidateCount > 0) {
      // Instead of hard deleting, close the job to preserve candidate records
      const closed = await prisma.jobOpening.update({
        where: { id },
        data: { status: "CLOSED" },
      });
      return NextResponse.json({
        success: true,
        message: `Job closed. Preserved ${candidateCount} applicant records.`,
        job: closed,
      });
    }

    await prisma.jobOpening.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Job opening deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/recruitment/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete job opening" }, { status: 500 });
  }
}
