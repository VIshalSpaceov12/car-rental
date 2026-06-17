-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_providerId_createdAt_idx" ON "AuditLog"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_providerId_action_idx" ON "AuditLog"("providerId", "action");
