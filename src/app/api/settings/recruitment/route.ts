import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "recruitment_settings" },
    });
    const parsed = setting
      ? JSON.parse(setting.value)
      : {
          requireApprovalForJobPostings: true,
          defaultInterviewDurationMinutes: 45,
          sendCandidateStatusEmails: true,
          pipelineStages: ["APPLIED", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"],
          allowEmployeeReferrals: true,
          referralBonusAmount: 10000,
        };
    return NextResponse.json({ recruitmentSettings: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recruitment settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const setting = await prisma.systemSetting.upsert({
      where: { key: "recruitment_settings" },
      update: {
        value: JSON.stringify(body),
        category: "RECRUITMENT",
      },
      create: {
        category: "RECRUITMENT",
        key: "recruitment_settings",
        value: JSON.stringify(body),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_RECRUITMENT_SETTINGS",
        entity: "SystemSetting",
        entityId: setting.id,
        details: "Updated recruitment workflow settings and hiring pipeline configurations.",
      },
    });

    return NextResponse.json({ success: true, recruitmentSettings: JSON.parse(setting.value) });
  } catch (error: any) {
    console.error("PUT /api/settings/recruitment error:", error);
    return NextResponse.json({ error: "Failed to update recruitment settings." }, { status: 500 });
  }
}
