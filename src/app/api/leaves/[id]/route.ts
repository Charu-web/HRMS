import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const action = body.action || (body.status === "APPROVED" ? "APPROVE" : body.status === "REJECTED" ? "REJECT" : body.status === "CANCELLED" ? "CANCEL" : null);
    const remarks = body.remarks;

    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    let newStatus = leave.status;
    let managerRemarks = leave.managerRemarks;
    let hrRemarks = leave.hrRemarks;

    if (action === "CANCEL") {
      // Allowed if employee themselves cancels before full approval
      if (auth.employeeId !== leave.employeeId && auth.role !== "ADMIN") {
        return NextResponse.json({ error: "Only the applicant or Admin can cancel this leave." }, { status: 403 });
      }
      newStatus = "CANCELLED";
    } else if (action === "REJECT") {
      if (auth.role !== "ADMIN" && auth.role !== "MANAGER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      newStatus = "REJECTED";
      if (auth.role === "MANAGER") managerRemarks = remarks || "Rejected by Manager";
      else hrRemarks = remarks || "Rejected by HR";
    } else if (action === "APPROVE" || action === "APPROVE_HR") {
      if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "MANAGER") {
        return NextResponse.json({ error: "Forbidden: Admin or Manager approval required." }, { status: 403 });
      }
      newStatus = "APPROVED";
      if (auth.role === "ADMIN" || auth.role === "SUPER_ADMIN") {
        hrRemarks = remarks || "Approved by HR Admin";
      } else {
        managerRemarks = remarks || "Approved by Manager";
      }
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: newStatus,
        managerRemarks,
        hrRemarks,
      },
    });

    // Update Leave Balance
    const currentYear = new Date(leave.startDate).getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: leave.employeeId,
          leaveTypeId: leave.leaveTypeId,
          year: currentYear,
        },
      },
    });

    if (balance) {
      if (newStatus === "APPROVED") {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: balance.usedDays + leave.totalDays,
            pendingDays: Math.max(0, balance.pendingDays - leave.totalDays),
          },
        });

        // Mark attendance as ON_LEAVE for the approved date range
        let curDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        while (curDate <= endDate) {
          const dayDate = new Date(curDate);
          dayDate.setHours(0, 0, 0, 0);

          const existingAtt = await prisma.attendance.findFirst({
            where: { employeeId: leave.employeeId, date: dayDate },
          });

          if (existingAtt) {
            await prisma.attendance.update({
              where: { id: existingAtt.id },
              data: { status: "ON_LEAVE", workHours: 0 },
            });
          } else {
            await prisma.attendance.create({
              data: {
                employeeId: leave.employeeId,
                date: dayDate,
                status: "ON_LEAVE",
                workHours: 0,
              },
            });
          }
          curDate.setDate(curDate.getDate() + 1);
        }
      } else if (newStatus === "REJECTED" || newStatus === "CANCELLED") {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: Math.max(0, balance.pendingDays - leave.totalDays),
          },
        });
      }
    }

    // Send notification to employee
    if (leave.employee.userId) {
      await prisma.notification.create({
        data: {
          userId: leave.employee.userId,
          title: `Leave Application ${newStatus}`,
          message: `Your leave request for ${leave.totalDays} day(s) was ${newStatus.toLowerCase()}. ${remarks ? `Note: ${remarks}` : ""}`,
          type: "LEAVE",
          linkUrl: "/leaves",
        },
      });
    }

    return NextResponse.json({ success: true, leave: updatedLeave });
  } catch (error: any) {
    console.error("Update leave error:", error);
    return NextResponse.json({ error: "Failed to update leave." }, { status: 500 });
  }
}
