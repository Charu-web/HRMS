import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN" && auth.role !== "HR")) {
      return NextResponse.json({ error: "Forbidden: Admin or HR access required." }, { status: 403 });
    }

    const company = await prisma.company.findFirst();
    return NextResponse.json({ company });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch company information" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const company = await prisma.company.findFirst();

    if (!company) {
      return NextResponse.json({ error: "Company record not found." }, { status: 404 });
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: body.name || company.name,
        logo: body.logo !== undefined ? body.logo : company.logo,
        email: body.email !== undefined ? body.email : company.email,
        phone: body.phone !== undefined ? body.phone : (body.mobileNumber || company.phone),
        address: body.address !== undefined ? body.address : company.address,
        address1: body.address1 !== undefined ? body.address1 : company.address1,
        address2: body.address2 !== undefined ? body.address2 : company.address2,
        address3: body.address3 !== undefined ? body.address3 : company.address3,
        city: body.city !== undefined ? body.city : company.city,
        state: body.state !== undefined ? body.state : company.state,
        pinCode: body.pinCode !== undefined ? body.pinCode : company.pinCode,
        country: body.country !== undefined ? body.country : company.country,
        currency: body.currency || company.currency,
        timezone: body.timezone || company.timezone,
        dateFormat: body.dateFormat || company.dateFormat,
        panNumber: body.panNumber !== undefined ? body.panNumber : company.panNumber,
        tanNumber: body.tanNumber !== undefined ? body.tanNumber : company.tanNumber,
        tanRegistrationNumber: body.tanRegistrationNumber !== undefined ? body.tanRegistrationNumber : company.tanRegistrationNumber,
        taxNatureOfPayment: body.taxNatureOfPayment !== undefined ? body.taxNatureOfPayment : company.taxNatureOfPayment,
        deductorType: body.deductorType !== undefined ? body.deductorType : company.deductorType,
        factoryRegistrationNumber: body.factoryRegistrationNumber !== undefined ? body.factoryRegistrationNumber : company.factoryRegistrationNumber,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE_COMPANY_INFO",
        entity: "Company",
        entityId: company.id,
        details: `Updated company details for "${updated.name}" with statutory information.`,
      },
    });

    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    console.error("PUT /api/settings/company error:", error);
    return NextResponse.json({ error: "Failed to update company information." }, { status: 500 });
  }
}
