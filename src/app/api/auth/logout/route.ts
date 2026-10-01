import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (auth) {
      await prisma.auditLog.create({
        data: {
          userId: auth.userId,
          userName: auth.name || auth.email,
          action: "LOGOUT",
          entity: "User",
          entityId: auth.userId,
          details: "User logged out successfully",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.set({
      name: "zenith_token",
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
