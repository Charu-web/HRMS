import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized: Login required." }, { status: 401 });
    }

    const { id: updateId } = params;
    const body = await req.json();
    const { action, type, comment } = body;

    const update = await prisma.productUpdate.findUnique({ where: { id: updateId } });
    if (!update) {
      return NextResponse.json({ error: "Product update not found." }, { status: 404 });
    }

    if (action === "REACT") {
      if (!type || (type !== "LIKE" && type !== "DISLIKE")) {
        return NextResponse.json({ error: "Reaction type must be LIKE or DISLIKE." }, { status: 400 });
      }

      const existingReaction = await prisma.productUpdateReaction.findUnique({
        where: {
          updateId_userId: {
            updateId,
            userId: auth.userId,
          },
        },
      });

      if (existingReaction) {
        if (existingReaction.type === type) {
          // Toggle off (remove reaction)
          await prisma.productUpdateReaction.delete({
            where: { id: existingReaction.id },
          });
        } else {
          // Switch reaction (e.g. from dislike to like)
          await prisma.productUpdateReaction.update({
            where: { id: existingReaction.id },
            data: { type },
          });
        }
      } else {
        await prisma.productUpdateReaction.create({
          data: {
            updateId,
            userId: auth.userId,
            type,
          },
        });
      }

      // Return updated counts
      const reactions = await prisma.productUpdateReaction.findMany({ where: { updateId } });
      const likesCount = reactions.filter((r) => r.type === "LIKE").length;
      const dislikesCount = reactions.filter((r) => r.type === "DISLIKE").length;
      const currentReaction = reactions.find((r) => r.userId === auth.userId)?.type || null;

      return NextResponse.json({
        success: true,
        likesCount,
        dislikesCount,
        userReaction: currentReaction,
      });
    }

    if (action === "COMMENT") {
      if (!comment || !comment.trim()) {
        return NextResponse.json({ error: "Comment text cannot be empty." }, { status: 400 });
      }

      const newComment = await prisma.productUpdateComment.create({
        data: {
          updateId,
          userId: auth.userId,
          userName: auth.name || auth.email || "Employee",
          userRole: auth.role,
          comment: comment.trim(),
        },
      });

      return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid feedback action. Use REACT or COMMENT." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/product-updates/[id]/feedback error:", error);
    return NextResponse.json({ error: "Failed to record feedback." }, { status: 500 });
  }
}
