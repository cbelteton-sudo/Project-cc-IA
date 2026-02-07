-- AlterTable
ALTER TABLE "Contractor" ADD COLUMN "bankAccount" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "bankName" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "certifications" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "contactPersonName" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "contactPersonPhone" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "insurancePolicy" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "legalName" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "notes" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "specialties" TEXT;
ALTER TABLE "Contractor" ADD COLUMN "website" TEXT;

-- CreateTable
CREATE TABLE "ContractorProjectAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleInProject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractorProjectAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContractorProjectAssignment_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContractorProjectAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeasurementTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CHECKLIST',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MeasurementTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeasurementTemplateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    CONSTRAINT "MeasurementTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MeasurementTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FieldUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldUpdateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fieldUpdateId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "qtyDone" REAL,
    "checklistState" TEXT,
    "milestoneState" TEXT,
    "manualPercent" INTEGER,
    "notes" TEXT,
    "isRisk" BOOLEAN NOT NULL DEFAULT false,
    "overrideJustification" TEXT,
    "suggestedPercent" INTEGER,
    "confidenceScore" INTEGER,
    "deltaFromLast" INTEGER,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FieldUpdateItem_fieldUpdateId_fkey" FOREIGN KEY ("fieldUpdateId") REFERENCES "FieldUpdate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FieldUpdateItem_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "activityId" TEXT,
    "fieldUpdateId" TEXT,
    "urlMain" TEXT NOT NULL,
    "urlThumb" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "hash" TEXT,
    "capturedAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Photo_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Photo_fieldUpdateId_fkey" FOREIGN KEY ("fieldUpdateId") REFERENCES "FieldUpdate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "activityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "ownerUserId" TEXT,
    "dueDate" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueId" TEXT,
    "text" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "percent" INTEGER NOT NULL DEFAULT 0,
    "plannedWeight" REAL NOT NULL DEFAULT 1.0,
    "contractorId" TEXT,
    "assignedUserId" TEXT,
    "budgetLineId" TEXT,
    "measurementType" TEXT NOT NULL DEFAULT 'QUANTITY',
    "measurementTemplateId" TEXT,
    "totalQty" REAL,
    "unit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectActivity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectActivity_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectActivity_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectActivity_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectActivity_measurementTemplateId_fkey" FOREIGN KEY ("measurementTemplateId") REFERENCES "MeasurementTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectActivity" ("code", "contractorId", "createdAt", "endDate", "id", "name", "parentId", "plannedWeight", "projectId", "startDate", "status", "tenantId", "updatedAt") SELECT "code", "contractorId", "createdAt", "endDate", "id", "name", "parentId", "plannedWeight", "projectId", "startDate", "status", "tenantId", "updatedAt" FROM "ProjectActivity";
DROP TABLE "ProjectActivity";
ALTER TABLE "new_ProjectActivity" RENAME TO "ProjectActivity";
CREATE TABLE "new_ProjectMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activityId" TEXT,
    CONSTRAINT "ProjectMilestone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectMilestone_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectMilestone" ("createdAt", "date", "description", "id", "name", "projectId", "status", "tenantId", "updatedAt") SELECT "createdAt", "date", "description", "id", "name", "projectId", "status", "tenantId", "updatedAt" FROM "ProjectMilestone";
DROP TABLE "ProjectMilestone";
ALTER TABLE "new_ProjectMilestone" RENAME TO "ProjectMilestone";
CREATE TABLE "new_PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "total" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "vendorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Contractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("createdAt", "id", "projectId", "status", "total", "vendor") SELECT "createdAt", "id", "projectId", "status", "total", "vendor" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "contractorId" TEXT,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "tenantId", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "role", "tenantId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ContractorProjectAssignment_tenantId_contractorId_projectId_key" ON "ContractorProjectAssignment"("tenantId", "contractorId", "projectId");
