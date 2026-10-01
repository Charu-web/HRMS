# ZenithHR - Production-Ready Enterprise HRMS Platform

> A Human Resource Management System inspired by FactoHR's enterprise workflows, built with Next.js 14, TypeScript, Tailwind CSS, Prisma ORM, and Recharts.

**Live Demo**: [https://hrms-chi-three.vercel.app](https://hrms-chi-three.vercel.app)  
**GitHub Repository**: [https://github.com/Charu-web/HRMS](https://github.com/Charu-web/HRMS)  

---

## 🌟 Overview & Highlights

ZenithHR is an enterprise-grade HRMS designed to streamline the entire employee lifecycle with responsive desktop and mobile PWA interfaces.

### Core Modules & Features

1. **Enterprise Dashboard**:
   - 9 Metric Cards: Total Headcount, Present Today, Absent Today, On Leave, New Joiners, Birthdays, Pending Leaves, Total Approvals, Monthly Payroll Disbursed.
   - Interactive Analytics (Recharts): 7-Day Attendance Trend area chart, Department Headcount bar chart, Gender and Employment Type distributions.
   - Live punch board, upcoming birthdays, upcoming gazetted holidays, announcements feed, and pending approval queues.

2. **Employee Management (CRUD & 8-Tab Profile)**:
   - Full directory with instant keyword search, department filtering, status filtering.
   - Comprehensive profile view with **8 tabs**:
     1. *Personal Information*: DOB, Gender, Contact numbers, Residential Address, Emergency contacts, Bank details, PAN/UAN.
     2. *Employment Details*: Designation, Department, Branch, Shift, Reporting Manager, Employment type, Work location, Joining date.
     3. *Attendance & Time*: Daily punches, work duration, overtime, late arrival flags.
     4. *Leave & Time-Off*: Entitled, used, and available balance meters per leave type.
     5. *Payroll & CTC*: Salary structure breakdown and issued payslips.
     6. *Document Vault*: KYC records, contracts, education certificates, verification status.
     7. *Performance & OKRs*: Active goals, progress sliders, and review ratings.
     8. *Activity & Audit*: Chronological history of user/admin actions.

3. **Organization Management & Visual Hierarchy**:
   - Interactive Organizational Chart visualizing executive leadership, department heads, managers, and direct subordinates.
   - Management of Departments, Branches, Designations, and Work Shifts.

4. **Attendance & Time Tracking**:
   - Web & mobile Punch In / Punch Out with real-time clock and location logging.
   - **Face Attendance Verification**: Real client-side webcam frame capture, 128-dimensional facial landmark vector extraction, user biometric consent recording, Euclidean distance/cosine similarity matching against enrolled face vector.
   - **GPS Geofencing**: High-precision GPS latitude/longitude/accuracy capture, office location registry with configurable radius, and Haversine formula distance verification.
   - Admin enforcement toggles: `requireFaceAttendance` and `requireGeofencing`.
   - Shift-based grace periods and automatic Late Arrival detection.
   - Monthly Attendance Calendar Grid with color-coded daily badges (Present, Absent, Leave, Weekend).
   - Attendance Regularization / Correction requests with Manager & HR approval loops.
   - Export attendance logs to CSV.

5. **Leave & Holiday Management**:
   - 6 Standard Leave Types: Casual Leave (CL), Sick Leave (SL), Earned Leave (EL), Paid Leave (PL), Unpaid Leave (UL), Optional Holiday (OH).
   - Multi-tier approval workflow: Employee → Manager → HR/Admin approval & rejection with reason.
   - Dynamic balance checks preventing over-application.
   - Gazetted national and restricted optional holiday calendar.

6. **Payroll & Compensation**:
   - Salary structures: Basic Salary, HRA, Special Allowance, Conveyance, Medical, Other Allowances, EPF, ESI, Professional Tax (PT), TDS, Loan & Leave Deductions, and Employer Contributions.
   - **Full Payroll Lifecycle**: Draft → Processing → Approved → Paid, with Month Locking (`isLocked`) to freeze salary calculations.
   - Department-wise filtering and batch processing.
   - **Configurable Salary Slip Templates**: Custom company logo, signatory name/title/signature, color themes, footer terms, and toggles for tax, leave, and bank details.
   - Printable & downloadable official Payslip layout.
   - **Strict isolation**: Employees only have access to their own salary records.

7. **Expense Claims & Reimbursements**:
   - Claim submission with category, amount, description, and bill preview.
   - Manager/Admin review, approval, rejection, and reimbursement tracking.

8. **Recruitment & ATS Pipeline**:
   - Job Openings management.
   - 7-Stage Kanban Board: Applied → Screening → Interview → Selected → Offered → Joined → Rejected.
   - Candidate details, CTC, notice period, rating, and stage progression.

9. **Performance Management**:
   - Appraisal cycles, goals with percentage sliders (0% - 100%), self-assessments, manager ratings (1-5 stars) and feedback.

10. **Document Management Vault**:
    - Company-wide policies (Code of Conduct, POSH policy, Insurance) and employee KYC documents.
    - Status badges (Verified, Pending).

11. **Company Announcements**:
    - Priority-flagged bulletins (Urgent, Important, General, Event) with automatic broadcast to all in-app notification centers.

12. **In-App Notification Center**:
    - Real-time unread count badge, category indicators, mark-all-as-read.

13. **Reporting & Analytics Engine**:
    - 5 Standard Registers: Employee Master, Attendance Logs, Leave Summary, Payroll Register, Expense Claims.
    - One-click CSV Export and Print Preview.

14. **Admin Settings & Security**:
    - Organization profile editor.
    - Role-based access control (RBAC) user list.
    - Security audit trail viewer recording timestamps, user, action, entity, and IP address.

15. **Mobile Application (PWA Ready)**:
    - Responsive mobile layout with dedicated bottom navigation: **Home | Attendance | Leave | Payslip | Profile**.
    - Fast punch in/out floating controls.

---

## 🔑 Demo Accounts & Credentials

For testing and demonstration, use these accounts (or the 1-click quick fill buttons on the login screen):

| Role | Username / Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` *(or `admin@zenithhrms.com`)* | `Admin@123` | Complete administrative, company, payroll, and employee access |
| **Manager** | `manager` *(or `manager@zenithhrms.com`)* | `Manager@123` | Team management, leave approvals, regularization, expenses |
| **Employee** | `employee` *(or `b122`, `employee@zenithhrms.com`)* | `Employee@123` | Self-service attendance, leaves, my payslips, claims, profile |

*Company Code*: `ZENITH` or `DEMO2024`

---

## 💻 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, jsPDF.
- **Backend**: Next.js REST API route handlers, JWT authentication, bcryptjs password hashing.
- **Database & ORM**: PostgreSQL via Prisma ORM (compatible with Neon, Supabase, AWS RDS, Railway, or local PostgreSQL).
- **Deployment**: Vercel ready with Edge middleware (`vercel.json` included).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration:
```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_production_jwt_secret"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_NAME="ZenithHR"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup & Seeding
```bash
# Push schema to PostgreSQL database
npm run db:push

# Seed enterprise demo data (32 employees, attendance, leaves, payroll)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

### 6. Deployment to Vercel
```bash
vercel deploy --prod
```

---

## 🔒 Security & Data Privacy

- **JWT Authentication**: Secure tokens with 7-day expiration.
- **Password Protection**: Salted hashes generated with bcrypt (work factor 10).
- **Salary Data Isolation**: Non-admin employees are strictly forbidden from viewing peer salary details at the database API query level.
- **Audit Logging**: All significant operations (logins, logouts, employee creations, payroll batches, leave approvals) are logged in the `AuditLog` table.
