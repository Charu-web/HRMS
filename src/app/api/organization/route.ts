import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await prisma.company.findFirst();
    const branches = await prisma.branch.findMany({
      include: { _count: { select: { employees: true } } },
    });
    const departments = await prisma.department.findMany({
      include: {
        designations: true,
        _count: { select: { employees: true } },
      },
    });
    const designations = await prisma.designation.findMany({
      include: { department: true, _count: { select: { employees: true } } },
    });
    const shifts = await prisma.shift.findMany({
      include: { _count: { select: { employees: true } } },
    });

    // Build Organizational Tree
    // Find top-level executives (managerId is null)
    const topLeaders = await prisma.employee.findMany({
      where: { managerId: null, status: "ACTIVE" },
      include: {
        department: true,
        designation: true,
        subordinates: {
          include: {
            department: true,
            designation: true,
            subordinates: {
              include: {
                department: true,
                designation: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      company,
      branches,
      departments,
      designations,
      shifts,
      orgHierarchy: topLeaders,
    });
  } catch (error: any) {
    console.error("Organization API error:", error);
    return NextResponse.json({ error: "Failed to fetch organization data." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { type, data } = await req.json();
    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ error: "Company not found." }, { status: 400 });
    }

    if (type === "DEPARTMENT") {
      const dept = await prisma.department.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          companyId: company.id,
        },
      });
      return NextResponse.json({ success: true, item: dept });
    } else if (type === "DESIGNATION") {
      const des = await prisma.designation.create({
        data: {
          name: data.name,
          code: data.code,
          departmentId: data.departmentId,
        },
      });
      return NextResponse.json({ success: true, item: des });
    } else if (type === "BRANCH") {
      const branch = await prisma.branch.create({
        data: {
          name: data.name,
          code: data.code,
          city: data.city,
          state: data.state,
          country: data.country || "India",
          companyId: company.id,
        },
      });
      return NextResponse.json({ success: true, item: branch });
    } else if (type === "SHIFT") {
      const shift = await prisma.shift.create({
        data: {
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
          gracePeriodMins: Number(data.gracePeriodMins) || 15,
          breakDurationMins: Number(data.breakDurationMins) || 60,
          weeklyOffDays: data.weeklyOffDays || "Sunday",
          companyId: company.id,
        },
      });
      return NextResponse.json({ success: true, item: shift });
    }

    return NextResponse.json({ error: "Invalid organization entity type." }, { status: 400 });
  } catch (error: any) {
    console.error("Create organization entity error:", error);
    return NextResponse.json({ error: "Failed to create entity." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Entity type and ID are required." }, { status: 400 });
    }

    if (type === "DEPARTMENT") {
      const empCount = await prisma.employee.count({ where: { departmentId: id } });
      if (empCount > 0) {
        return NextResponse.json({ error: `Cannot delete department: ${empCount} employees are assigned.` }, { status: 400 });
      }
      await prisma.department.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Department deleted." });
    } else if (type === "DESIGNATION") {
      const empCount = await prisma.employee.count({ where: { designationId: id } });
      if (empCount > 0) {
        return NextResponse.json({ error: `Cannot delete designation: ${empCount} employees are assigned.` }, { status: 400 });
      }
      await prisma.designation.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Designation deleted." });
    } else if (type === "BRANCH") {
      const empCount = await prisma.employee.count({ where: { branchId: id } });
      if (empCount > 0) {
        return NextResponse.json({ error: `Cannot delete branch: ${empCount} employees are assigned.` }, { status: 400 });
      }
      await prisma.branch.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Branch deleted." });
    } else if (type === "SHIFT") {
      const empCount = await prisma.employee.count({ where: { shiftId: id } });
      if (empCount > 0) {
        return NextResponse.json({ error: `Cannot delete shift: ${empCount} employees are assigned.` }, { status: 400 });
      }
      await prisma.shift.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Shift deleted." });
    }

    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  } catch (error: any) {
    console.error("Delete organization entity error:", error);
    return NextResponse.json({ error: "Failed to delete entity." }, { status: 500 });
  }
}

