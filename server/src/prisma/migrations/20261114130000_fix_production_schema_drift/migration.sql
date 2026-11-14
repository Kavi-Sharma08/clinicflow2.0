-- ============================================================================
-- Migration: 20261114130000_fix_production_schema_drift
-- Description: Synchronize missing Live Queue, Reschedule, Audit, and
--              Password Reset models without modifying existing data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------

-- Create RescheduleRequestStatus enum if it does not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RescheduleRequestStatus') THEN
        CREATE TYPE "RescheduleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
    END IF;
END $$;

-- Add missing variants to AppointmentStatus
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CHECKED_IN';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'WAITING';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'IN_CONSULTATION';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULED';

-- Add missing variants to NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_STARTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_NO_SHOW';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESCHEDULE_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESCHEDULE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESCHEDULE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'QUEUE_ETA_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'QUEUE_YOUR_TURN';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'QUEUE_POSITION_CHANGED';

-- ----------------------------------------------------------------------------
-- 2. ALTER EXISTING TABLES
-- ----------------------------------------------------------------------------

-- Fix P2022 runtime crash: add consultationDuration with default value 15
ALTER TABLE "DoctorAvailability" 
ADD COLUMN IF NOT EXISTS "consultationDuration" INTEGER NOT NULL DEFAULT 15;

-- Add live queue and rescheduling columns to Appointment
ALTER TABLE "Appointment" 
ADD COLUMN IF NOT EXISTS "actualEndTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "actualStartTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "estimatedTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rescheduledToId" TEXT,
ADD COLUMN IF NOT EXISTS "scheduledTime" TIMESTAMP(3);

-- ----------------------------------------------------------------------------
-- 3. CREATE NEW TABLES
-- ----------------------------------------------------------------------------

-- CreateTable RescheduleRequest
CREATE TABLE IF NOT EXISTS "RescheduleRequest" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "reason" TEXT,
    "requestedDate" TIMESTAMP(3),
    "status" "RescheduleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RescheduleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable AppointmentAudit
CREATE TABLE IF NOT EXISTS "AppointmentAudit" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" "AppointmentStatus",
    "newStatus" "AppointmentStatus",
    "performedById" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable PasswordResetToken
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- ----------------------------------------------------------------------------
-- 4. CREATE INDEXES
-- ----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "RescheduleRequest_appointmentId_key" ON "RescheduleRequest"("appointmentId");
CREATE INDEX IF NOT EXISTS "RescheduleRequest_patientId_idx" ON "RescheduleRequest"("patientId");
CREATE INDEX IF NOT EXISTS "RescheduleRequest_doctorId_idx" ON "RescheduleRequest"("doctorId");
CREATE INDEX IF NOT EXISTS "RescheduleRequest_status_idx" ON "RescheduleRequest"("status");

CREATE INDEX IF NOT EXISTS "AppointmentAudit_appointmentId_idx" ON "AppointmentAudit"("appointmentId");
CREATE INDEX IF NOT EXISTS "AppointmentAudit_createdAt_idx" ON "AppointmentAudit"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

CREATE INDEX IF NOT EXISTS "Appointment_rescheduledToId_idx" ON "Appointment"("rescheduledToId");

-- ----------------------------------------------------------------------------
-- 5. FOREIGN KEY CONSTRAINTS
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_rescheduledToId_fkey') THEN
        ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_rescheduledToId_fkey" 
        FOREIGN KEY ("rescheduledToId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RescheduleRequest_appointmentId_fkey') THEN
        ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_appointmentId_fkey" 
        FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RescheduleRequest_patientId_fkey') THEN
        ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_patientId_fkey" 
        FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RescheduleRequest_doctorId_fkey') THEN
        ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_doctorId_fkey" 
        FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RescheduleRequest_reviewedById_fkey') THEN
        ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_reviewedById_fkey" 
        FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AppointmentAudit_appointmentId_fkey') THEN
        ALTER TABLE "AppointmentAudit" ADD CONSTRAINT "AppointmentAudit_appointmentId_fkey" 
        FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AppointmentAudit_performedById_fkey') THEN
        ALTER TABLE "AppointmentAudit" ADD CONSTRAINT "AppointmentAudit_performedById_fkey" 
        FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PasswordResetToken_userId_fkey') THEN
        ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

