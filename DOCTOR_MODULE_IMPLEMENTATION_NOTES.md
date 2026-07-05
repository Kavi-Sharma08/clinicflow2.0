# ClinicFlow Doctor/Admin UI + Backend Contract Update

## Source of truth

The project now treats `server/src/prisma/schema.prisma` as the active Prisma schema. The previous `schema2.prisma` contents were copied into `schema.prisma` because the user moved the new model architecture into the default Prisma schema file.

## Backend updates included

### Admin routes

Updated `server/src/routes/admin.routes.ts` with:

- `GET /api/admin/dashboard/summary`
- `GET /api/admin/doctors`
- `GET /api/admin/doctors/summary`
- existing doctor detail and verification actions preserved:
  - `GET /api/admin/doctors/:id`
  - `PUT /api/admin/doctors/:id/approve`
  - `PUT /api/admin/doctors/:id/reject`

### Admin dashboard contract

`GET /api/admin/dashboard/summary` returns backend-driven operational data:

- totalDoctors
- pendingDoctorApprovals
- totalPatients
- appointmentsToday
- completedAppointmentsToday
- cancelledAppointmentsToday
- completedAppointmentsRate
- activeDoctors
- activityFeed

No dummy dashboard metrics are used by the updated Admin Dashboard UI.

### Doctor management contract

`GET /api/admin/doctors` supports backend-driven listing for the modern Doctor Management page:

- pagination: skip, limit
- status tab: ALL, PENDING, VERIFIED, REJECTED
- search
- department
- specialization
- sortBy
- sortOrder

Each doctor row returns schema-aligned values:

- user id, fullName, email, phone, profileImage
- registrationNumber
- medicalCouncilName
- specializations
- degrees
- consultationFee
- department
- designation
- employmentType
- verificationStatus
- availableSlotCount
- document counts

### Doctor summary contract

`GET /api/admin/doctors/summary` returns:

- totalDoctors
- pendingDoctors
- verifiedDoctors
- rejectedDoctors
- activeAvailability

## Frontend updates included

### Admin shell/sidebar/topbar

Updated:

- `client/src/components/common/Sidebar.tsx`
- `client/src/components/protected/admin/Index.tsx`

The admin UI now follows the premium sidebar/topbar direction from the visual reference: dark sidebar, modern nav items, command-style top search, notification action, and cleaner content background.

### Admin Dashboard

Updated:

- `client/src/components/protected/admin/dashboard/AdminDashboard.tsx`
- `client/src/services/adminDashboardService.ts`
- `client/src/types/adminDashboard.types.ts`

The dashboard now reads from `/api/admin/dashboard/summary` and no longer falls back to fake static metrics.

### Doctor Management

Added:

- `client/src/components/protected/admin/doctor-management/DoctorManagement.tsx`
- `client/src/services/adminDoctorService.ts`
- `client/src/hooks/useAdminDoctors.ts`
- `client/src/types/adminDoctorList.types.ts`

The Doctor Management UI includes:

- page header
- KPI cards
- backend-driven tabs
- toolbar search and filters
- rich doctor table rows
- pagination
- navigation to doctor detail profile
- loading, empty, and error states

### Signup fixed against backend contract

Updated:

- `client/src/components/unprotected/Signup.tsx`
- `client/src/types/role.types.ts`

Signup now collects and sends the fields required by the backend:

- firstName
- middleName
- lastName
- email
- phone
- gender
- role
- password

It no longer sends only fullName/email/password/role.

### Routes

Updated:

- `client/src/routes/routes.config.ts`

Added admin route:

- `/admin/doctors`

Also added placeholder shells for `/admin/appointments`, `/admin/analytics`, and `/admin/settings` so the sidebar does not navigate to a broken page.

## Validation performed

Client build passed:

```bash
cd client
npm run build
```

Server build could not be validated in this sandbox because Prisma generation requires downloading Prisma binaries from `binaries.prisma.sh`, and network access failed here. The generated Prisma client in the uploaded project is still old and must be regenerated locally after pulling this update.

Run locally:

```bash
cd server
npm install
DIRECT_URL="your_database_direct_url" npx prisma generate
npm run build
```

Then migrate:

```bash
npx prisma migrate dev --name new_schema_admin_doctor_ui
```

## Important rule followed from now on

Backend contract changes and frontend changes must be delivered together. If backend schema/API/enum/request/response changes, the frontend form, types, services, hooks, and UI must be updated in the same implementation.
