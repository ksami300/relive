-- Personal stress pulses use NULL organizationId. Existing organization-scoped rows remain unchanged.
ALTER TABLE "stress_pulses"
  ALTER COLUMN "organizationId" DROP DEFAULT,
  ALTER COLUMN "organizationId" DROP NOT NULL;

CREATE INDEX "stress_pulses_userId_organizationId_timestamp_idx"
  ON "stress_pulses"("userId", "organizationId", "timestamp");
