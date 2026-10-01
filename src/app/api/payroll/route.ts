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
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    // Strict access restriction: Regular employees only see their own payslips
    if (auth.role === "EMPLOYEE") {
      const payslips = await prisma.payslip.findMany({
        where: {
          employeeId: auth.employeeId || "NONE",
          ...(month ? { month } : {}),
          ...(year ? { year } : {}),
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });

      const salaryStructure = await prisma.salaryStructure.findUnique({
        where: { employeeId: auth.employeeId || "NONE" },
      });

      return NextResponse.json({
        role: "EMPLOYEE",
        payslips,
        salaryStructure,
      });
    }

    // Admin / Manager view
    const payrollMonths = await prisma.payrollMonth.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const payslips = await prisma.payslip.findMany({
      where: {
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            profilePhoto: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            bankName: true,
            accountNumber: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { employee: { employeeCode: "asc" } }],
    });

    // Company-wide stats
    let totalDisbursed = 0;
    let totalTaxDeducted = 0;
    let totalPFOriented = 0;

    payslips.forEach((p) => {
      totalDisbursed += p.netSalary;
      totalTaxDeducted += p.tdsDeduction;
      totalPFOriented += p.epfDeduction;
    });

    return NextResponse.json({
      role: auth.role,
      payrollMonths,
      payslips,
      stats: {
        totalDisbursed,
        totalTaxDeducted,
        totalPFOriented,
        totalEmployeesProcessed: payslips.length,
      },
    });
  } catch (error: any) {
    console.error("Payroll API error:", error);
    return NextResponse.json({ error: "Failed to fetch payroll data." }, { status: 500 });
  }
}
