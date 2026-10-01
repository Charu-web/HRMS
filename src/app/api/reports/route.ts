import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Manager or Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "EMPLOYEE";
    const departmentId = searchParams.get("departmentId");
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search");

    // 1. EMPLOYEE MASTER REPORT
    if (type === "EMPLOYEE") {
      const where: any = {};
      if (departmentId && departmentId !== "ALL") where.departmentId = departmentId;
      if (statusParam && statusParam !== "ALL") where.status = statusParam;
      if (searchParam) {
        where.OR = [
          { firstName: { contains: searchParam } },
          { lastName: { contains: searchParam } },
          { employeeCode: { contains: searchParam } },
        ];
      }

      const employees = await prisma.employee.findMany({
        where,
        include: { department: true, designation: true, branch: true, shift: true },
        orderBy: { employeeCode: "asc" },
      });

      const rows = employees.map((e) => ({
        "Employee Code": e.employeeCode,
        "Full Name": `${e.firstName} ${e.lastName}`,
        Email: e.email,
        Phone: e.phone || "N/A",
        Department: e.department?.name || "N/A",
        Designation: e.designation?.name || "N/A",
        Branch: e.branch?.name || "N/A",
        Shift: e.shift?.name || "General",
        Status: e.status,
        "Joining Date": new Date(e.joiningDate).toLocaleDateString(),
      }));

      return NextResponse.json({ title: "Employee Master Report", count: rows.length, rows });
    }

    // 2. ATTENDANCE LOG REPORT
    if (type === "ATTENDANCE") {
      const where: any = {};
      if (departmentId && departmentId !== "ALL") {
        where.employee = { departmentId };
      }
      if (statusParam && statusParam !== "ALL") {
        where.status = statusParam;
      }

      const attendances = await prisma.attendance.findMany({
        where,
        take: 300,
        include: {
          employee: {
            select: {
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { date: "desc" },
      });

      const rows = attendances.map((a) => ({
        Date: new Date(a.date).toLocaleDateString(),
        "Employee Code": a.employee.employeeCode,
        Name: `${a.employee.firstName} ${a.employee.lastName}`,
        Department: a.employee.department?.name || "N/A",
        Status: a.status,
        "Check In": a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "--",
        "Check Out": a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "--",
        "Work Hours": a.workHours,
        "Late Arrival": a.isLate ? "YES" : "NO",
      }));

      return NextResponse.json({ title: "Attendance Log Report", count: rows.length, rows });
    }

    // 3. LEAVE SUMMARY REPORT
    if (type === "LEAVE") {
      const where: any = {};
      if (departmentId && departmentId !== "ALL") {
        where.employee = { departmentId };
      }
      if (statusParam && statusParam !== "ALL") {
        where.status = statusParam;
      }

      const leaves = await prisma.leaveRequest.findMany({
        where,
        include: {
          employee: { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } },
          leaveType: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const rows = leaves.map((l) => ({
        "Employee Code": l.employee.employeeCode,
        Name: `${l.employee.firstName} ${l.employee.lastName}`,
        Department: l.employee.department?.name || "N/A",
        "Leave Type": l.leaveType.name,
        "Start Date": new Date(l.startDate).toLocaleDateString(),
        "End Date": new Date(l.endDate).toLocaleDateString(),
        "Total Days": l.totalDays,
        Reason: l.reason,
        Status: l.status,
      }));

      return NextResponse.json({ title: "Leave Summary Report", count: rows.length, rows });
    }

    // 4. PAYROLL REGISTER REPORT
    if (type === "PAYROLL") {
      const where: any = {};
      if (departmentId && departmentId !== "ALL") {
        where.employee = { departmentId };
      }

      const payslips = await prisma.payslip.findMany({
        where,
        include: {
          employee: { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });

      const rows = payslips.map((p) => ({
        Period: `${p.month}/${p.year}`,
        "Employee Code": p.employee.employeeCode,
        Name: `${p.employee.firstName} ${p.employee.lastName}`,
        Department: p.employee.department?.name || "N/A",
        "Basic Salary": `₹${p.basicSalary.toLocaleString("en-IN")}`,
        HRA: `₹${p.hra.toLocaleString("en-IN")}`,
        "Gross Earnings": `₹${p.grossEarnings.toLocaleString("en-IN")}`,
        EPF: `₹${p.epfDeduction.toLocaleString("en-IN")}`,
        "Total Deductions": `₹${p.totalDeductions.toLocaleString("en-IN")}`,
        "Net Salary": `₹${p.netSalary.toLocaleString("en-IN")}`,
        Status: p.paymentStatus,
      }));

      return NextResponse.json({ title: "Payroll Register Report", count: rows.length, rows });
    }

    // 5. EXPENSE CLAIMS REPORT
    if (type === "EXPENSE") {
      const where: any = {};
      if (departmentId && departmentId !== "ALL") {
        where.employee = { departmentId };
      }
      if (statusParam && statusParam !== "ALL") {
        where.status = statusParam;
      }

      const expenses = await prisma.expenseClaim.findMany({
        where,
        include: {
          employee: { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      const rows = expenses.map((e) => ({
        Date: new Date(e.claimDate).toLocaleDateString(),
        "Employee Code": e.employee.employeeCode,
        Name: `${e.employee.firstName} ${e.employee.lastName}`,
        Department: e.employee.department?.name || "N/A",
        Category: e.category,
        Title: e.title,
        Amount: `₹${e.amount.toLocaleString("en-IN")}`,
        Status: e.status,
        Remarks: e.reviewerRemarks || "--",
      }));

      return NextResponse.json({ title: "Expense Claims Report", count: rows.length, rows });
    }

    // 6. DEPARTMENT ANALYTICS & BUDGET REPORT
    if (type === "DEPARTMENT") {
      const departments = await prisma.department.findMany({
        include: {
          designations: true,
          employees: {
            include: {
              salaryStructure: true,
            },
          },
        },
      });

      const rows = departments.map((d) => {
        const activeEmployees = d.employees.filter((e) => e.status === "ACTIVE");
        const totalDeptCost = activeEmployees.reduce((sum, e) => sum + ((e.salaryStructure?.grossSalary || 58500) * 12), 0);
        return {
          "Department Name": d.name,
          "Department Code": d.code,
          "Active Headcount": activeEmployees.length,
          "Total Designations": d.designations.length,
          "Designations List": d.designations.map((des) => des.name).join(", ") || "General",
          "Annual CTC Budget": `₹${totalDeptCost.toLocaleString("en-IN")}`,
          "Avg CTC per Employee": activeEmployees.length > 0 ? `₹${Math.round(totalDeptCost / activeEmployees.length).toLocaleString("en-IN")}` : "₹0",
          Description: d.description || "N/A",
        };
      });

      return NextResponse.json({ title: "Department Analytics & Budget Report", count: rows.length, rows });
    }

    // 7. JOINING REPORT (New Joiners)
    if (type === "JOINING") {
      const where: any = {};
      if (departmentId && departmentId !== "ALL") where.departmentId = departmentId;

      const joiners = await prisma.employee.findMany({
        where,
        include: { department: true, designation: true, branch: true },
        orderBy: { joiningDate: "desc" },
        take: 100,
      });

      const rows = joiners.map((j) => ({
        "Employee Code": j.employeeCode,
        Name: `${j.firstName} ${j.lastName}`,
        Email: j.email,
        Department: j.department?.name || "N/A",
        Designation: j.designation?.name || "N/A",
        Branch: j.branch?.name || "N/A",
        "Joining Date": new Date(j.joiningDate).toLocaleDateString(),
        "Employment Type": j.employmentType,
        "Work Location": j.workLocation,
        Status: j.status,
      }));

      return NextResponse.json({ title: "Employee Joining & Onboarding Report", count: rows.length, rows });
    }

    // 8. EXIT REPORT (Terminated / Inactive Employees)
    if (type === "EXIT") {
      const where: any = {
        status: { in: ["TERMINATED", "INACTIVE", "RESIGNED"] },
      };
      if (departmentId && departmentId !== "ALL") where.departmentId = departmentId;

      const exits = await prisma.employee.findMany({
        where,
        include: { department: true, designation: true, branch: true },
        orderBy: { updatedAt: "desc" },
      });

      const rows = exits.map((ex) => ({
        "Employee Code": ex.employeeCode,
        Name: `${ex.firstName} ${ex.lastName}`,
        Email: ex.email,
        Department: ex.department?.name || "N/A",
        Designation: ex.designation?.name || "N/A",
        "Joining Date": new Date(ex.joiningDate).toLocaleDateString(),
        "Separation Status": ex.status,
        "Last Recorded Update": new Date(ex.updatedAt).toLocaleDateString(),
      }));

      return NextResponse.json({ title: "Attrition & Separation Exit Report", count: rows.length, rows });
    }

    // 9. PERFORMANCE REPORT (Goals & Reviews)
    if (type === "PERFORMANCE") {
      const goals = await prisma.goal.findMany({
        include: {
          employee: {
            select: {
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
          cycle: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const rows = goals.map((g) => ({
        "Employee Code": g.employee.employeeCode,
        Name: `${g.employee.firstName} ${g.employee.lastName}`,
        Department: g.employee.department?.name || "N/A",
        "Review Cycle": g.cycle?.title || "FY 2026",
        "Goal Title": g.title,
        Category: g.category,
        "Weightage (%)": `${g.weightage}%`,
        "Progress (%)": `${g.progress}%`,
        Status: g.status,
        "Target Date": g.dueDate ? new Date(g.dueDate).toLocaleDateString() : "N/A",
      }));

      return NextResponse.json({ title: "Performance Goals & OKR Report", count: rows.length, rows });
    }

    // 10. LOCATION & GEOFENCE REPORT
    if (type === "LOCATION") {
      const locations = await prisma.officeLocation.findMany({
        orderBy: { name: "asc" },
      });
      const branches = await prisma.branch.findMany({
        include: { _count: { select: { employees: true } } },
        orderBy: { name: "asc" },
      });

      const rows = [
        ...locations.map((loc) => ({
          Category: "Office Geofence",
          Name: loc.name,
          Code: loc.code,
          Address: loc.address || "N/A",
          Latitude: loc.latitude,
          Longitude: loc.longitude,
          "Allowed Radius (m)": loc.radiusMeters,
          Status: loc.isActive ? "ACTIVE" : "INACTIVE",
          "Linked Headcount": "--",
        })),
        ...branches.map((b) => ({
          Category: "Branch Office",
          Name: b.name,
          Code: b.code,
          Address: b.address || `${b.city}, ${b.state}`,
          Latitude: b.latitude || 12.9716,
          Longitude: b.longitude || 77.5946,
          "Allowed Radius (m)": b.radiusMeters || 500,
          Status: "ACTIVE",
          "Linked Headcount": b._count.employees.toString(),
        })),
      ];

      return NextResponse.json({ title: "Office Locations & Geofence Register", count: rows.length, rows });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
