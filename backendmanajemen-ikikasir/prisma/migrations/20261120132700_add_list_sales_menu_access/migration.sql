ALTER TABLE "role_menu_accesses"
ADD COLUMN IF NOT EXISTS "listSales" BOOLEAN NOT NULL DEFAULT false;

UPDATE "role_menu_accesses" AS menu
SET "listSales" = true
FROM "roles" AS role
WHERE menu."roleId" = role."id"
  AND regexp_replace(upper(role."name"), '[[:space:]_-]+', '', 'g') = 'SUPERADMIN';
