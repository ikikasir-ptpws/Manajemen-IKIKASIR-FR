ALTER TABLE "referral_withdrawals"
ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
