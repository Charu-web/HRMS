const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Settings, Role Permissions & Product Updates...');

  // 1. Seed or Update Company Information
  const company = await prisma.company.findFirst();
  if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        address1: 'Tech Nexus Tower, Level 8',
        address2: 'Outer Ring Road, Bellandur',
        address3: 'Near Ecospace Business Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560103',
        country: 'India',
        dateFormat: 'DD/MM/YYYY',
        panNumber: 'AAACZ8921K',
        tanNumber: 'BLRZ01234D',
        tanRegistrationNumber: 'TAN-REG-2024-998',
        taxNatureOfPayment: '192 - Salaries',
        deductorType: 'Company (Domestic)',
        factoryRegistrationNumber: 'KAR/BNG/FACT/2023/4521',
      },
    });
    console.log('✅ Company information updated with statutory and extended details.');
  }

  // 2. Seed Default Role Permissions
  const modules = [
    'Employees',
    'Attendance',
    'Leave',
    'Payroll',
    'Expenses',
    'Documents',
    'Performance',
    'Recruitment',
    'Reports',
    'Product Updates',
    'Settings',
  ];

  const defaultMatrix = {
    ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true },
    HR: { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true },
    MANAGER: { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: false },
    EMPLOYEE: { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
  };

  for (const role of ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']) {
    for (const mod of modules) {
      const base = { ...defaultMatrix[role] };
      if (role === 'EMPLOYEE') {
        if (['Leave', 'Expenses', 'Attendance'].includes(mod)) {
          base.canCreate = true;
        }
        if (['Settings', 'Reports', 'Recruitment'].includes(mod)) {
          base.canView = false;
        }
      }
      if (role === 'MANAGER') {
        if (['Settings'].includes(mod)) {
          base.canView = false;
        }
      }

      await prisma.rolePermission.upsert({
        where: {
          role_module: {
            role,
            module: mod,
          },
        },
        update: base,
        create: {
          role,
          module: mod,
          ...base,
        },
      });
    }
  }
  console.log('✅ Role permissions matrix seeded for ADMIN, HR, MANAGER, and EMPLOYEE.');

  // 3. Seed System Settings
  const settings = [
    {
      category: 'ATTENDANCE',
      key: 'attendance_rules',
      value: JSON.stringify({
        standardWorkHours: 8,
        gracePeriodMins: 15,
        halfDayHours: 4.5,
        overtimeThresholdHours: 8,
        defaultBreakHours: 1.0,
        enableGeoFencing: false,
        allowWebPunch: true,
        allowMobilePunch: true,
        autoCheckoutEnabled: true,
        autoCheckoutTime: '23:00',
        regularizationWindowDays: 7,
      }),
    },
    {
      category: 'LEAVE',
      key: 'leave_policies',
      value: JSON.stringify({
        accrualCycle: 'MONTHLY',
        probationaryLeaveAllowed: false,
        maxConsecutiveLeaves: 10,
        sandwichRuleEnabled: true,
        carryForwardLimitDays: 15,
        encashmentAllowed: true,
        weekendSettings: ['SATURDAY_ALT', 'SUNDAY'],
      }),
    },
    {
      category: 'PAYROLL',
      key: 'payroll_config',
      value: JSON.stringify({
        payCycleDay: 28,
        salaryCalculationBasis: 'CALENDAR_DAYS',
        taxRegimeDefault: 'NEW',
        epfEmployeeRate: 12,
        epfEmployerRate: 12,
        epfWageCap: 15000,
        ptState: 'Karnataka',
        payslipPasswordProtected: false,
        payslipTemplate: 'STANDARD_CORPORATE',
      }),
    },
    {
      category: 'NOTIFICATIONS',
      key: 'notification_preferences',
      value: JSON.stringify({
        emailNotifications: true,
        inAppNotifications: true,
        pushNotifications: true,
        leaveStatusAlerts: true,
        attendanceRegularizationAlerts: true,
        payrollReleaseAlerts: true,
        companyBulletinAlerts: true,
      }),
    },
    {
      category: 'SECURITY',
      key: 'security_policy',
      value: JSON.stringify({
        passwordMinLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: true,
        sessionTimeoutMins: 60,
        twoFactorAuthRequired: false,
        maxLoginAttempts: 5,
        lockoutDurationMins: 15,
      }),
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category },
      create: s,
    });
  }
  console.log('✅ System settings seeded for ATTENDANCE, LEAVE, PAYROLL, NOTIFICATIONS, and SECURITY.');

  // 4. Seed Product Updates
  const existingUpdates = await prisma.productUpdate.count();
  if (existingUpdates === 0) {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const adminId = adminUser ? adminUser.id : 'admin-fallback-id';

    const updates = [
      {
        title: 'ZenithHR 2.4: Unified Attendance Geofencing & Biometric Sync',
        category: 'Attendance',
        updateType: 'New',
        shortDescription: 'Introducing GPS-enabled geofenced check-in zones and zero-latency hardware biometric clock synchronization.',
        fullDescription: `We are thrilled to launch ZenithHR 2.4 with deep architectural upgrades to Attendance & Time Tracking.
        
### Key Highlights:
- **Geofenced Check-In Zones**: Office administrators can now define specific radial coordinates for branches. Mobile self-service punches validate device geolocation against authorized perimeter zones.
- **Biometric Hardware Bridge**: Seamless sync daemon for ZKTeco and Matrix fingerprint/face recognition terminals. Punches reflect in real-time on executive rosters.
- **Grace Period Flexibility**: Granular shift configurations now permit per-department grace buffers without automatic late penalties.`,
        image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
        publishDate: new Date('2026-09-20'),
        status: 'PUBLISHED',
      },
      {
        title: 'Tax Slabs FY 2026-27 & Auto Statutory Payroll Engine',
        category: 'Payroll',
        updateType: 'Improvement',
        shortDescription: 'Full statutory compliance with updated FY 2026-27 income tax brackets, EPF cap overrides, and one-click Form 16 generator.',
        fullDescription: `ZenithHR Payroll Engine has been updated with the latest Finance Act statutory revisions.
        
### What's Changed:
- **Updated Tax Slabs**: Automatic regime comparison tool (Old vs New Regime) during batch run.
- **EPF Wage Cap Logic**: Support for statutory minimum 15k threshold or unconstrained basic salary deductions.
- **Direct NEFT/RTGS Batch Export**: Download standard banking format CSV files for ICICI, HDFC, SBI corporate accounts.`,
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
        publishDate: new Date('2026-09-15'),
        status: 'PUBLISHED',
      },
      {
        title: 'ZenithHR Mobile App v3.2 Available on iOS & Android',
        category: 'Mobile App',
        updateType: 'Announcement',
        shortDescription: 'Native mobile experience refreshed with dark mode, offline punch caching, instant leave approval push notifications, and quick payslip downloads.',
        fullDescription: `The ZenithHR mobile companion app has received a comprehensive design overhaul.
        
### New Features:
- **Offline Attendance Buffering**: Never lose a punch due to poor elevator or basement connectivity.
- **Push Notification Approvals**: Managers can approve leaves or expense vouchers directly from the lock screen.
- **Dark Mode Support**: Fluid system dark mode matching modern smartphone ergonomics.`,
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
        publishDate: new Date('2026-09-08'),
        status: 'PUBLISHED',
      },
      {
        title: 'Next-Gen ATS Recruitment Pipeline & Candidate Scoring',
        category: 'Recruitment',
        updateType: 'New',
        shortDescription: '7-stage visual Kanban board, resume parser, automated interview scheduling, and structured interviewer scorecards.',
        fullDescription: `Hiring managers and talent acquisition teams can now leverage our rebuilt Recruitment ATS module.
        
### Highlights:
- **7-Stage Kanban Progression**: Real-time drag and click stage advancement.
- **Candidate Evaluation Cards**: Score candidates on technical rigor, cultural fit, and communication skills.
- **Offer Letter Dispatch**: Auto-generate offer documents with parameterized CTC breakdown.`,
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
        publishDate: new Date('2026-09-01'),
        status: 'PUBLISHED',
      },
      {
        title: 'Enhanced Vault Document Security & Role-Based KYC Verification',
        category: 'Security',
        updateType: 'Update',
        shortDescription: 'Enterprise AES-256 document encryption at rest with two-tier verification workflows for legal compliance files.',
        fullDescription: `Security and data privacy remain our core tenets. We have enhanced the Document Management Vault with strict privacy fencing.
        
### Security Protocols:
- **Encrypted Storage**: Documents uploaded to the vault are safeguarded with strict access policies.
- **Audit Trails**: Every view, download, or verification is immutably logged with timestamp and user attribution.`,
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
        publishDate: new Date('2026-08-25'),
        status: 'PUBLISHED',
      },
      {
        title: 'Upcoming: AI-Powered Smart Appraisal Summary & OKR Insights',
        category: 'Performance',
        updateType: 'New',
        shortDescription: 'Sneak peek at our upcoming continuous feedback engine, automated goal achievement forecasting, and 360-degree review analytics.',
        fullDescription: `Preview of ZenithHR Q4 Performance Suite.
        
This update is currently in private preview with select enterprise tier accounts. Scheduled for general availability next sprint.`,
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        publishDate: new Date('2026-10-10'),
        status: 'SCHEDULED',
      },
    ];

    for (const u of updates) {
      const created = await prisma.productUpdate.create({ data: u });
      await prisma.productUpdateReaction.create({
        data: {
          updateId: created.id,
          userId: adminId,
          type: 'LIKE',
        },
      });
      await prisma.productUpdateComment.create({
        data: {
          updateId: created.id,
          userId: adminId,
          userName: 'Empire Admin',
          userRole: 'ADMIN',
          comment: 'The engineering team has rolled out these capabilities to production. Please review.',
        },
      });
    }
    console.log(`✅ Seeded ${updates.length} Product Updates with reactions and comments.`);
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
