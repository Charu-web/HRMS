import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, roleHint } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username/Email and Password are required." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Map common demo usernames if entered directly
    let targetEmail = cleanUsername;
    if (cleanUsername === "admin" || cleanUsername === "empire admin" || cleanUsername === "empireadmin") {
      targetEmail = "admin@zenithhrms.com";
    } else if (cleanUsername === "manager") {
      targetEmail = "manager@zenithhrms.com";
    } else if (cleanUsername === "employee" || cleanUsername === "b122") {
      targetEmail = "employee@zenithhrms.com";
    } else if (cleanUsername === "hr") {
      targetEmail = "hr@zenithhrms.com";
    }

    // Find user by email or by associated employee code
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: targetEmail } },
          { employee: { employeeCode: { equals: username.trim().toUpperCase() } } },
        ],
      },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            branch: true,
            shift: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. User not found." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is inactive. Please contact your HR administrator." },
        { status: 403 }
      );
    }

    let isMatch = await comparePassword(password, user.passwordHash);

    // Demo password fallbacks — development/staging only
    if (!isMatch && process.env.NODE_ENV !== "production") {
      if (user.email === "admin@zenithhrms.com" && (password === "Admin@123" || password === "admin@123")) {
        isMatch = true;
      } else if (user.email === "manager@zenithhrms.com" && (password === "Manager@123" || password === "manager@123")) {
        isMatch = true;
      } else if (user.email === "employee@zenithhrms.com" && (password === "Employee@123" || password === "employee@123" || password === "factohr@720")) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid password. Please check your credentials." },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id || null,
      name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "System Admin",
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        details: `User logged in with role: ${user.role}`,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    // Response with secure cookie
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    });

    response.cookies.set({
      name: "zenith_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error during login." },
      { status: 500 }
    );
  }
}
