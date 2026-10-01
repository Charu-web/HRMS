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

    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json({ announcements });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, priority, category } = body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || "GENERAL",
        category: category || "COMPANY",
        publishedByName: auth.name || "HR Admin",
      },
    });

    // Broadcast in-app notification to all users
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    for (const u of allUsers) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: `Announcement: ${title}`,
          message: content.substring(0, 120) + (content.length > 120 ? "..." : ""),
          type: "ANNOUNCEMENT",
          linkUrl: "/announcements",
        },
      });
    }

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to publish announcement" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, content, priority, category } = body;

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (priority) updateData.priority = priority;
    if (category) updateData.category = category;

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required." }, { status: 400 });
    }

    await prisma.announcement.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Announcement deactivated." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
