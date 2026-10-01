import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    const { id } = params;

    const update = await prisma.productUpdate.findUnique({
      where: { id },
      include: {
        reactions: true,
        comments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!update) {
      return NextResponse.json({ error: "Product update not found." }, { status: 404 });
    }

    const isAdmin = auth?.role === "ADMIN" || auth?.role === "SUPER_ADMIN";
    if (!isAdmin && update.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Access denied: Update is not published." }, { status: 403 });
    }

    // Increment view count asynchronously
    await prisma.productUpdate.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    const likesCount = update.reactions.filter((r) => r.type === "LIKE").length;
    const dislikesCount = update.reactions.filter((r) => r.type === "DISLIKE").length;
    const userReaction = auth ? update.reactions.find((r) => r.userId === auth.userId)?.type || null : null;

    return NextResponse.json({
      update: {
        ...update,
        likesCount,
        dislikesCount,
        userReaction,
        commentsCount: update.comments.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/product-updates/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch product update." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.productUpdate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product update not found." }, { status: 404 });
    }

    const updated = await prisma.productUpdate.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        category: body.category !== undefined ? body.category : existing.category,
        updateType: body.updateType !== undefined ? body.updateType : existing.updateType,
        shortDescription: body.shortDescription !== undefined ? body.shortDescription : existing.shortDescription,
        fullDescription: body.fullDescription !== undefined ? body.fullDescription : existing.fullDescription,
        image: body.image !== undefined ? body.image : existing.image,
        publishDate: body.publishDate ? new Date(body.publishDate) : existing.publishDate,
        status: body.status !== undefined ? body.status : existing.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name || auth.email || "Admin",
        action: "UPDATE_PRODUCT_UPDATE",
        entity: "ProductUpdate",
        entityId: id,
        details: `Updated product update "${updated.title}" - Status: ${updated.status}`,
      },
    });

    return NextResponse.json({ success: true, update: updated });
  } catch (error: any) {
    console.error("PUT /api/product-updates/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product update." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const { id } = params;
    const existing = await prisma.productUpdate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product update not found." }, { status: 404 });
    }

    await prisma.productUpdate.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name || auth.email || "Admin",
        action: "DELETE_PRODUCT_UPDATE",
        entity: "ProductUpdate",
        entityId: id,
        details: `Deleted product update "${existing.title}"`,
      },
    });

    return NextResponse.json({ success: true, message: "Product update deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/product-updates/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product update." }, { status: 500 });
  }
}
