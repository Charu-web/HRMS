import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const status = searchParams.get("status") || "";
    const branchId = searchParams.get("branchId") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeCode: { contains: search } },
      ];
    }

    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (branchId && branchId !== "ALL") {
      where.branchId = branchId;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        designation: true,
        branch: true,
        shift: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        salaryStructure: {
          select: {
            netSalary: true,
            grossSalary: true,
          },
        },
      },
      orderBy: { employeeCode: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error("Get employees error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const data = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      dateOfBirth,
      joiningDate,
      departmentId,
      designationId,
      branchId,
      shiftId,
      managerId,
      employmentType,
      workLocation,
      address,
      city,
      state,
      postalCode,
      bankName,
      accountNumber,
      ifscCode,
      panNumber,
      uanNumber,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactPhone,
      basicSalary,
      createUserAccount,
      password,
      role = "EMPLOYEE",
    } = data;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "First name, last name, and email are required." }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await prisma.employee.findFirst({
      where: { OR: [{ email }, { user: { email } }] },
    });
    if (existing) {
      return NextResponse.json({ error: "An employee with this email already exists." }, { status: 400 });
    }

    // Auto-generate employee code if needed
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { employeeCode: "desc" },
    });
    let nextCode = "EMP-1033";
    if (lastEmployee && lastEmployee.employeeCode.startsWith("EMP-")) {
      const num = parseInt(lastEmployee.employeeCode.replace("EMP-", ""), 10);
      if (!isNaN(num)) {
        nextCode = `EMP-${num + 1}`;
      }
    }

    let createdUser = null;
    if (createUserAccount !== false) {
      const defaultHash = await hashPassword(password || "Employee@123");
      createdUser = await prisma.user.create({
        data: {
          email,
          passwordHash: defaultHash,
          role,
        },
      });
    }

    const newEmployee = await prisma.employee.create({
      data: {
        employeeCode: nextCode,
        firstName,
        lastName,
        profilePhoto: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 5000)}?w=150&h=150&fit=crop&crop=face`,
        gender: gender || "Other",
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        departmentId: departmentId || null,
        designationId: designationId || null,
        branchId: branchId || null,
        shiftId: shiftId || null,
        managerId: managerId || null,
        employmentType: employmentType || "FULL_TIME",
        workLocation: workLocation || "OFFICE",
        bankName,
        accountNumber,
        ifscCode,
        panNumber,
        uanNumber,
        emergencyContactName,
        emergencyContactRelation,
        emergencyContactPhone,
        userId: createdUser ? createdUser.id : null,
      },
    });

    // Create default Salary Structure
    const base = Number(basicSalary) || 45000;
    const hra = Math.round(base * 0.5);
    const special = Math.round(base * 0.3);
    const conveyance = 2000;
    const medical = 1500;
    const epf = 1800;
    const pt = 200;
    const tds = Math.round(base * 0.08);
    const gross = base + hra + special + conveyance + medical;
    const net = gross - (epf + pt + tds);

    await prisma.salaryStructure.create({
      data: {
        employeeId: newEmployee.id,
        basicSalary: base,
        hra,
        specialAllowance: special,
        conveyance,
        medicalAllowance: medical,
        epfEmployee: epf,
        epfEmployer: epf,
        professionalTax: pt,
        tds,
        grossSalary: gross,
        netSalary: net,
      },
    });

    // Create default Leave Balances
    const leaveTypes = await prisma.leaveType.findMany();
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: newEmployee.id,
          leaveTypeId: lt.id,
          year: new Date().getFullYear(),
          allocatedDays: lt.daysAllowed,
          usedDays: 0,
          pendingDays: 0,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "CREATE_EMPLOYEE",
        entity: "Employee",
        entityId: newEmployee.id,
        details: `Created new employee ${newEmployee.firstName} ${newEmployee.lastName} (${newEmployee.employeeCode})`,
      },
    });

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 });
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
