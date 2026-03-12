-- AlterTable
ALTER TABLE "BacklogItem" ADD COLUMN     "assigneeContractorResourceId" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "activityId" TEXT,
ADD COLUMN     "materialId" TEXT,
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "CostLedger" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "enableMaterials" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ADD COLUMN     "projectMaterialId" TEXT;

-- CreateTable
CREATE TABLE "ProjectMaterial" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "projectSKU" TEXT,
    "plannedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plannedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockAvailable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityMaterial" (
    "id" TEXT NOT NULL,
    "projectMaterialId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "quantityConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateConsumed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMaterial_projectId_materialId_key" ON "ProjectMaterial"("projectId", "materialId");

-- AddForeignKey
ALTER TABLE "CostLedger" ADD CONSTRAINT "CostLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_projectMaterialId_fkey" FOREIGN KEY ("projectMaterialId") REFERENCES "ProjectMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacklogItem" ADD CONSTRAINT "BacklogItem_assigneeContractorResourceId_fkey" FOREIGN KEY ("assigneeContractorResourceId") REFERENCES "ContractorResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMaterial" ADD CONSTRAINT "ProjectMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMaterial" ADD CONSTRAINT "ProjectMaterial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityMaterial" ADD CONSTRAINT "ActivityMaterial_projectMaterialId_fkey" FOREIGN KEY ("projectMaterialId") REFERENCES "ProjectMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityMaterial" ADD CONSTRAINT "ActivityMaterial_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityMaterial" ADD CONSTRAINT "ActivityMaterial_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
