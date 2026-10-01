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

    const locations = await prisma.officeLocation.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, locations });
  } catch (error: any) {
    console.error("Fetch locations error:", error);
    return NextResponse.json({ error: "Failed to fetch office locations." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, address, latitude, longitude, radiusMeters, isActive } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Name, latitude, and longitude are required." },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = radiusMeters ? parseFloat(radiusMeters) : 500;

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return NextResponse.json(
        { error: "Invalid latitude, longitude, or radius values." },
        { status: 400 }
      );
    }

    const code =
      body.code?.trim() ||
      `LOC-${name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const location = await prisma.officeLocation.create({
      data: {
        name,
        code,
        address: address || null,
        latitude: lat,
        longitude: lng,
        radiusMeters: radius,
        isActive: isActive !== false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "CREATE",
        entity: "OfficeLocation",
        entityId: location.id,
        details: `Created office geofence location: ${name} (${lat}, ${lng}, ${radius}m)`,
      },
    });

    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    console.error("Create location error:", error);
    return NextResponse.json({ error: "Failed to create office location." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, address, latitude, longitude, radiusMeters, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Location ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (radiusMeters !== undefined) updateData.radiusMeters = parseFloat(radiusMeters);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const location = await prisma.officeLocation.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE",
        entity: "OfficeLocation",
        entityId: location.id,
        details: `Updated office geofence location: ${location.name}`,
      },
    });

    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    console.error("Update location error:", error);
    return NextResponse.json({ error: "Failed to update office location." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Location ID is required." }, { status: 400 });
    }

    const location = await prisma.officeLocation.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "DELETE",
        entity: "OfficeLocation",
        entityId: id,
        details: `Deleted office geofence location: ${location.name}`,
      },
    });

    return NextResponse.json({ success: true, message: "Location deleted successfully." });
  } catch (error: any) {
    console.error("Delete location error:", error);
    return NextResponse.json({ error: "Failed to delete office location." }, { status: 500 });
  }
}
