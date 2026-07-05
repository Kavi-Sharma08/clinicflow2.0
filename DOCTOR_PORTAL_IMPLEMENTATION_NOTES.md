# ClinicFlow Doctor Portal Implementation Notes

This update adds the doctor-facing workspace, not only the admin-side doctor management module.

## Design direction
The doctor portal follows modern healthcare SaaS dashboard patterns: role-specific doctor workflow, daily appointments/queue visibility, availability management, profile verification, and patient appointment actions.

## Backend changes

Updated schema:
- `server/src/prisma/schema.prisma`
- Added complete auth/session/OTP/user/doctor/patient/appointment schema relations.
- Uses `VerificationStatus`: `PENDING`, `VERIFIED`, `REJECTED`.
- Uses `AppointmentStatus`: `BOOKED`, `COMPLETED`, `CANCELLED`.

Added/updated doctor API endpoints:
- `GET /api/doctor/dashboard/summary`
- `GET /api/doctor/profile/me`
- `PUT /api/doctor/profile/me`
- `GET /api/doctor/appointments`
- `PATCH /api/doctor/appointments/:id/status`
- Existing availability endpoints remain connected.

Backend controller files:
- `server/src/controllers/user/doctor/dashboard.controller.ts`
- `server/src/controllers/user/doctor/profile.controller.ts`
- `server/src/controllers/user/doctor/booking.controller.ts`
- `server/src/routes/doctor.routes.ts`

## Frontend changes

Added doctor-facing services/types/hooks:
- `client/src/types/doctorPortal.types.ts`
- `client/src/services/doctorPortalService.ts`
- `client/src/hooks/useDoctorPortal.ts`

Updated doctor portal layout:
- `client/src/components/protected/doctor/Index.tsx`
- `client/src/components/protected/doctor/dashboard/Index.tsx`
- `client/src/components/common/Sidebar.tsx`

Added doctor modules:
- `client/src/components/protected/doctor/dashboard/DoctorDashboard.tsx`
- `client/src/components/protected/doctor/appointments/DoctorAppointments.tsx`
- `client/src/components/protected/doctor/availability/DoctorAvailability.tsx`
- `client/src/components/protected/doctor/profile/ProfileForm.tsx`
- `client/src/components/protected/doctor/shared/DoctorPortalAtoms.tsx`

Updated routes:
- `client/src/routes/routes.config.ts`

Doctor routes now include:
- `/doctor/dashboard/:id`
- `/doctor/dashboard/:id/appointments`
- `/doctor/dashboard/:id/availability`
- `/doctor/profile`
- `/doctor/profile/change-password`

## Validation

Client TypeScript and Vite production build passed using direct binaries:

```bash
cd client
node node_modules/typescript/lib/tsc.js -b
node node_modules/vite/bin/vite.js build
```

`npm run build` in the sandbox failed because the uploaded `node_modules/.bin/tsc` shim is broken. Running the TypeScript/Vite binaries directly passed.

Server TypeScript build requires regenerating Prisma client from the new schema. The sandbox cannot download Prisma engine binaries because internet access is blocked. Run locally:

```bash
cd server
npm install
DIRECT_URL="your_database_url" DATABASE_URL="your_database_url" npx prisma generate
npx prisma migrate dev --name doctor_portal_workspace
npm run build
```

Do not rely on the old generated Prisma client after changing the schema.
