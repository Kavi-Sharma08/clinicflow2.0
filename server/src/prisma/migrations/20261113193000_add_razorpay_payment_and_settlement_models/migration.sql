-- ============================================================
-- Migration: 20261113193000_add_razorpay_payment_and_settlement_models
-- All CREATE TYPE and CREATE TABLE statements are wrapped for
-- idempotency so this migration can be re-applied safely.
-- ============================================================

-- CreateEnum: PaymentOrderStatus
DO $$ BEGIN
  CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: PaymentAttemptStatus
DO $$ BEGIN
  CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'AUTHORIZED', 'CAPTURED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: SettlementStatus
DO $$ BEGIN
  CREATE TYPE "SettlementStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING_COMPLETION', 'ON_HOLD_PENDING_REVIEW', 'ELIGIBLE', 'APPROVED', 'QUEUED_FOR_PAYOUT', 'TRANSFER_INITIATED', 'SETTLED', 'FAILED', 'ON_HOLD', 'REVERSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: RefundStatus
DO $$ BEGIN
  CREATE TYPE "RefundStatus" AS ENUM ('REVIEW_REQUESTED', 'APPROVED', 'REJECTED', 'INITIATED', 'SUCCESS', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: WebhookProcessingStatus
DO $$ BEGIN
  CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: LinkedAccountStatus
DO $$ BEGIN
  CREATE TYPE "LinkedAccountStatus" AS ENUM ('NOT_CREATED', 'SUBMITTED', 'KYC_PENDING', 'ACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum: AppointmentStatus — add payment-related values
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_EXPIRED';

-- AlterTable: DoctorProfile — add Razorpay linked-account columns
ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "razorpayAccountId" TEXT;
ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "accountStatus" "LinkedAccountStatus" NOT NULL DEFAULT 'NOT_CREATED';
ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: DoctorProfile razorpayAccountId unique
CREATE UNIQUE INDEX IF NOT EXISTS "DoctorProfile_razorpayAccountId_key" ON "DoctorProfile"("razorpayAccountId");

-- AlterTable: Appointment — make queueNumber nullable, add payment columns
ALTER TABLE "Appointment" ALTER COLUMN "queueNumber" DROP NOT NULL;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentExpiresAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "guestCheckoutTokenHash" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "guestCheckoutTokenExpiry" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "confirmedPaymentOrderId" TEXT;

-- CreateIndex: Appointment payment columns
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_guestCheckoutTokenHash_key" ON "Appointment"("guestCheckoutTokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_confirmedPaymentOrderId_key" ON "Appointment"("confirmedPaymentOrderId");
CREATE INDEX IF NOT EXISTS "Appointment_paymentExpiresAt_idx" ON "Appointment"("paymentExpiresAt");
CREATE INDEX IF NOT EXISTS "Appointment_guestCheckoutTokenHash_idx" ON "Appointment"("guestCheckoutTokenHash");

-- CreateTable: PaymentOrder
CREATE TABLE IF NOT EXISTS "PaymentOrder" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "receipt" TEXT NOT NULL,
    "grossAmountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "commissionRateBps" INTEGER NOT NULL DEFAULT 500,
    "platformFeePaise" INTEGER NOT NULL,
    "doctorSharePaise" INTEGER NOT NULL,
    "gatewayFeePaise" INTEGER,
    "gatewayTaxPaise" INTEGER,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedPaymentId" TEXT,
    "refundedAmountPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentAttempt
CREATE TABLE IF NOT EXISTS "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" TEXT,
    "bank" TEXT,
    "wallet" TEXT,
    "vpa" TEXT,
    "errorCode" TEXT,
    "errorDescription" TEXT,
    "errorSource" TEXT,
    "errorStep" TEXT,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DoctorSettlementLedger
CREATE TABLE IF NOT EXISTS "DoctorSettlementLedger" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "allocatedAmountPaise" INTEGER NOT NULL,
    "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'PENDING_COMPLETION',
    "transferId" TEXT,
    "transferInitiatedAt" TIMESTAMP(3),
    "transferSettledAt" TIMESTAMP(3),
    "reversalId" TEXT,
    "failureReason" TEXT,
    "payoutReference" TEXT,
    "payoutProofUrl" TEXT,
    "authorizedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorSettlementLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RefundRecord
CREATE TABLE IF NOT EXISTS "RefundRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REVIEW_REQUESTED',
    "razorpayRefundId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WebhookEvent
CREATE TABLE IF NOT EXISTS "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadSummary" JSONB NOT NULL,
    "status" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FinancialAuditLog
CREATE TABLE IF NOT EXISTS "FinancialAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT,
    "targetEntity" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: PaymentOrder
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOrder_razorpayOrderId_key" ON "PaymentOrder"("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "PaymentOrder_appointmentId_idx" ON "PaymentOrder"("appointmentId");
CREATE INDEX IF NOT EXISTS "PaymentOrder_razorpayOrderId_idx" ON "PaymentOrder"("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "PaymentOrder_receipt_idx" ON "PaymentOrder"("receipt");
CREATE INDEX IF NOT EXISTS "PaymentOrder_status_idx" ON "PaymentOrder"("status");

-- CreateIndex: PaymentAttempt
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentAttempt_razorpayPaymentId_key" ON "PaymentAttempt"("razorpayPaymentId");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_paymentOrderId_idx" ON "PaymentAttempt"("paymentOrderId");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_razorpayPaymentId_idx" ON "PaymentAttempt"("razorpayPaymentId");
CREATE INDEX IF NOT EXISTS "PaymentAttempt_status_idx" ON "PaymentAttempt"("status");

-- CreateIndex: DoctorSettlementLedger
CREATE UNIQUE INDEX IF NOT EXISTS "DoctorSettlementLedger_appointmentId_key" ON "DoctorSettlementLedger"("appointmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "DoctorSettlementLedger_paymentOrderId_key" ON "DoctorSettlementLedger"("paymentOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS "DoctorSettlementLedger_transferId_key" ON "DoctorSettlementLedger"("transferId");
CREATE INDEX IF NOT EXISTS "DoctorSettlementLedger_doctorId_settlementStatus_idx" ON "DoctorSettlementLedger"("doctorId", "settlementStatus");
CREATE INDEX IF NOT EXISTS "DoctorSettlementLedger_settlementStatus_idx" ON "DoctorSettlementLedger"("settlementStatus");
CREATE INDEX IF NOT EXISTS "DoctorSettlementLedger_transferId_idx" ON "DoctorSettlementLedger"("transferId");

-- CreateIndex: RefundRecord
CREATE UNIQUE INDEX IF NOT EXISTS "RefundRecord_idempotencyKey_key" ON "RefundRecord"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "RefundRecord_razorpayRefundId_key" ON "RefundRecord"("razorpayRefundId");
CREATE INDEX IF NOT EXISTS "RefundRecord_appointmentId_idx" ON "RefundRecord"("appointmentId");
CREATE INDEX IF NOT EXISTS "RefundRecord_paymentOrderId_idx" ON "RefundRecord"("paymentOrderId");
CREATE INDEX IF NOT EXISTS "RefundRecord_status_idx" ON "RefundRecord"("status");
CREATE INDEX IF NOT EXISTS "RefundRecord_idempotencyKey_idx" ON "RefundRecord"("idempotencyKey");

-- CreateIndex: WebhookEvent
CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_eventId_idx" ON "WebhookEvent"("eventId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");
CREATE INDEX IF NOT EXISTS "WebhookEvent_status_idx" ON "WebhookEvent"("status");
CREATE INDEX IF NOT EXISTS "WebhookEvent_nextRetryAt_idx" ON "WebhookEvent"("nextRetryAt");
CREATE INDEX IF NOT EXISTS "WebhookEvent_lockedAt_idx" ON "WebhookEvent"("lockedAt");

-- CreateIndex: FinancialAuditLog
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_targetEntity_targetId_idx" ON "FinancialAuditLog"("targetEntity", "targetId");
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_action_idx" ON "FinancialAuditLog"("action");
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_createdAt_idx" ON "FinancialAuditLog"("createdAt");

-- AddForeignKey: Appointment -> PaymentOrder (confirmed payment)
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_confirmedPaymentOrderId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_confirmedPaymentOrderId_fkey" FOREIGN KEY ("confirmedPaymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PaymentOrder -> Appointment
ALTER TABLE "PaymentOrder" DROP CONSTRAINT IF EXISTS "PaymentOrder_appointmentId_fkey";
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PaymentAttempt -> PaymentOrder
ALTER TABLE "PaymentAttempt" DROP CONSTRAINT IF EXISTS "PaymentAttempt_paymentOrderId_fkey";
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DoctorSettlementLedger -> DoctorProfile
ALTER TABLE "DoctorSettlementLedger" DROP CONSTRAINT IF EXISTS "DoctorSettlementLedger_doctorId_fkey";
ALTER TABLE "DoctorSettlementLedger" ADD CONSTRAINT "DoctorSettlementLedger_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DoctorSettlementLedger -> Appointment
ALTER TABLE "DoctorSettlementLedger" DROP CONSTRAINT IF EXISTS "DoctorSettlementLedger_appointmentId_fkey";
ALTER TABLE "DoctorSettlementLedger" ADD CONSTRAINT "DoctorSettlementLedger_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DoctorSettlementLedger -> PaymentOrder
ALTER TABLE "DoctorSettlementLedger" DROP CONSTRAINT IF EXISTS "DoctorSettlementLedger_paymentOrderId_fkey";
ALTER TABLE "DoctorSettlementLedger" ADD CONSTRAINT "DoctorSettlementLedger_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DoctorSettlementLedger -> User (authorizedBy)
ALTER TABLE "DoctorSettlementLedger" DROP CONSTRAINT IF EXISTS "DoctorSettlementLedger_authorizedById_fkey";
ALTER TABLE "DoctorSettlementLedger" ADD CONSTRAINT "DoctorSettlementLedger_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: RefundRecord -> Appointment
ALTER TABLE "RefundRecord" DROP CONSTRAINT IF EXISTS "RefundRecord_appointmentId_fkey";
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: RefundRecord -> PaymentOrder
ALTER TABLE "RefundRecord" DROP CONSTRAINT IF EXISTS "RefundRecord_paymentOrderId_fkey";
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: RefundRecord -> User (reviewedBy)
ALTER TABLE "RefundRecord" DROP CONSTRAINT IF EXISTS "RefundRecord_reviewedById_fkey";
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: FinancialAuditLog -> User (performedBy)
ALTER TABLE "FinancialAuditLog" DROP CONSTRAINT IF EXISTS "FinancialAuditLog_performedById_fkey";
ALTER TABLE "FinancialAuditLog" ADD CONSTRAINT "FinancialAuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
