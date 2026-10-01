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

    // RBAC: regular employee can only access their own profile unless ADMIN or MANAGER
    if (auth.role === "EMPLOYEE" && auth.employeeId !== id) {
      return NextResponse.json({ error: "Forbidden: You may only view your own profile." }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
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
            employeeCode: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: { select: { name: true } },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        salaryStructure: true,
        payslips: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
        },
        leaveBalances: {
          include: {
            leaveType: true,
          },
        },
        leaveRequests: {
          include: {
            leaveType: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 31,
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        goals: {
          include: {
            cycle: true,
          },
          orderBy: { createdAt: "desc" },
        },
        performanceReviews: {
          include: {
            cycle: true,
            reviewer: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        expenseClaims: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    // Recent activity audit logs
    const activities = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: employee.id },
          { userId: employee.userId || "NONE" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    return NextResponse.json({ employee, activities });
  } catch (error: any) {
    console.error("Get employee details error:", error);
    return NextResponse.json({ error: "Failed to fetch employee details." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.employeeId !== params.id)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    // If employee updating self, only allow personal info
    const isSelfUpdate = auth.role === "EMPLOYEE" && auth.employeeId === id;

    const allowedData: any = {};
    if (body.firstName && !isSelfUpdate) allowedData.firstName = body.firstName;
    if (body.lastName && !isSelfUpdate) allowedData.lastName = body.lastName;
    if (body.phone !== undefined) allowedData.phone = body.phone;
    if (body.alternatePhone !== undefined) allowedData.alternatePhone = body.alternatePhone;
    if (body.address !== undefined) allowedData.address = body.address;
    if (body.city !== undefined) allowedData.city = body.city;
    if (body.state !== undefined) allowedData.state = body.state;
    if (body.country !== undefined) allowedData.country = body.country;
    if (body.postalCode !== undefined) allowedData.postalCode = body.postalCode;
    if (body.emergencyContactName !== undefined) allowedData.emergencyContactName = body.emergencyContactName;
    if (body.emergencyContactRelation !== undefined) allowedData.emergencyContactRelation = body.emergencyContactRelation;
    if (body.emergencyContactPhone !== undefined) allowedData.emergencyContactPhone = body.emergencyContactPhone;

    // Admin-only fields
    if (!isSelfUpdate) {
      if (body.departmentId !== undefined) allowedData.departmentId = body.departmentId || null;
      if (body.designationId !== undefined) allowedData.designationId = body.designationId || null;
      if (body.branchId !== undefined) allowedData.branchId = body.branchId || null;
      if (body.shiftId !== undefined) allowedData.shiftId = body.shiftId || null;
      if (body.managerId !== undefined) allowedData.managerId = body.managerId || null;
      if (body.employmentType !== undefined) allowedData.employmentType = body.employmentType;
      if (body.workLocation !== undefined) allowedData.workLocation = body.workLocation;
      if (body.status !== undefined) allowedData.status = body.status;
      if (body.bankName !== undefined) allowedData.bankName = body.bankName;
      if (body.accountNumber !== undefined) allowedData.accountNumber = body.accountNumber;
      if (body.ifscCode !== undefined) allowedData.ifscCode = body.ifscCode;
      if (body.panNumber !== undefined) allowedData.panNumber = body.panNumber;
      if (body.uanNumber !== undefined) allowedData.uanNumber = body.uanNumber;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: allowedData,
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_EMPLOYEE",
        entity: "Employee",
        entityId: id,
        details: `Updated details for employee ${updated.firstName} ${updated.lastName}`,
      },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "Failed to update employee." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id } = params;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    // Set employee status to TERMINATED
    await prisma.employee.update({
      where: { id },
      data: { status: "TERMINATED" },
    });

    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "TERMINATE_EMPLOYEE",
        entity: "Employee",
        entityId: id,
        details: `Deactivated/Terminated employee ${employee.firstName} ${employee.lastName}`,
      },
    });

    return NextResponse.json({ success: true, message: "Employee marked as terminated and access revoked." });
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ error: "Failed to delete employee." }, { status: 500 });
  }
}
