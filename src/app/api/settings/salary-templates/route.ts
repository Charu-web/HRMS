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

    let templates = await prisma.salarySlipTemplate.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    if (templates.length === 0) {
      const company = await prisma.company.findFirst();
      const defaultTmpl = await prisma.salarySlipTemplate.create({
        data: {
          name: "Standard Enterprise Payslip",
          isDefault: true,
          companyName: company?.name || "Zenith Innovations Technologies Pvt Ltd",
          companyAddress: company?.address || "Prestige Tech Park, Outer Ring Road, Bengaluru 560103",
          companyContact: company?.phone || "+91 80 4920 1000",
          signatoryTitle: "Head of HR & Payroll",
          authorizedSignatory: "Aditi Verma",
          showLogo: true,
          showBankDetails: true,
          showPanUan: true,
          showDepartment: true,
          showDesignation: true,
          showLeavesSummary: true,
          showOvertime: true,
          showEmployerContributions: true,
          footerText: "This is a computer-generated salary slip and does not require a physical signature.",
          themeColor: "#4F46E5",
        },
      });
      templates = [defaultTmpl];
    }

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Fetch salary templates error:", error);
    return NextResponse.json({ error: "Failed to fetch salary slip templates." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      companyName,
      companyLogo,
      companyAddress,
      signatoryTitle,
      signatoryName,
      signatorySignUrl,
      showTaxDetails,
      showLeaveDetails,
      showBankDetails,
      showPFESI,
      footerNote,
      primaryColor,
      isDefault,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Template name is required." }, { status: 400 });
    }

    if (isDefault) {
      await prisma.salarySlipTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.salarySlipTemplate.create({
      data: {
        name,
        companyName: companyName || null,
        companyLogo: companyLogo || null,
        companyAddress: companyAddress || null,
        signatoryTitle: signatoryTitle || "Authorized Signatory",
        authorizedSignatory: signatoryName || body.authorizedSignatory || null,
        signatureUrl: signatorySignUrl || body.signatureUrl || null,
        showPanUan: showTaxDetails !== undefined ? Boolean(showTaxDetails) : (body.showPanUan !== false),
        showLeavesSummary: showLeaveDetails !== undefined ? Boolean(showLeaveDetails) : (body.showLeavesSummary !== false),
        showBankDetails: showBankDetails !== false,
        showEmployerContributions: showPFESI !== undefined ? Boolean(showPFESI) : (body.showEmployerContributions !== false),
        footerText: footerNote || body.footerText || null,
        themeColor: primaryColor || body.themeColor || "#4F46E5",
        isDefault: Boolean(isDefault),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "CREATE",
        entity: "SalarySlipTemplate",
        entityId: template.id,
        details: `Created salary slip template: ${template.name}`,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("Create salary template error:", error);
    return NextResponse.json({ error: "Failed to create salary slip template." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, isDefault, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required." }, { status: 400 });
    }

    if (isDefault) {
      await prisma.salarySlipTemplate.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.companyName !== undefined) updateData.companyName = fields.companyName;
    if (fields.companyLogo !== undefined) updateData.companyLogo = fields.companyLogo;
    if (fields.companyAddress !== undefined) updateData.companyAddress = fields.companyAddress;
    if (fields.signatoryTitle !== undefined) updateData.signatoryTitle = fields.signatoryTitle;
    if (fields.signatoryName !== undefined || fields.authorizedSignatory !== undefined) {
      updateData.authorizedSignatory = fields.signatoryName || fields.authorizedSignatory;
    }
    if (fields.signatorySignUrl !== undefined || fields.signatureUrl !== undefined) {
      updateData.signatureUrl = fields.signatorySignUrl || fields.signatureUrl;
    }
    if (fields.showTaxDetails !== undefined || fields.showPanUan !== undefined) {
      updateData.showPanUan = fields.showTaxDetails !== undefined ? Boolean(fields.showTaxDetails) : Boolean(fields.showPanUan);
    }
    if (fields.showLeaveDetails !== undefined || fields.showLeavesSummary !== undefined) {
      updateData.showLeavesSummary = fields.showLeaveDetails !== undefined ? Boolean(fields.showLeaveDetails) : Boolean(fields.showLeavesSummary);
    }
    if (fields.showBankDetails !== undefined) updateData.showBankDetails = Boolean(fields.showBankDetails);
    if (fields.showPFESI !== undefined || fields.showEmployerContributions !== undefined) {
      updateData.showEmployerContributions = fields.showPFESI !== undefined ? Boolean(fields.showPFESI) : Boolean(fields.showEmployerContributions);
    }
    if (fields.footerNote !== undefined || fields.footerText !== undefined) {
      updateData.footerText = fields.footerNote || fields.footerText;
    }
    if (fields.primaryColor !== undefined || fields.themeColor !== undefined) {
      updateData.themeColor = fields.primaryColor || fields.themeColor;
    }
    if (isDefault !== undefined) updateData.isDefault = Boolean(isDefault);

    const template = await prisma.salarySlipTemplate.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.userId,
        userName: auth.name,
        action: "UPDATE",
        entity: "SalarySlipTemplate",
        entityId: template.id,
        details: `Updated salary slip template: ${template.name}`,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("Update salary template error:", error);
    return NextResponse.json({ error: "Failed to update salary slip template." }, { status: 500 });
  }
}
