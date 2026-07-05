# ClinicFlow Patient Portal + Realtime Implementation Notes

## Scope completed

This package extends the latest ClinicFlow project with a production-oriented patient portal and realtime notification/queue infrastructure.

### Patient portal frontend

Added/updated:

- `client/src/components/protected/patient/Index.tsx`
- `client/src/components/protected/patient/PatientDashboard.tsx`
- `client/src/components/protected/patient/BookAppointment.tsx`
- `client/src/components/protected/patient/MyAppointments.tsx`
- `client/src/components/protected/patient/PatientProfile.tsx`
- `client/src/services/patientPortalService.ts`
- `client/src/hooks/usePatientPortal.ts`
- `client/src/types/patientPortal.types.ts`

Patient features:

- Modern patient dashboard
- Live appointment summary
- Verified doctor discovery
- Search and specialization filters
- Doctor availability viewing
- Appointment booking
- Queue number display
- Appointment cancellation
- Patient profile update
- Emergency contact update
- Medical summary update
- React Query data flow
- No dummy patient data

### Realtime notifications and queue updates

Added/updated:

- `server/src/services/realtime.service.ts`
- `server/src/services/notification.service.ts`
- `server/src/controllers/notification/notification.controller.ts`
- `server/src/routes/notification.routes.ts`
- `client/src/context/RealtimeContext.tsx`
- `client/src/components/common/NotificationsMenu.tsx`
- `client/src/services/notificationService.ts`
- `client/src/types/notification.types.ts`

Realtime behavior:

- Socket.IO server attached to Express HTTP server
- Users join `user:<id>` rooms
- Users join `role:<role>` rooms
- New notifications are pushed live to affected users
- Appointment booking updates doctor queue live
- Appointment cancellation updates doctor queue live
- Doctor appointment completion/cancellation notifies patient live
- Doctor verification submission notifies admins live
- Doctor approval/rejection notifies doctor live

### Backend patient APIs

Added/updated:

- `GET /api/patient/dashboard/summary`
- `GET /api/patient/profile/me`
- `PUT /api/patient/profile/me`
- `GET /api/patient/doctors`
- `GET /api/patient/doctors/specializations`
- `GET /api/patient/doctors/:doctorId/availability`
- `POST /api/patient/appointments`
- `GET /api/patient/appointments/me`
- `PATCH /api/patient/appointments/:id/cancel`

### Notification APIs

Added:

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

## Schema change

Added to `server/src/prisma/schema.prisma`:

- `Notification`
- `NotificationType`
- `NotificationPriority`
- `User.notifications` relation

After extracting, run Prisma migration/generation locally.

## Required commands

From `server`:

```bash
npm install
npx prisma migrate dev --name patient_portal_realtime_notifications
npx prisma generate
npm run build
```

From `client`:

```bash
npm install
npm run build
```

## Environment variables

Recommended server `.env`:

```env
PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
ADMIN_SEED_EMAIL=admin@clinicflow.com
ADMIN_SEED_PASSWORD=your_password
ADMIN_SEED_NAME=Super Admin
ADMIN_SEED_PHONE=+910000000000
```

Recommended client `.env` if backend is not same-origin in production:

```env
VITE_SOCKET_URL=http://localhost:3000
```

## Validation status

- Client production build passed in this environment.
- Server build requires `npx prisma generate` against the updated schema. Prisma generation could not complete in this sandbox because Prisma attempted to download engine binaries from `binaries.prisma.sh`, which is blocked here. Run the commands above locally or in CI with network access.

