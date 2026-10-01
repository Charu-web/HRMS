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

    const users = await prisma.user.findMany({ select: { role: true } });
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });

    const roles = [
      {
        id: "SUPER_ADMIN",
        name: "Super Admin",
        description: "Full, unrestricted administrative authority across the entire organization, settings, and database.",
        userCount: counts["SUPER_ADMIN"] || 0,
      },
      {
        id: "ADMIN",
        name: "HR / Admin",
        description: "Comprehensive management of employees, payroll, attendance, leaves, announcements, and compliance.",
        userCount: counts["ADMIN"] || 0,
      },
      {
        id: "HR",
        name: "HR Executive",
        description: "Talent acquisition, candidate pipelines, onboarding assistance, and employee record maintenance.",
        userCount: counts["HR"] || 0,
      },
      {
        id: "MANAGER",
        name: "Reporting Manager",
        description: "Team management, leave approvals, attendance regularizations, expense sign-offs, and performance evaluations.",
        userCount: counts["MANAGER"] || 0,
      },
      {
        id: "EMPLOYEE",
        name: "Standard Employee",
        description: "Self-service portal for attendance check-ins, leave requests, payslip access, documents, and reimbursements.",
        userCount: counts["EMPLOYEE"] || 0,
      },
    ];

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("GET /api/roles error:", error);
    return NextResponse.json({ error: "Failed to fetch roles." }, { status: 500 });
  }
}
