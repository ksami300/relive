# Organization membership migration proposal

## Status

Proposal only. This document is not the Prisma schema used by the application and its SQL has
not been applied to any database. Corporate API routes must remain denied until the model is
implemented, migrated, and populated from a verified membership source.

## Proposed Prisma model changes

Add these models and relations to `prisma/schema.prisma`. The existing `User.role` remains a
system-level legacy field and must not grant organization access.

```prisma
enum OrganizationMembershipRole {
  MEMBER
  ANALYST
  ORG_ADMIN
}

model Organization {
  id                 Int                      @id @default(autoincrement())
  name               String
  createdAt          DateTime                 @default(now())
  memberships        OrganizationMembership[]
  subscription       Subscription?
  interventions      Intervention[]
  stressPulses       StressPulse[]
  stressInterventions StressIntervention[]
  metrics            OrganizationInterventionMetric[]

  @@map("organizations")
}

model OrganizationMembership {
  organizationId Int
  userId         Int
  role           OrganizationMembershipRole @default(MEMBER)
  createdAt      DateTime                    @default(now())
  organization   Organization                @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  user           User                        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([organizationId, userId])
  @@index([userId, role])
  @@map("organization_memberships")
}
```

Add `memberships OrganizationMembership[]` to `User`, and add the inverse `organization`
relation to `Subscription`, `Intervention`, `StressPulse`, `StressIntervention` (optional
organization ID), and `OrganizationInterventionMetric`. No existing row should create a
membership as a side effect.

## SQL migration draft

The following is a draft for review and adaptation to the exact deployed PostgreSQL schema.
It first creates organization records for IDs already referenced by corporate tables, then
adds referential constraints. It deliberately creates **zero memberships**.

```sql
CREATE TYPE "OrganizationMembershipRole" AS ENUM ('MEMBER', 'ANALYST', 'ORG_ADMIN');

CREATE TABLE "organizations" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "organizations" ("id", "name")
SELECT DISTINCT source."organizationId",
       'Legacy organization #' || source."organizationId" || ' (membership unverified)'
FROM (
  SELECT "organizationId" FROM "subscriptions"
  UNION
  SELECT "organizationId" FROM "interventions"
  UNION
  SELECT "organizationId" FROM "stress_pulses"
  UNION
  SELECT "organizationId" FROM "stress_interventions"
  UNION
  SELECT "organizationId" FROM "organization_intervention_metrics"
) AS source
WHERE source."organizationId" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('"organizations"', 'id'),
  GREATEST(COALESCE((SELECT MAX("id") FROM "organizations"), 1), 1),
  EXISTS (SELECT 1 FROM "organizations")
);

CREATE TABLE "organization_memberships" (
  "organizationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "role" "OrganizationMembershipRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("organizationId", "userId"),
  CONSTRAINT "organization_memberships_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "organization_memberships_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "organization_memberships_userId_role_idx"
  ON "organization_memberships"("userId", "role");

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "interventions"
  ADD CONSTRAINT "interventions_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stress_pulses"
  ADD CONSTRAINT "stress_pulses_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stress_interventions"
  ADD CONSTRAINT "stress_interventions_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "organization_intervention_metrics"
  ADD CONSTRAINT "organization_intervention_metrics_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

## Data and rollout impact

- Existing organization IDs become **unverified organization records**, not proof that any
  user belongs to them. No user-to-organization mapping can safely be inferred from the
  existing `organizationId = 1` defaults.
- Existing stress and physiological records remain where they are. They must not be included
  in a company's aggregates until a trusted owner-to-membership mapping and an approved
  historical-data policy exist.
- The `stress_pulses.organizationId` field currently has a default of `1`. Before restoring
  personal check-ins, decide whether to remove that default and make the column nullable (and
  approve the corresponding migration) or require verified organization membership to write
  a pulse. Do not silently assign personal data to the legacy organization.
- Every company API must check `OrganizationMembership` on every request. Reads of aggregates
  must derive their user IDs from verified membership; mutations must additionally require
  `ORG_ADMIN`. Analytics access should require `ANALYST` or `ORG_ADMIN`.
- Adding these tables and foreign keys requires a coordinated Prisma client regeneration,
  migration review, backup, staging test, and explicit operational approval. No migration
  should be run against production as part of this proposal.
