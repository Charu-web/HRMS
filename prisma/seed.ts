import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting ZenithHR Database Seeding...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobOpening.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.performanceCycle.deleteMany();
  await prisma.document.deleteMany();
  await prisma.expenseClaim.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payrollMonth.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.attendanceCorrection.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.department.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.company.deleteMany();

  const passwordHashAdmin = await bcrypt.hash("Admin@123", 10);
  const passwordHashManager = await bcrypt.hash("Manager@123", 10);
  const passwordHashEmployee = await bcrypt.hash("Employee@123", 10);
  const defaultPasswordHash = await bcrypt.hash("Password@123", 10);

  // 1. Company
  const company = await prisma.company.create({
    data: {
      name: "Zenith Innovations Technologies Pvt Ltd",
      code: "ZENITH",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&h=128&fit=crop&crop=faces",
      website: "https://zenithhr.example.com",
      email: "contact@zenithhr.example.com",
      phone: "+91 80 4123 9000",
      address: "Prestige Tech Park, Outer Ring Road, Marathahalli",
      city: "Bengaluru",
      country: "India",
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
  });

  // 2. Branches
  const bngBranch = await prisma.branch.create({
    data: {
      name: "Bengaluru HQ (Prestige Tech Park)",
      code: "BLR-01",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      companyId: company.id,
    },
  });

  const mumBranch = await prisma.branch.create({
    data: {
      name: "Mumbai Financial Hub (BKC)",
      code: "MUM-01",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      companyId: company.id,
    },
  });

  const delBranch = await prisma.branch.create({
    data: {
      name: "Delhi NCR Regional Office (Cyber City)",
      code: "DEL-01",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      companyId: company.id,
    },
  });

  // 3. Departments
  const deptEng = await prisma.department.create({
    data: {
      name: "Engineering & Technology",
      code: "ENG",
      description: "Software development, architecture, QA and DevOps",
      companyId: company.id,
    },
  });

  const deptHR = await prisma.department.create({
    data: {
      name: "Human Resources",
      code: "HR",
      description: "People operations, talent acquisition, culture and payroll",
      companyId: company.id,
    },
  });

  const deptFin = await prisma.department.create({
    data: {
      name: "Finance & Accounts",
      code: "FIN",
      description: "Financial planning, auditing, tax and bookkeeping",
      companyId: company.id,
    },
  });

  const deptSales = await prisma.department.create({
    data: {
      name: "Sales & Marketing",
      code: "MKT",
      description: "Client acquisition, brand growth and enterprise accounts",
      companyId: company.id,
    },
  });

  const deptOps = await prisma.department.create({
    data: {
      name: "Operations & IT Support",
      code: "OPS",
      description: "Internal operations, facility management and IT helpdesk",
      companyId: company.id,
    },
  });

  // 4. Designations
  const desVpEng = await prisma.designation.create({
    data: { name: "VP of Engineering", code: "VP-ENG", departmentId: deptEng.id },
  });
  const desEngMgr = await prisma.designation.create({
    data: { name: "Engineering Manager", code: "ENG-MGR", departmentId: deptEng.id },
  });
  const desSrFull = await prisma.designation.create({
    data: { name: "Senior Full Stack Engineer", code: "SR-FSE", departmentId: deptEng.id },
  });
  const desFrontend = await prisma.designation.create({
    data: { name: "Frontend Developer", code: "FE-DEV", departmentId: deptEng.id },
  });
  const desBackend = await prisma.designation.create({
    data: { name: "Backend Developer", code: "BE-DEV", departmentId: deptEng.id },
  });
  const desQA = await prisma.designation.create({
    data: { name: "QA Automation Engineer", code: "QA-ENG", departmentId: deptEng.id },
  });
  const desDevOps = await prisma.designation.create({
    data: { name: "DevOps Engineer", code: "DEVOPS", departmentId: deptEng.id },
  });

  const desHrDir = await prisma.designation.create({
    data: { name: "HR Director", code: "HR-DIR", departmentId: deptHR.id },
  });
  const desHrGen = await prisma.designation.create({
    data: { name: "HR Generalist", code: "HR-GEN", departmentId: deptHR.id },
  });
  const desRecruiter = await prisma.designation.create({
    data: { name: "Talent Acquisition Specialist", code: "TA-SPEC", departmentId: deptHR.id },
  });

  const desCFO = await prisma.designation.create({
    data: { name: "Chief Financial Officer", code: "CFO", departmentId: deptFin.id },
  });
  const desAccMgr = await prisma.designation.create({
    data: { name: "Finance Manager", code: "FIN-MGR", departmentId: deptFin.id },
  });
  const desAcc = await prisma.designation.create({
    data: { name: "Senior Accountant", code: "SR-ACC", departmentId: deptFin.id },
  });

  const desSalesDir = await prisma.designation.create({
    data: { name: "Head of Growth & Sales", code: "SALES-DIR", departmentId: deptSales.id },
  });
  const desSalesExec = await prisma.designation.create({
    data: { name: "Senior Account Executive", code: "SR-AE", departmentId: deptSales.id },
  });
  const desMktSpec = await prisma.designation.create({
    data: { name: "Digital Marketing Specialist", code: "MKT-SPEC", departmentId: deptSales.id },
  });

  const desOpsMgr = await prisma.designation.create({
    data: { name: "Operations Manager", code: "OPS-MGR", departmentId: deptOps.id },
  });

  // 5. Shifts
  const shiftGeneral = await prisma.shift.create({
    data: {
      name: "General Shift",
      startTime: "09:00",
      endTime: "18:00",
      gracePeriodMins: 15,
      breakDurationMins: 60,
      weeklyOffDays: "Saturday, Sunday",
      companyId: company.id,
    },
  });

  const shiftMorning = await prisma.shift.create({
    data: {
      name: "Morning Shift",
      startTime: "07:00",
      endTime: "16:00",
      gracePeriodMins: 10,
      breakDurationMins: 60,
      weeklyOffDays: "Sunday",
      companyId: company.id,
    },
  });

  const shiftEvening = await prisma.shift.create({
    data: {
      name: "Evening Shift",
      startTime: "14:00",
      endTime: "23:00",
      gracePeriodMins: 15,
      breakDurationMins: 60,
      weeklyOffDays: "Sunday",
      companyId: company.id,
    },
  });

  // 6. Leave Types
  const leaveTypesData = [
    { name: "Casual Leave", code: "CL", daysAllowed: 12, isPaid: true, color: "#3B82F6", description: "Personal matters and urgent errands" },
    { name: "Sick Leave", code: "SL", daysAllowed: 10, isPaid: true, color: "#EF4444", description: "Medical reasons and illness" },
    { name: "Earned Leave", code: "EL", daysAllowed: 15, isPaid: true, color: "#10B981", carryForward: true, description: "Privilege/annual accrued leave" },
    { name: "Paid Leave", code: "PL", daysAllowed: 12, isPaid: true, color: "#8B5CF6", description: "Paid time off for general needs" },
    { name: "Unpaid Leave", code: "UL", daysAllowed: 30, isPaid: false, color: "#6B7280", description: "Leave without pay" },
    { name: "Optional Holiday", code: "OH", daysAllowed: 2, isPaid: true, color: "#F59E0B", description: "Restricted religious or cultural holidays" },
  ];

  const leaveTypes: Record<string, any> = {};
  for (const lt of leaveTypesData) {
    leaveTypes[lt.code] = await prisma.leaveType.create({ data: lt });
  }

  // 7. Holidays
  const holidaysData = [
    { name: "Republic Day", date: new Date(2026, 0, 26), description: "National Holiday", year: 2026 },
    { name: "Maha Shivratri", date: new Date(2026, 1, 17), description: "Festival of Shiva", isOptional: true, year: 2026 },
    { name: "Holi", date: new Date(2026, 2, 4), description: "Festival of Colors", year: 2026 },
    { name: "Good Friday", date: new Date(2026, 3, 3), description: "Christian Holiday", year: 2026 },
    { name: "Eid-ul-Fitr", date: new Date(2026, 2, 20), description: "Islamic Holiday", year: 2026 },
    { name: "Independence Day", date: new Date(2026, 7, 15), description: "National Holiday", year: 2026 },
    { name: "Ganesh Chaturthi", date: new Date(2026, 8, 14), description: "Hindu Festival", isOptional: true, year: 2026 },
    { name: "Gandhi Jayanti", date: new Date(2026, 9, 2), description: "National Holiday", year: 2026 },
    { name: "Dussehra", date: new Date(2026, 9, 20), description: "Vijayadashami", year: 2026 },
    { name: "Diwali (Deepavali)", date: new Date(2026, 10, 8), description: "Festival of Lights", year: 2026 },
    { name: "Christmas Day", date: new Date(2026, 11, 25), description: "Christmas Celebration", year: 2026 },
  ];

  for (const h of holidaysData) {
    await prisma.holiday.create({ data: h });
  }

  // 8. Create Key Users & Employees
  // Admin User (Admin / Admin@123)
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@zenithhrms.com",
      passwordHash: passwordHashAdmin,
      role: "ADMIN",
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      employeeCode: "EMP-1001",
      firstName: "Rajesh",
      lastName: "Sharma",
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      gender: "Male",
      dateOfBirth: new Date("1984-06-15"),
      email: "admin@zenithhrms.com",
      phone: "+91 98450 12345",
      alternatePhone: "+91 98450 99999",
      address: "402, Palm Meadows, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      postalCode: "560066",
      joiningDate: new Date("2020-01-10"),
      status: "ACTIVE",
      departmentId: deptHR.id,
      designationId: desHrDir.id,
      branchId: bngBranch.id,
      shiftId: shiftGeneral.id,
      employmentType: "FULL_TIME",
      workLocation: "OFFICE",
      bankName: "HDFC Bank",
      accountNumber: "50100234981123",
      ifscCode: "HDFC0001234",
      panNumber: "ABCPS1234F",
      uanNumber: "100908234123",
      emergencyContactName: "Sunita Sharma",
      emergencyContactRelation: "Spouse",
      emergencyContactPhone: "+91 98450 88888",
      userId: adminUser.id,
    },
  });

  // Manager User (Manager / Manager@123)
  const managerUser = await prisma.user.create({
    data: {
      email: "manager@zenithhrms.com",
      passwordHash: passwordHashManager,
      role: "MANAGER",
    },
  });

  const managerEmployee = await prisma.employee.create({
    data: {
      employeeCode: "EMP-1002",
      firstName: "Priya",
      lastName: "Nair",
      profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
      gender: "Female",
      dateOfBirth: new Date("1989-11-23"),
      email: "manager@zenithhrms.com",
      phone: "+91 98765 43210",
      alternatePhone: "+91 98765 11111",
      address: "12A, Sobha Silicon Oasis, HSR Layout",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      postalCode: "560102",
      joiningDate: new Date("2021-03-15"),
      status: "ACTIVE",
      departmentId: deptEng.id,
      designationId: desEngMgr.id,
      branchId: bngBranch.id,
      shiftId: shiftGeneral.id,
      managerId: adminEmployee.id,
      employmentType: "FULL_TIME",
      workLocation: "HYBRID",
      bankName: "ICICI Bank",
      accountNumber: "001105023912",
      ifscCode: "ICIC0000011",
      panNumber: "BHYPN8912K",
      uanNumber: "100908234124",
      emergencyContactName: "Arun Nair",
      emergencyContactRelation: "Spouse",
      emergencyContactPhone: "+91 98765 22222",
      userId: managerUser.id,
    },
  });

  // Employee User (Employee / Employee@123)
  const employeeUser = await prisma.user.create({
    data: {
      email: "employee@zenithhrms.com",
      passwordHash: passwordHashEmployee,
      role: "EMPLOYEE",
    },
  });

  const regularEmployee = await prisma.employee.create({
    data: {
      employeeCode: "EMP-1003",
      firstName: "Aarav",
      lastName: "Patel",
      profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      gender: "Male",
      dateOfBirth: new Date("1995-04-18"),
      email: "employee@zenithhrms.com",
      phone: "+91 98111 22334",
      alternatePhone: "+91 98111 55667",
      address: "B-304, Mantri Espana, Bellandur",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      postalCode: "560103",
      joiningDate: new Date("2022-07-01"),
      status: "ACTIVE",
      departmentId: deptEng.id,
      designationId: desSrFull.id,
      branchId: bngBranch.id,
      shiftId: shiftGeneral.id,
      managerId: managerEmployee.id,
      employmentType: "FULL_TIME",
      workLocation: "OFFICE",
      bankName: "Axis Bank",
      accountNumber: "91901004561234",
      ifscCode: "UTIB0000919",
      panNumber: "CKLPP4512M",
      uanNumber: "100908234125",
      emergencyContactName: "Ramesh Patel",
      emergencyContactRelation: "Father",
      emergencyContactPhone: "+91 98111 77889",
      userId: employeeUser.id,
    },
  });

  // Additional 28+ Employees across departments to total 31 employees
  const otherEmployeesData = [
    { code: "EMP-1004", fn: "Vikram", ln: "Aditya", gen: "Male", email: "vikram.aditya@zenithhrms.com", dob: "1982-08-10", dept: deptEng, des: desVpEng, br: bngBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "MANAGER", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
    { code: "EMP-1005", fn: "Ananya", ln: "Deshmukh", gen: "Female", email: "ananya.d@zenithhrms.com", dob: "1996-03-12", dept: deptEng, des: desFrontend, br: bngBranch, shift: shiftGeneral, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    { code: "EMP-1006", fn: "Rohan", ln: "Verma", gen: "Male", email: "rohan.verma@zenithhrms.com", dob: "1997-09-25", dept: deptEng, des: desBackend, br: bngBranch, shift: shiftGeneral, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150" },
    { code: "EMP-1007", fn: "Sneha", ln: "Reddy", gen: "Female", email: "sneha.reddy@zenithhrms.com", dob: "1994-12-05", dept: deptEng, des: desQA, br: bngBranch, shift: shiftMorning, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
    { code: "EMP-1008", fn: "Karthik", ln: "Subramanian", gen: "Male", email: "karthik.s@zenithhrms.com", dob: "1991-05-19", dept: deptEng, des: desDevOps, br: bngBranch, shift: shiftEvening, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
    { code: "EMP-1009", fn: "Meera", ln: "Kapoor", gen: "Female", email: "meera.kapoor@zenithhrms.com", dob: "1993-02-14", dept: deptHR, des: desHrGen, br: bngBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150" },
    { code: "EMP-1010", fn: "Amit", ln: "Bansal", gen: "Male", email: "amit.bansal@zenithhrms.com", dob: "1992-10-30", dept: deptHR, des: desRecruiter, br: bngBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
    { code: "EMP-1011", fn: "Sunil", ln: "Khurana", gen: "Male", email: "sunil.khurana@zenithhrms.com", dob: "1980-04-11", dept: deptFin, des: desCFO, br: mumBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "MANAGER", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150" },
    { code: "EMP-1012", fn: "Divya", ln: "Iyer", gen: "Female", email: "divya.iyer@zenithhrms.com", dob: "1988-07-22", dept: deptFin, des: desAccMgr, br: mumBranch, shift: shiftGeneral, mgr: null, role: "MANAGER", photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150" },
    { code: "EMP-1013", fn: "Gaurav", ln: "Chopra", gen: "Male", email: "gaurav.c@zenithhrms.com", dob: "1995-11-09", dept: deptFin, des: desAcc, br: mumBranch, shift: shiftGeneral, mgr: null, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" },
    { code: "EMP-1014", fn: "Neha", ln: "Singhania", gen: "Female", email: "neha.s@zenithhrms.com", dob: "1985-01-28", dept: deptSales, des: desSalesDir, br: delBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "MANAGER", photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150" },
    { code: "EMP-1015", fn: "Arjun", ln: "Mehta", gen: "Male", email: "arjun.mehta@zenithhrms.com", dob: "1993-08-16", dept: deptSales, des: desSalesExec, br: delBranch, shift: shiftGeneral, mgr: null, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150" },
    { code: "EMP-1016", fn: "Tanvi", ln: "Bhatia", gen: "Female", email: "tanvi.bhatia@zenithhrms.com", dob: "1997-06-03", dept: deptSales, des: desMktSpec, br: delBranch, shift: shiftGeneral, mgr: null, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
    { code: "EMP-1017", fn: "Kishore", ln: "Kumar", gen: "Male", email: "kishore.kumar@zenithhrms.com", dob: "1987-03-31", dept: deptOps, des: desOpsMgr, br: bngBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "MANAGER", photo: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150" },
    { code: "EMP-1018", fn: "Pooja", ln: "Hegde", gen: "Female", email: "pooja.hegde@zenithhrms.com", dob: "1998-12-14", dept: deptEng, des: desFrontend, br: bngBranch, shift: shiftGeneral, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150" },
    { code: "EMP-1019", fn: "Sanjay", ln: "Rao", gen: "Male", email: "sanjay.rao@zenithhrms.com", dob: "1994-09-08", dept: deptEng, des: desBackend, br: bngBranch, shift: shiftGeneral, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150" },
    { code: "EMP-1020", fn: "Deepika", ln: "Padukone", gen: "Female", email: "deepika.p@zenithhrms.com", dob: "1996-05-21", dept: deptHR, des: desRecruiter, br: bngBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
    { code: "EMP-1021", fn: "Manish", ln: "Pandey", gen: "Male", email: "manish.pandey@zenithhrms.com", dob: "1993-10-10", dept: deptFin, des: desAcc, br: mumBranch, shift: shiftGeneral, mgr: null, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    { code: "EMP-1022", fn: "Shreya", ln: "Ghoshal", gen: "Female", email: "shreya.ghoshal@zenithhrms.com", dob: "1995-03-12", dept: deptSales, des: desSalesExec, br: delBranch, shift: shiftGeneral, mgr: null, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
    { code: "EMP-1023", fn: "Varun", ln: "Dhawan", gen: "Male", email: "varun.dhawan@zenithhrms.com", dob: "1992-04-24", dept: deptEng, des: desQA, br: bngBranch, shift: shiftGeneral, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
    { code: "EMP-1024", fn: "Alia", ln: "Bhatt", gen: "Female", email: "alia.bhatt@zenithhrms.com", dob: "1997-03-15", dept: deptSales, des: desMktSpec, br: delBranch, shift: shiftGeneral, mgr: null, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    { code: "EMP-1025", fn: "Ranbir", ln: "Kapoor", gen: "Male", email: "ranbir.kapoor@zenithhrms.com", dob: "1990-09-28", dept: deptEng, des: desSrFull, br: bngBranch, shift: shiftGeneral, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150" },
    { code: "EMP-1026", fn: "Kriti", ln: "Sanon", gen: "Female", email: "kriti.sanon@zenithhrms.com", dob: "1994-07-27", dept: deptHR, des: desHrGen, br: bngBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150" },
    { code: "EMP-1027", fn: "Ayushmann", ln: "Khurrana", gen: "Male", email: "ayushmann.k@zenithhrms.com", dob: "1991-09-14", dept: deptFin, des: desAcc, br: mumBranch, shift: shiftGeneral, mgr: null, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
    { code: "EMP-1028", fn: "Taapsee", ln: "Pannu", gen: "Female", email: "taapsee.p@zenithhrms.com", dob: "1993-08-01", dept: deptEng, des: desDevOps, br: bngBranch, shift: shiftEvening, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150" },
    { code: "EMP-1029", fn: "Rajkummar", ln: "Rao", gen: "Male", email: "rajkummar.rao@zenithhrms.com", dob: "1990-08-31", dept: deptEng, des: desBackend, br: bngBranch, shift: shiftGeneral, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
    { code: "EMP-1030", fn: "Bhumi", ln: "Pednekar", gen: "Female", email: "bhumi.p@zenithhrms.com", dob: "1995-07-18", dept: deptOps, des: desOpsMgr, br: mumBranch, shift: shiftGeneral, mgr: adminEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150" },
    { code: "EMP-1031", fn: "Vicky", ln: "Kaushal", gen: "Male", email: "vicky.kaushal@zenithhrms.com", dob: "1992-05-16", dept: deptSales, des: desSalesExec, br: delBranch, shift: shiftGeneral, mgr: null, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" },
    { code: "EMP-1032", fn: "Katrina", ln: "Kaif", gen: "Female", email: "katrina.kaif@zenithhrms.com", dob: "1991-07-16", dept: deptEng, des: desFrontend, br: bngBranch, shift: shiftGeneral, mgr: managerEmployee.id, role: "EMPLOYEE", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  ];

  const allEmployees = [adminEmployee, managerEmployee, regularEmployee];

  for (const item of otherEmployeesData) {
    const user = await prisma.user.create({
      data: {
        email: item.email,
        passwordHash: defaultPasswordHash,
        role: item.role,
      },
    });

    const emp = await prisma.employee.create({
      data: {
        employeeCode: item.code,
        firstName: item.fn,
        lastName: item.ln,
        profilePhoto: item.photo,
        gender: item.gen,
        dateOfBirth: new Date(item.dob),
        email: item.email,
        phone: `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`,
        address: `${Math.floor(10 + Math.random() * 900)}, Tech Residency, Sector 4`,
        city: item.br.city,
        state: item.br.state,
        country: "India",
        postalCode: "560100",
        joiningDate: new Date(2023, Math.floor(Math.random() * 11), Math.floor(1 + Math.random() * 25)),
        status: "ACTIVE",
        departmentId: item.dept.id,
        designationId: item.des.id,
        branchId: item.br.id,
        shiftId: item.shift.id,
        managerId: item.mgr || managerEmployee.id,
        employmentType: "FULL_TIME",
        workLocation: Math.random() > 0.3 ? "OFFICE" : "HYBRID",
        bankName: "HDFC Bank",
        accountNumber: `50100${Math.floor(100000000 + Math.random() * 900000000)}`,
        ifscCode: "HDFC0001889",
        panNumber: `ABCDE${Math.floor(1000 + Math.random() * 8999)}F`,
        uanNumber: `10090${Math.floor(1000000 + Math.random() * 8999999)}`,
        emergencyContactName: "Family Contact",
        emergencyContactRelation: "Parent",
        emergencyContactPhone: "+91 99000 11223",
        userId: user.id,
      },
    });

    allEmployees.push(emp);
  }

  console.log(`✅ Seeded ${allEmployees.length} employees & users.`);

  // 9. Leave Balances for all employees
  for (const emp of allEmployees) {
    for (const lt of Object.values(leaveTypes)) {
      const used = Math.floor(Math.random() * 3);
      await prisma.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: 2026,
          allocatedDays: lt.daysAllowed,
          usedDays: used,
          pendingDays: 0,
        },
      });
    }
  }

  // 10. Sample Leave Requests
  const today = new Date();
  await prisma.leaveRequest.create({
    data: {
      employeeId: regularEmployee.id,
      leaveTypeId: leaveTypes["CL"].id,
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
      totalDays: 2,
      reason: "Family wedding and personal commitments in hometown.",
      status: "PENDING",
      managerRemarks: null,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: regularEmployee.id,
      leaveTypeId: leaveTypes["SL"].id,
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10),
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 9),
      totalDays: 2,
      reason: "Severe viral fever and physician recommended rest.",
      status: "APPROVED",
      managerRemarks: "Approved. Take care.",
      hrRemarks: "Processed in payroll.",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: allEmployees[4].id,
      leaveTypeId: leaveTypes["EL"].id,
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12),
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 16),
      totalDays: 5,
      reason: "Annual family vacation.",
      status: "PENDING",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: allEmployees[5].id,
      leaveTypeId: leaveTypes["CL"].id,
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
      totalDays: 1,
      reason: "Home internet installation and maintenance.",
      status: "PENDING",
    },
  });

  // 11. Attendance Records for past 14 days for all employees
  console.log("Generating realistic attendance records...");
  for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
    const recordDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOffset);
    const dayOfWeek = recordDate.getDay(); // 0 is Sunday, 6 is Saturday

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const emp of allEmployees) {
      if (isWeekend) {
        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: recordDate,
            status: "WEEK_OFF",
            workHours: 0,
            breakHours: 0,
            overtimeHours: 0,
          },
        });
      } else {
        // Randomly simulate present, late, or leave
        const rand = Math.random();
        let status = "PRESENT";
        let isLate = false;
        let workHours = 8.5;
        let checkInHour = 9;
        let checkInMinute = Math.floor(Math.random() * 15);
        let checkOutHour = 18;
        let checkOutMinute = Math.floor(Math.random() * 30);

        if (rand < 0.05 && dayOffset > 0) {
          status = "ABSENT";
          workHours = 0;
        } else if (rand < 0.12 && dayOffset > 0) {
          status = "ON_LEAVE";
          workHours = 0;
        } else if (rand < 0.25) {
          isLate = true;
          checkInHour = 9;
          checkInMinute = 25 + Math.floor(Math.random() * 20);
          workHours = 7.8;
        }

        const checkIn = status === "PRESENT" ? new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), checkInHour, checkInMinute) : null;
        const checkOut = status === "PRESENT" && (dayOffset > 0 || Math.random() > 0.5) ? new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), checkOutHour, checkOutMinute) : null;

        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: recordDate,
            status,
            checkIn,
            checkOut,
            checkInLocation: "Office Biometric - Main Gate",
            checkOutLocation: checkOut ? "Office Biometric - Exit Turnstile" : null,
            workHours: status === "PRESENT" ? workHours : 0,
            breakHours: status === "PRESENT" ? 1.0 : 0,
            overtimeHours: workHours > 8.5 ? workHours - 8.5 : 0,
            isLate,
            isEarlyExit: false,
          },
        });
      }
    }
  }

  // Regularization request for Aarav Patel
  const aaravYesterdayAttendance = await prisma.attendance.findFirst({
    where: { employeeId: regularEmployee.id, status: "PRESENT", isLate: true },
  });
  if (aaravYesterdayAttendance) {
    await prisma.attendanceCorrection.create({
      data: {
        attendanceId: aaravYesterdayAttendance.id,
        employeeId: regularEmployee.id,
        date: aaravYesterdayAttendance.date,
        requestedCheckIn: new Date(aaravYesterdayAttendance.date.setHours(9, 5)),
        requestedCheckOut: new Date(aaravYesterdayAttendance.date.setHours(18, 30)),
        reason: "Biometric reader failed to capture fingerprint on entry. Security gate registry verified.",
        status: "PENDING",
      },
    });
  }

  // 12. Salary Structure for Employees
  console.log("Setting up salary structures and payslips...");
  for (const emp of allEmployees) {
    const isExec = emp.id === adminEmployee.id || emp.id === managerEmployee.id;
    const base = isExec ? 75000 : 40000 + Math.floor(Math.random() * 25000);
    const hra = Math.round(base * 0.5);
    const special = Math.round(base * 0.3);
    const conveyance = 2000;
    const medical = 1500;
    const epf = 1800;
    const pt = 200;
    const tds = Math.round(base * 0.08);
    const gross = base + hra + special + conveyance + medical;
    const net = gross - (epf + pt + tds);

    await prisma.salaryStructure.create({
      data: {
        employeeId: emp.id,
        basicSalary: base,
        hra,
        specialAllowance: special,
        conveyance,
        medicalAllowance: medical,
        epfEmployee: epf,
        epfEmployer: epf,
        professionalTax: pt,
        tds,
        grossSalary: gross,
        netSalary: net,
      },
    });
  }

  // 13. Payroll Months & Payslips
  const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

  const payrollMonth = await prisma.payrollMonth.create({
    data: {
      month: prevMonth,
      year: prevYear,
      status: "PAID",
      processedAt: new Date(prevYear, prevMonth - 1, 28),
      totalEmployees: allEmployees.length,
      totalGross: allEmployees.length * 68000,
      totalDeductions: allEmployees.length * 6000,
      totalNet: allEmployees.length * 62000,
    },
  });

  for (const emp of allEmployees) {
    const sal = await prisma.salaryStructure.findUnique({ where: { employeeId: emp.id } });
    if (sal) {
      await prisma.payslip.create({
        data: {
          payrollMonthId: payrollMonth.id,
          employeeId: emp.id,
          month: prevMonth,
          year: prevYear,
          basicSalary: sal.basicSalary,
          hra: sal.hra,
          specialAllowance: sal.specialAllowance,
          conveyance: sal.conveyance,
          medicalAllowance: sal.medicalAllowance,
          overtimeAmount: 1200,
          bonusAmount: 0,
          grossEarnings: sal.grossSalary + 1200,
          epfDeduction: sal.epfEmployee,
          professionalTax: sal.professionalTax,
          tdsDeduction: sal.tds,
          otherDeductions: 0,
          totalDeductions: sal.epfEmployee + sal.professionalTax + sal.tds,
          netSalary: sal.netSalary + 1200,
          workingDays: 30,
          presentDays: 28,
          paidLeaveDays: 2,
          lopDays: 0,
          paymentStatus: "PAID",
          paymentDate: new Date(prevYear, prevMonth - 1, 30),
        },
      });
    }
  }

  // 14. Expense Claims
  await prisma.expenseClaim.create({
    data: {
      employeeId: regularEmployee.id,
      title: "Client Onsite Meeting - Airport Cab & Meals",
      category: "TRAVEL",
      amount: 2450,
      description: "Round trip Uber from office to Bangalore Kempegowda International Airport for Enterprise Client POC kickoff.",
      receiptUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
      status: "APPROVED",
      reviewerRemarks: "Verified with itinerary. Approved for reimbursement.",
      reimbursedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
    },
  });

  await prisma.expenseClaim.create({
    data: {
      employeeId: regularEmployee.id,
      title: "Annual Cloud Architecture Exam Certification Fee",
      category: "SUPPLIES",
      amount: 14999,
      description: "AWS Certified Solutions Architect - Professional exam fee reimbursement as approved by tech lead.",
      receiptUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
      status: "PENDING",
    },
  });

  await prisma.expenseClaim.create({
    data: {
      employeeId: managerEmployee.id,
      title: "Quarterly Team Dinner & Sprint Celebration",
      category: "MEALS",
      amount: 8750,
      description: "Sprint 42 completion team dinner with 8 engineers at Smoke House Deli, Indiranagar.",
      receiptUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
      status: "PENDING",
    },
  });

  // 15. Documents
  const documentsData = [
    { title: "Employee Code of Conduct & Ethics Policy 2026", cat: "POLICY", file: "Code_of_Conduct_2026.pdf", isCo: true, empId: null },
    { title: "POSH (Prevention of Sexual Harassment) Policy", cat: "POLICY", file: "POSH_Policy_Zenith.pdf", isCo: true, empId: null },
    { title: "Comprehensive Health Insurance Policy Document", cat: "POLICY", file: "Group_Mediclaim_Policy.pdf", isCo: true, empId: null },
    { title: "Permanent Account Number (PAN Card)", cat: "IDENTIFICATION", file: "Aarav_Patel_PAN.pdf", isCo: false, empId: regularEmployee.id },
    { title: "Aadhaar Identity Card", cat: "IDENTIFICATION", file: "Aarav_Patel_Aadhaar.pdf", isCo: false, empId: regularEmployee.id },
    { title: "Master of Technology Degree Certificate", cat: "EDUCATION", file: "Degree_Certificate.pdf", isCo: false, empId: regularEmployee.id },
    { title: "Offer Letter & Signed Appointment Contract", cat: "CONTRACT", file: "Zenith_Offer_Letter_Signed.pdf", isCo: false, empId: regularEmployee.id },
  ];

  for (const doc of documentsData) {
    await prisma.document.create({
      data: {
        title: doc.title,
        category: doc.cat,
        fileName: doc.file,
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileSize: "1.4 MB",
        mimeType: "application/pdf",
        isCompanyDoc: doc.isCo,
        employeeId: doc.empId,
        verificationStatus: "VERIFIED",
      },
    });
  }

  // 16. Performance Cycle, Goals & Reviews
  const perfCycle = await prisma.performanceCycle.create({
    data: {
      title: "Annual Performance Appraisal Cycle 2025-2026",
      startDate: new Date(2025, 3, 1),
      endDate: new Date(2026, 2, 31),
      status: "ACTIVE",
      year: 2026,
    },
  });

  await prisma.goal.create({
    data: {
      employeeId: regularEmployee.id,
      cycleId: perfCycle.id,
      title: "Deliver Microservices Migration for Core Billing Engine",
      description: "Decompose legacy monolithic billing service into decoupled Golang/Node.js microservices with 99.99% uptime.",
      category: "TECHNICAL_EXCELLENCE",
      weightage: 40,
      progress: 85,
      status: "IN_PROGRESS",
      dueDate: new Date(2026, 11, 31),
    },
  });

  await prisma.goal.create({
    data: {
      employeeId: regularEmployee.id,
      cycleId: perfCycle.id,
      title: "Mentor 2 Junior Engineers & Conduct 15 Tech Interviews",
      description: "Pair program weekly with associate engineers and participate in engineering recruitment panels.",
      category: "LEADERSHIP_MENTORSHIP",
      weightage: 30,
      progress: 70,
      status: "IN_PROGRESS",
      dueDate: new Date(2026, 11, 31),
    },
  });

  await prisma.goal.create({
    data: {
      employeeId: regularEmployee.id,
      cycleId: perfCycle.id,
      title: "Improve Unit & Integration Test Coverage above 85%",
      description: "Implement automated CI test pipelines with Jest and Cypress.",
      category: "QUALITY",
      weightage: 30,
      progress: 100,
      status: "COMPLETED",
      dueDate: new Date(2026, 8, 30),
    },
  });

  await prisma.performanceReview.create({
    data: {
      cycleId: perfCycle.id,
      employeeId: regularEmployee.id,
      reviewerId: managerEmployee.id,
      selfRating: 4.5,
      managerRating: 4.8,
      finalRating: 4.7,
      selfFeedback: "Successfully met all architectural targets, spearheaded zero-downtime releases, and mentored the onboarding batch.",
      managerFeedback: "Exceptional contributor. Aarav demonstrates strong technical depth and consistent ownership of deliverables.",
      status: "REVIEWED",
      completedAt: new Date(),
    },
  });

  // 17. Recruitment ATS
  const jobFrontend = await prisma.jobOpening.create({
    data: {
      title: "Senior React / Next.js Engineer",
      departmentId: deptEng.id,
      designationId: desFrontend.id,
      openingsCount: 3,
      experienceYears: "4-7 years",
      location: "Bengaluru HQ (Hybrid)",
      employmentType: "FULL_TIME",
      description: "We are seeking a seasoned frontend architect proficient in Next.js 14+, React Server Components, TypeScript and high-performance web applications.",
      requirements: "Proficiency in React, Next.js, Tailwind CSS, TypeScript, REST & GraphQL APIs.",
      status: "OPEN",
    },
  });

  const jobBackend = await prisma.jobOpening.create({
    data: {
      title: "Staff Node.js / Distributed Systems Engineer",
      departmentId: deptEng.id,
      designationId: desBackend.id,
      openingsCount: 2,
      experienceYears: "6-10 years",
      location: "Bengaluru HQ (Hybrid)",
      employmentType: "FULL_TIME",
      description: "Lead the core backend distributed systems architecture, event-driven pipelines, and database optimization.",
      requirements: "Strong fundamentals in Node.js, PostgreSQL, Redis, Kafka, Docker and Kubernetes.",
      status: "OPEN",
    },
  });

  const jobRecruiter = await prisma.jobOpening.create({
    data: {
      title: "Lead Technical Recruiter",
      departmentId: deptHR.id,
      designationId: desRecruiter.id,
      openingsCount: 1,
      experienceYears: "3-5 years",
      location: "Bengaluru HQ",
      employmentType: "FULL_TIME",
      description: "Spearhead technical talent acquisition across frontend, backend, AI and DevOps teams.",
      requirements: "Proven track record in tech startup hiring, ATS systems, and candidate experience.",
      status: "OPEN",
    },
  });

  // Candidates across stages
  const cand1 = await prisma.candidate.create({
    data: {
      jobOpeningId: jobFrontend.id,
      fullName: "Siddharth Malhotra",
      email: "siddharth.m@gmail.com",
      phone: "+91 99887 76655",
      currentCompany: "Infosys Labs",
      currentCtc: 1800000,
      expectedCtc: 2400000,
      noticePeriodDays: 30,
      status: "INTERVIEW",
      stageNotes: "Cleared coding challenge with 98% score. Technical Round 1 scheduled.",
      rating: 4,
    },
  });

  await prisma.interview.create({
    data: {
      candidateId: cand1.id,
      roundName: "Technical Architecture & System Design",
      scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 30),
      durationMinutes: 60,
      interviewerName: "Priya Nair (Engineering Manager)",
      meetingLink: "https://meet.google.com/zen-tech-int",
      status: "SCHEDULED",
    },
  });

  const cand2 = await prisma.candidate.create({
    data: {
      jobOpeningId: jobFrontend.id,
      fullName: "Ankita Sen",
      email: "ankita.sen@yahoo.com",
      phone: "+91 99112 33445",
      currentCompany: "Swiggy Tech",
      currentCtc: 2200000,
      expectedCtc: 3000000,
      noticePeriodDays: 15,
      status: "OFFERED",
      stageNotes: "All 3 rounds cleared with flying colors. Offer letter dispatched with joining bonus.",
      rating: 5,
    },
  });

  await prisma.candidate.create({
    data: {
      jobOpeningId: jobBackend.id,
      fullName: "Abhishek Nambiar",
      email: "abhishek.nambiar@outlook.com",
      phone: "+91 98451 99887",
      currentCompany: "Razorpay",
      currentCtc: 2800000,
      expectedCtc: 3800000,
      noticePeriodDays: 60,
      status: "SCREENING",
      stageNotes: "Strong background in high-throughput transactional databases.",
      rating: 4,
    },
  });

  await prisma.candidate.create({
    data: {
      jobOpeningId: jobBackend.id,
      fullName: "Preeti Rao",
      email: "preeti.rao@gmail.com",
      phone: "+91 97412 88776",
      currentCompany: "PhonePe",
      currentCtc: 2500000,
      expectedCtc: 3200000,
      noticePeriodDays: 30,
      status: "SELECTED",
      stageNotes: "Final leadership debrief completed. Preparing formal offer proposal.",
      rating: 5,
    },
  });

  await prisma.candidate.create({
    data: {
      jobOpeningId: jobRecruiter.id,
      fullName: "Manav Joshi",
      email: "manav.j@gmail.com",
      phone: "+91 98220 54321",
      currentCompany: "TCS Talent Acquisition",
      currentCtc: 1200000,
      expectedCtc: 1600000,
      noticePeriodDays: 45,
      status: "APPLIED",
      stageNotes: "Resume screened and shortlisted for recruiter intro call.",
      rating: 3,
    },
  });

  // 18. Announcements
  await prisma.announcement.create({
    data: {
      title: "Zenith Annual Tech Hackathon & Innovation Summit 2026",
      content: "We are thrilled to announce Zenith Innovate 2026! A 48-hour global hackathon with cash prizes up to INR 5,00,000, exciting swags, and executive leadership pitches. Teams of 2-4 members can register on the internal portal before October 15.",
      priority: "IMPORTANT",
      category: "EVENT",
      publishedByName: "People & Culture Team",
      publishedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Updated Hybrid Work Policy & Flexible Hours Guidelines",
      content: "Starting next month, employees are encouraged to collaborate in-office on Tuesdays and Thursdays. Core collaboration hours are set between 10:30 AM and 4:30 PM. Please consult your respective reporting manager for team-specific arrangements.",
      priority: "GENERAL",
      category: "HR_POLICY",
      publishedByName: "Rajesh Sharma (HR Director)",
      publishedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Upcoming Holiday Notice: Dussehra & Diwali Schedule",
      content: "Please note that the corporate offices across Bengaluru, Mumbai, and Delhi will remain closed for Dussehra and Diwali celebrations as per the official holiday calendar. Early punch-out will be permitted on Diwali eve.",
      priority: "URGENT",
      category: "HOLIDAY",
      publishedByName: "HR Operations",
      publishedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
    },
  });

  // 19. Notifications
  await prisma.notification.create({
    data: {
      userId: regularEmployee.userId!,
      title: "Leave Approved",
      message: "Your Sick Leave request for 2 days has been approved by Priya Nair.",
      type: "LEAVE",
      linkUrl: "/leaves",
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: regularEmployee.userId!,
      title: "September Payslip Generated",
      message: "Your salary payslip for the month of September 2026 is now available for download.",
      type: "PAYROLL",
      linkUrl: "/payroll",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: regularEmployee.userId!,
      title: "Expense Claim Approved",
      message: "Your expense claim for Airport Cab (₹2,450) has been approved and processed for bank transfer.",
      type: "EXPENSE",
      linkUrl: "/expenses",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: managerEmployee.userId!,
      title: "Pending Leave Approval",
      message: "Aarav Patel has requested 2 days of Casual Leave for family wedding.",
      type: "LEAVE",
      linkUrl: "/leaves",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: adminEmployee.userId!,
      title: "Payroll Summary Ready",
      message: "Monthly payroll processing for 31 employees completed successfully.",
      type: "PAYROLL",
      linkUrl: "/payroll",
      isRead: false,
    },
  });

  // 20. Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userName: "Rajesh Sharma (Admin)",
      action: "PROCESS_PAYROLL",
      entity: "PayrollMonth",
      entityId: payrollMonth.id,
      details: "Processed monthly payroll for September 2026 across 31 employees. Total disbursed: ₹19,22,000.",
      ipAddress: "192.168.1.100",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: managerUser.id,
      userName: "Priya Nair (Manager)",
      action: "APPROVE_EXPENSE",
      entity: "ExpenseClaim",
      details: "Approved travel reimbursement ₹2,450 for Aarav Patel.",
      ipAddress: "192.168.1.104",
    },
  });

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
