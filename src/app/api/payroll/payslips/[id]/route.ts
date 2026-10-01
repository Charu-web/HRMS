import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            branch: true,
          },
        },
      },
    });

    if (!payslip) {
      return NextResponse.json({ error: "Payslip not found." }, { status: 404 });
    }

    // Role check: If regular employee, must own the payslip
    if (auth.role === "EMPLOYEE" && payslip.employeeId !== auth.employeeId) {
      return NextResponse.json({ error: "Forbidden: You may only view your own payslips." }, { status: 403 });
    }

    const assignedTemplate = payslip.templateId
      ? await prisma.salarySlipTemplate.findUnique({ where: { id: payslip.templateId } })
      : null;

    const defaultTemplate =
      assignedTemplate ||
      (await prisma.salarySlipTemplate.findFirst({
        where: { isDefault: true },
      })) ||
      (await prisma.salarySlipTemplate.findFirst());

    const company = await prisma.company.findFirst();

    return NextResponse.json({
      payslip,
      template: defaultTemplate,
      company: company || {
        name: defaultTemplate?.companyName || "Zenith Innovations Technologies Pvt Ltd",
        address: defaultTemplate?.companyAddress || "Prestige Tech Park, Outer Ring Road, Marathahalli",
        city: "Bengaluru, Karnataka 560103",
        code: "ZENITH",
      },
    });
  } catch (error: any) {
    console.error("Get payslip error:", error);
    return NextResponse.json({ error: "Failed to fetch payslip." }, { status: 500 });
  }
}
