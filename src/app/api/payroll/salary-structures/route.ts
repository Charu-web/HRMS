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

    // Regular employee can only view their own structure
    if (auth.role === "EMPLOYEE") {
      const structure = await prisma.salaryStructure.findUnique({
        where: { employeeId: auth.employeeId || "NONE" },
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
      });

      return NextResponse.json({
        role: "EMPLOYEE",
        structures: structure ? [structure] : [],
      });
    }

    // Admin / Manager / HR view
    const structures = await prisma.salaryStructure.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            profilePhoto: true,
            status: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { employee: { employeeCode: "asc" } },
    });

    return NextResponse.json({
      role: auth.role,
      structures,
    });
  } catch (error: any) {
    console.error("Fetch salary structures error:", error);
    return NextResponse.json({ error: "Failed to fetch salary structures." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });
    }

    const basicSalary = parseFloat(body.basicSalary) || 0;
    const hra = parseFloat(body.hra) || 0;
    const specialAllowance = parseFloat(body.specialAllowance) || 0;
    const conveyance = parseFloat(body.conveyance) || 0;
    const medicalAllowance = parseFloat(body.medicalAllowance) || 0;
    const otherAllowance = parseFloat(body.otherAllowance) || 0;
    const bonus = parseFloat(body.bonus) || 0;
    const incentives = parseFloat(body.incentives) || 0;

    const grossSalary = basicSalary + hra + specialAllowance + conveyance + medicalAllowance + otherAllowance + bonus + incentives;

    const epfEmployee = parseFloat(body.epfEmployee) || Math.round(basicSalary * 0.12);
    const esiEmployee = parseFloat(body.esiEmployee) || (grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0);
    const professionalTax = parseFloat(body.professionalTax) || 200;
    const tds = parseFloat(body.tds) || Math.round(basicSalary * 0.08);
    const loanDeduction = parseFloat(body.loanDeduction) || 0;

    const totalDeductions = epfEmployee + esiEmployee + professionalTax + tds + loanDeduction;
    const netSalary = grossSalary - totalDeductions;

    const epfEmployer = parseFloat(body.epfEmployer) || Math.round(basicSalary * 0.12);
    const esiEmployer = parseFloat(body.esiEmployer) || (grossSalary <= 21000 ? Math.round(grossSalary * 0.0325) : 0);
    const ctc = (grossSalary + epfEmployer + esiEmployer) * 12;

    const updated = await prisma.salaryStructure.upsert({
      where: { employeeId },
      update: {
        basicSalary,
        hra,
        specialAllowance,
        conveyance,
        medicalAllowance,
        otherAllowance,
        bonus,
        incentives,
        grossSalary,
        epfEmployee,
        esiEmployee,
        professionalTax,
        tds,
        loanDeduction,
        netSalary,
        epfEmployer,
        esiEmployer,
      },
      create: {
        employeeId,
        basicSalary,
        hra,
        specialAllowance,
        conveyance,
        medicalAllowance,
        otherAllowance,
        bonus,
        incentives,
        grossSalary,
        epfEmployee,
        esiEmployee,
        professionalTax,
        tds,
        loanDeduction,
        netSalary,
        epfEmployer,
        esiEmployer,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_SALARY_STRUCTURE",
        entity: "SalaryStructure",
        entityId: updated.id,
        details: `Updated salary structure for employee: Gross ₹${grossSalary.toLocaleString("en-IN")}, Net ₹${netSalary.toLocaleString("en-IN")}`,
      },
    });

    return NextResponse.json({ success: true, structure: updated });
  } catch (error: any) {
    console.error("Update salary structure error:", error);
    return NextResponse.json({ error: "Failed to update salary structure." }, { status: 500 });
  }
}
