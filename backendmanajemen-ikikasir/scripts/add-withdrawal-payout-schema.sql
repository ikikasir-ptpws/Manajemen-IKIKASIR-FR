-- Menambah data pembayaran pencairan saldo referral & switch menu "Penarikan Referral"
-- Dijalankan manual ke database (pola yang sama seperti add-referral-schema.sql)

-- Kolom pencairan: invoice, proses, bukti transfer, penanda WA, alasan tolak
ALTER TABLE referral_withdrawals
  ADD COLUMN IF NOT EXISTS "invoiceNo" text,
  ADD COLUMN IF NOT EXISTS "processedBy" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "transferReference" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "waSentAt" timestamp without time zone,
  ADD COLUMN IF NOT EXISTS "rejectionReason" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "rejectedAt" timestamp without time zone;

CREATE UNIQUE INDEX IF NOT EXISTS "referral_withdrawals_invoiceNo_key" ON "referral_withdrawals"("invoiceNo");

-- Switch menu baru untuk halaman Penarikan Referral di webbase
ALTER TABLE role_menu_accesses
  ADD COLUMN IF NOT EXISTS "penarikanReferral" boolean DEFAULT false;

-- Backfill: Super Admin / Admin / Finance boleh mengakses halaman penarikan
UPDATE role_menu_accesses SET "penarikanReferral" = true
WHERE "roleId" IN (SELECT id FROM roles WHERE name IN ('Super Admin','Admin','Finance'));
