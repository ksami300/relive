-- Manual rollback only. This intentionally fails if personal rows with NULL organizationId exist.
BEGIN;

ALTER TABLE "stress_pulses"
  ALTER COLUMN "organizationId" SET NOT NULL,
  ALTER COLUMN "organizationId" SET DEFAULT 1;

DROP INDEX "stress_pulses_userId_organizationId_timestamp_idx";

COMMIT;
