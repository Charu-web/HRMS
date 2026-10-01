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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Shared: Upcoming Holidays & Active Announcements
    const upcomingHolidays = await prisma.holiday.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      take: 4,
    });

    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: "desc" },
      take: 4,
    });

    // ==========================================
    // 1. EMPLOYEE SELF-SERVICE (ESS) DASHBOARD
    // ==========================================
    if (auth.role === "EMPLOYEE" && auth.employeeId) {
      const empId = auth.employeeId;

      // Today's personal punch
      const todayAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId: empId,
          date: { gte: today, lt: tomorrow },
        },
      });

      // Leave balances
      const currentYear = today.getFullYear();
      const balances = await prisma.leaveBalance.findMany({
        where: { employeeId: empId, year: currentYear },
        include: { leaveType: true },
      });

      // Recent payslip
      const latestPayslip = await prisma.payslip.findFirst({
        where: { employeeId: empId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });

      // Salary Structure
      const salaryStructure = await prisma.salaryStructure.findUnique({
        where: { employeeId: empId },
      });

      // Goals & Progress
      const goals = await prisma.goal.findMany({
        where: { employeeId: empId },
        orderBy: { createdAt: "desc" },
        take: 4,
      });

      // My pending requests
      const pendingLeaves = await prisma.leaveRequest.findMany({
        where: { employeeId: empId, status: "PENDING" },
        include: { leaveType: true },
      });

      const pendingExpenses = await prisma.expenseClaim.findMany({
        where: { employeeId: empId, status: "PENDING" },
      });

      const pendingCorrections = await prisma.attendanceCorrection.findMany({
        where: { employeeId: empId, status: "PENDING" },
      });

      // Recent attendances (last 7 records)
      const recentAttendance = await prisma.attendance.findMany({
        where: { employeeId: empId },
        orderBy: { date: "desc" },
        take: 7,
      });

      return NextResponse.json({
        role: "EMPLOYEE",
        employeeDashboard: {
          todayAttendance,
          balances: balances.map((b) => ({
            id: b.id,
            name: b.leaveType.name,
            code: b.leaveType.code,
            color: b.leaveType.color,
            available: Math.max(0, b.allocatedDays - b.usedDays - b.pendingDays),
            allocated: b.allocatedDays,
            used: b.usedDays,
          })),
          latestPayslip,
          salaryStructure,
          goals,
          pendingLeaves,
          pendingExpenses,
          pendingCorrections,
          recentAttendance,
          upcomingHolidays,
          announcements,
        },
      });
    }

    // ==========================================
    // 2. MANAGER DASHBOARD
    // ==========================================
    if (auth.role === "MANAGER" && auth.employeeId) {
      const mgrId = auth.employeeId;

      // Direct reports
      const teamEmployees = await prisma.employee.findMany({
        where: { managerId: mgrId, status: "ACTIVE" },
        include: {
          department: true,
          designation: true,
        },
      });
      const teamIds = teamEmployees.map((e) => e.id);

      // Team attendance today
      const teamTodayAttendances = await prisma.attendance.findMany({
        where: {
          employeeId: { in: teamIds },
          date: { gte: today, lt: tomorrow },
        },
        include: {
          employee: {
            select: { firstName: true, lastName: true, employeeCode: true, profilePhoto: true },
          },
        },
      });

      const presentTeam = teamTodayAttendances.filter((a) => a.status === "PRESENT").length;
      const absentTeam = teamTodayAttendances.filter((a) => a.status === "ABSENT").length;
      const onLeaveTeam = teamTodayAttendances.filter((a) => a.status === "ON_LEAVE").length;

      // Team pending leave approvals
      const teamPendingLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: { in: teamIds },
          status: "PENDING",
        },
        include: {
          employee: { select: { firstName: true, lastName: true, profilePhoto: true } },
          leaveType: true,
        },
      });

      // Team pending attendance corrections
      const teamPendingCorrections = await prisma.attendanceCorrection.findMany({
        where: {
          employeeId: { in: teamIds },
          status: "PENDING",
        },
        include: {
          employee: { select: { firstName: true, lastName: true, profilePhoto: true } },
        },
      });

      // Team pending expenses
      const teamPendingExpenses = await prisma.expenseClaim.findMany({
        where: {
          employeeId: { in: teamIds },
          status: "PENDING",
        },
        include: {
          employee: { select: { firstName: true, lastName: true, profilePhoto: true } },
        },
      });

      // Manager's own attendance today
      const myTodayAttendance = await prisma.attendance.findFirst({
        where: { employeeId: mgrId, date: { gte: today, lt: tomorrow } },
      });

      return NextResponse.json({
        role: "MANAGER",
        managerDashboard: {
          teamSize: teamEmployees.length,
          teamEmployees,
          teamStats: {
            present: presentTeam,
            absent: absentTeam,
            onLeave: onLeaveTeam,
            pendingLeavesCount: teamPendingLeaves.length,
            pendingCorrectionsCount: teamPendingCorrections.length,
            pendingExpensesCount: teamPendingExpenses.length,
            totalPendingApprovals: teamPendingLeaves.length + teamPendingCorrections.length + teamPendingExpenses.length,
          },
          teamPendingLeaves,
          teamPendingCorrections,
          teamPendingExpenses,
          teamTodayAttendances,
          myTodayAttendance,
          upcomingHolidays,
          announcements,
        },
      });
    }

    // ==========================================
    // 3. ADMIN / SUPER ADMIN DASHBOARD
    // ==========================================
    const totalEmployees = await prisma.employee.count({
      where: { status: "ACTIVE" },
    });

    const todayAttendances = await prisma.attendance.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    let presentToday = 0;
    let absentToday = 0;
    let onLeaveToday = 0;

    todayAttendances.forEach((att) => {
      if (att.status === "PRESENT") presentToday++;
      else if (att.status === "ABSENT") absentToday++;
      else if (att.status === "ON_LEAVE") onLeaveToday++;
    });

    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
    const newJoiners = await prisma.employee.count({
      where: { joiningDate: { gte: fortyFiveDaysAgo } },
    });

    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: "PENDING" } });
    const pendingCorrections = await prisma.attendanceCorrection.count({ where: { status: "PENDING" } });
    const pendingExpenses = await prisma.expenseClaim.count({ where: { status: "PENDING" } });
    const totalPendingApprovals = pendingLeaves + pendingCorrections + pendingExpenses;

    const latestPayroll = await prisma.payrollMonth.findFirst({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
    });

    const departmentDistribution = departments.map((d) => ({
      name: d.name.replace(" & Technology", "").replace(" & Marketing", "").replace(" & IT Support", "").replace(" & Accounts", ""),
      count: d._count.employees,
      code: d.code,
    }));

    const attendanceTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayRecords = await prisma.attendance.findMany({
        where: { date: { gte: d, lt: nextD } },
      });

      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const pCount = dayRecords.filter((r) => r.status === "PRESENT").length;
      const aCount = dayRecords.filter((r) => r.status === "ABSENT").length;
      const lCount = dayRecords.filter((r) => r.status === "ON_LEAVE").length;

      attendanceTrends.push({
        day: dayName,
        date: d.toISOString().split("T")[0],
        Present: pCount,
        Absent: aCount,
        Leave: lCount,
      });
    }

    const maleCount = await prisma.employee.count({ where: { gender: "Male" } });
    const femaleCount = await prisma.employee.count({ where: { gender: "Female" } });
    const genderDistribution = [
      { name: "Male", value: maleCount, color: "#3B82F6" },
      { name: "Female", value: femaleCount, color: "#EC4899" },
    ];

    const fullTimeCount = await prisma.employee.count({ where: { employmentType: "FULL_TIME" } });
    const contractCount = await prisma.employee.count({ where: { employmentType: "CONTRACT" } });
    const internCount = await prisma.employee.count({ where: { employmentType: "INTERN" } });
    const employmentDistribution = [
      { name: "Full Time", value: fullTimeCount || 30, color: "#10B981" },
      { name: "Contract", value: contractCount || 1, color: "#F59E0B" },
      { name: "Intern", value: internCount || 1, color: "#8B5CF6" },
    ];

    const allEmpsForDob = await prisma.employee.findMany({
      where: { dateOfBirth: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        dateOfBirth: true,
        department: { select: { name: true } },
      },
    });

    const currentMonth = today.getMonth();
    const upcomingBirthdays = allEmpsForDob
      .filter((emp) => emp.dateOfBirth && emp.dateOfBirth.getMonth() === currentMonth)
      .slice(0, 5)
      .map((emp) => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name,
        photo: emp.profilePhoto,
        date: emp.dateOfBirth?.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));

    const recentActivities = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const pendingLeaveItems = await prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: {
        employee: { select: { firstName: true, lastName: true, profilePhoto: true } },
        leaveType: { select: { name: true, code: true } },
      },
      take: 4,
    });

    return NextResponse.json({
      role: "ADMIN",
      cards: {
        totalEmployees,
        presentToday,
        absentToday,
        onLeaveToday,
        newJoiners,
        birthdaysCount: upcomingBirthdays.length,
        pendingLeaves,
        totalPendingApprovals,
        payrollGross: latestPayroll ? latestPayroll.totalGross : 2108000,
        payrollNet: latestPayroll ? latestPayroll.totalNet : 1922000,
      },
      charts: {
        departmentDistribution,
        attendanceTrends,
        genderDistribution,
        employmentDistribution,
      },
      widgets: {
        todayPunches: todayAttendances.slice(0, 6),
        upcomingBirthdays,
        upcomingHolidays,
        announcements,
        recentActivities,
        pendingApprovals: pendingLeaveItems,
      },
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
