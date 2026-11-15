-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL DEFAULT 1,
    "plan" TEXT NOT NULL DEFAULT 'ENTERPRISE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 499.00,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "seatLimit" INTEGER NOT NULL DEFAULT 750,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organizationId_key" ON "subscriptions"("organizationId");
