-- CreateTable
CREATE TABLE "interventions" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "cohort" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "launchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);
