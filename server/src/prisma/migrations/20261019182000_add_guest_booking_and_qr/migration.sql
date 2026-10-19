-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_slug_key" ON "DoctorProfile"("slug");
CREATE INDEX "DoctorProfile_slug_idx" ON "DoctorProfile"("slug");

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "patientId" DROP NOT NULL;
ALTER TABLE "Appointment" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN "guestName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "guestPhone" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "guestEmail" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "bookingReference" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "isWalkIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN "guestTokenHash" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "guestTokenExpiry" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "guestTokenRevokedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_bookingReference_key" ON "Appointment"("bookingReference");
CREATE UNIQUE INDEX "Appointment_guestTokenHash_key" ON "Appointment"("guestTokenHash");
CREATE INDEX "Appointment_bookingReference_idx" ON "Appointment"("bookingReference");
CREATE INDEX "Appointment_guestTokenHash_idx" ON "Appointment"("guestTokenHash");
