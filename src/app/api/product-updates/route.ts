import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "latest"; // latest or oldest
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based visibility: Non-admins can only see PUBLISHED updates
    const isAdmin = auth?.role === "ADMIN" || auth?.role === "SUPER_ADMIN";
    if (!isAdmin) {
      where.status = "PUBLISHED";
      where.publishDate = { lte: new Date() };
    } else if (status && status !== "ALL") {
      where.status = status;
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search.trim()) {
      where.OR = [
        { title: { contains: search } },
        { shortDescription: { contains: search } },
        { fullDescription: { contains: search } },
      ];
    }

    const [totalCount, updates] = await Promise.all([
      prisma.productUpdate.count({ where }),
      prisma.productUpdate.findMany({
        where,
        include: {
          reactions: true,
          comments: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: {
          publishDate: sort === "oldest" ? "asc" : "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    // Format updates with like/dislike counts and current user's reaction
    const formatted = updates.map((u) => {
      const likesCount = u.reactions.filter((r) => r.type === "LIKE").length;
      const dislikesCount = u.reactions.filter((r) => r.type === "DISLIKE").length;
      const userReaction = auth ? u.reactions.find((r) => r.userId === auth.userId)?.type || null : null;

      return {
        id: u.id,
        title: u.title,
        category: u.category,
        updateType: u.updateType,
        shortDescription: u.shortDescription,
        fullDescription: u.fullDescription,
        image: u.image,
        publishDate: u.publishDate,
        status: u.status,
        viewsCount: u.viewsCount,
        likesCount,
        dislikesCount,
        userReaction,
        commentsCount: u.comments.length,
        comments: u.comments,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({
      updates: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("GET /api/product-updates error:", error);
    return NextResponse.json({ error: "Failed to fetch product updates." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      category,
      updateType,
      shortDescription,
      fullDescription,
      image,
      publishDate,
      status,
    } = body;

    if (!title || !category || !updateType || !shortDescription) {
      return NextResponse.json(
        { error: "Title, category, update type, and short description are required." },
        { status: 400 }
      );
    }

    const newUpdate = await prisma.productUpdate.create({
      data: {
        title,
        category,
        updateType,
        shortDescription,
        fullDescription: fullDescription || shortDescription,
        image: image || null,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        status: status || "PUBLISHED",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name || auth.email || "Admin",
        action: "CREATE_PRODUCT_UPDATE",
        entity: "ProductUpdate",
        entityId: newUpdate.id,
        details: `Created product update "${title}" with status ${newUpdate.status}`,
      },
    });

    return NextResponse.json({ success: true, update: newUpdate }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/product-updates error:", error);
    return NextResponse.json({ error: "Failed to create product update." }, { status: 500 });
  }
}
