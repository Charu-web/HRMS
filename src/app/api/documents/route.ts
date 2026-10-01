import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isCompany = searchParams.get("isCompany");

    const where: any = {};

    if (isCompany === "true") {
      where.isCompanyDoc = true;
    } else {
      if (auth.role === "EMPLOYEE") {
        where.OR = [
          { employeeId: auth.employeeId },
          { isCompanyDoc: true },
        ];
      }
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, category, fileName, fileUrl, fileSize, isCompanyDoc, employeeId } = body;

    if (!title || !category || !fileName) {
      return NextResponse.json({ error: "Title, category, and file name are required." }, { status: 400 });
    }

    // Role check for uploading company documents
    if (isCompanyDoc && auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only admins can upload company-wide policy documents." }, { status: 403 });
    }

    const doc = await prisma.document.create({
      data: {
        title,
        category,
        fileName,
        fileUrl: fileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileSize: fileSize || "1.2 MB",
        mimeType: "application/pdf",
        isCompanyDoc: !!isCompanyDoc,
        employeeId: isCompanyDoc ? null : (employeeId || auth.employeeId),
        verificationStatus: isCompanyDoc ? "VERIFIED" : "PENDING",
      },
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
