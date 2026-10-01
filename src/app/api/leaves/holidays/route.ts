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
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const holidays = await prisma.holiday.findMany({
      where: { year },
      orderBy: { date: "asc" },
    });
    return NextResponse.json({ holidays });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, date, description, isOptional } = body;
    if (!name || !date) {
      return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
    }

    const holidayDate = new Date(date);
    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: holidayDate,
        description: description || null,
        isOptional: !!isOptional,
        year: holidayDate.getFullYear(),
      },
    });

    return NextResponse.json({ success: true, holiday }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}
