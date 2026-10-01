import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const jobs = await prisma.jobOpening.findMany({
      include: {
        department: true,
        designation: true,
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { postedDate: "desc" },
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch job openings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager access required." }, { status: 403 });
    }

    const body = await req.json();
    const { title, departmentId, designationId, openingsCount, experienceYears, location, employmentType, description, requirements } = body;

    const job = await prisma.jobOpening.create({
      data: {
        title,
        departmentId,
        designationId: designationId || null,
        openingsCount: Number(openingsCount) || 1,
        experienceYears: experienceYears || "2-4 years",
        location: location || "Headquarters",
        employmentType: employmentType || "FULL_TIME",
        description,
        requirements,
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create job opening" }, { status: 500 });
  }
}
