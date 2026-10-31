-- Menambah kolom referral & alamat terstruktur pada tabel customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS "village" text,
  ADD COLUMN IF NOT EXISTS "district" text,
  ADD COLUMN IF NOT EXISTS "city" text,
  ADD COLUMN IF NOT EXISTS "referralCode" text,
  ADD COLUMN IF NOT EXISTS "referredByCustomerId" text,
  ADD COLUMN IF NOT EXISTS "referredByCustomerName" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "referredByBusinessName" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "referralBoundAt" timestamp without time zone,
  ADD COLUMN IF NOT EXISTS "referralSource" text DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS "customers_referralCode_key" ON "customers"("referralCode");

-- Tabel komisi referral (upline <-> downline)
CREATE TABLE IF NOT EXISTS "referral_commissions" (
  "id" text NOT NULL,
  "uplineId" text NOT NULL,
  "downlineId" text NOT NULL,
  "amount" double precision DEFAULT 15000,
  "status" text DEFAULT 'MENUNGGU_VERIFIKASI',
  "notes" text DEFAULT '',
  "createdAt" timestamp without time zone DEFAULT now(),
  "activatedAt" timestamp without time zone,
  CONSTRAINT "referral_commissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "referral_commissions_uplineId_fkey" FOREIGN KEY ("uplineId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "referral_commissions_downlineId_fkey" FOREIGN KEY ("downlineId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "referral_commissions_uplineId_downlineId_key" ON "referral_commissions"("uplineId", "downlineId");
CREATE INDEX IF NOT EXISTS "referral_commissions_uplineId_idx" ON "referral_commissions"("uplineId");
CREATE INDEX IF NOT EXISTS "referral_commissions_downlineId_idx" ON "referral_commissions"("downlineId");

-- Tabel pencairan saldo komisi referral
CREATE TABLE IF NOT EXISTS "referral_withdrawals" (
  "id" text NOT NULL,
  "customerId" text NOT NULL,
  "amount" double precision DEFAULT 0,
  "bankOrWallet" text DEFAULT '',
  "accountNumber" text DEFAULT '',
  "accountHolder" text DEFAULT '',
  "requestDate" timestamp without time zone DEFAULT now(),
  "completedDate" timestamp without time zone,
  "status" text DEFAULT 'MENUNGGU_VERIFIKASI',
  "notes" text DEFAULT '',
  "createdAt" timestamp without time zone DEFAULT now(),
  "updatedAt" timestamp without time zone DEFAULT now(),
  CONSTRAINT "referral_withdrawals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "referral_withdrawals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "referral_withdrawals_customerId_idx" ON "referral_withdrawals"("customerId");
