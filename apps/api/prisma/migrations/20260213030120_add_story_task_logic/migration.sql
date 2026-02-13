/*
  Warnings:

  - Added the required column `updatedAt` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BudgetLine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChangeOrder" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "ChangeOrder" ADD COLUMN "approverId" TEXT;

-- CreateTable
CREATE TABLE "CostLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wbsActivityId" TEXT,
    "costType" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostLedger_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CostLedger_wbsActivityId_fkey" FOREIGN KEY ("wbsActivityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "date" DATETIME NOT NULL,
    "vendorName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "budgetLineId" TEXT,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changeOrderId" TEXT NOT NULL,
    "budgetLineId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChangeOrderItem_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "ChangeOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChangeOrderItem_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BacklogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "discipline" TEXT,
    "assigneeUserId" TEXT,
    "contractorId" TEXT,
    "linkedWbsActivityId" TEXT,
    "parentId" TEXT,
    "storyPoints" INTEGER,
    "estimatedHours" REAL,
    "definitionOfDone" TEXT,
    "evidenceRequired" TEXT NOT NULL DEFAULT 'NONE',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BacklogItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BacklogItem_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BacklogItem_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BacklogItem_linkedWbsActivityId_fkey" FOREIGN KEY ("linkedWbsActivityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BacklogItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BacklogItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sprint_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SprintItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprintId" TEXT NOT NULL,
    "backlogItemId" TEXT NOT NULL,
    "boardStatus" TEXT NOT NULL DEFAULT 'TODO',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SprintItem_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SprintItem_backlogItemId_fkey" FOREIGN KEY ("backlogItemId") REFERENCES "BacklogItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sprintId" TEXT,
    "backlogItemId" TEXT,
    "wbsActivityId" TEXT,
    "text" TEXT NOT NULL,
    "blocker" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DailyUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DailyUpdate_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DailyUpdate_backlogItemId_fkey" FOREIGN KEY ("backlogItemId") REFERENCES "BacklogItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DailyUpdate_wbsActivityId_fkey" FOREIGN KEY ("wbsActivityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Retro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprintId" TEXT NOT NULL,
    "keep" TEXT,
    "improve" TEXT,
    "stop" TEXT,
    "actionItems" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Retro_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Impediment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sprintId" TEXT,
    "backlogItemId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "ownerUserId" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Impediment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Impediment_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Impediment_backlogItemId_fkey" FOREIGN KEY ("backlogItemId") REFERENCES "BacklogItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Impediment_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "workerName" TEXT,
    "userId" TEXT,
    "role" TEXT,
    "baseRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Timesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Timesheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimesheetEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timesheetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "wbsActivityId" TEXT,
    "hours" REAL NOT NULL,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimesheetEntry_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimesheetEntry_wbsActivityId_fkey" FOREIGN KEY ("wbsActivityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'General Budget',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Budget" ("id", "name", "projectId") SELECT "id", "name", "projectId" FROM "Budget";
DROP TABLE "Budget";
ALTER TABLE "new_Budget" RENAME TO "Budget";
CREATE TABLE "new_BudgetLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "wbsActivityId" TEXT,
    "costType" TEXT NOT NULL DEFAULT 'MATERIAL',
    "code" TEXT,
    "name" TEXT NOT NULL,
    "budgetBase" REAL NOT NULL DEFAULT 0,
    "budgetCO" REAL NOT NULL DEFAULT 0,
    "budgetTransfer" REAL NOT NULL DEFAULT 0,
    "amountParam" REAL NOT NULL DEFAULT 0,
    "amountCommitted" REAL NOT NULL DEFAULT 0,
    "amountExecuted" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BudgetLine_wbsActivityId_fkey" FOREIGN KEY ("wbsActivityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BudgetLine" ("amountCommitted", "amountExecuted", "amountParam", "budgetId", "code", "id", "name") SELECT "amountCommitted", "amountExecuted", "amountParam", "budgetId", "code", "id", "name" FROM "BudgetLine";
DROP TABLE "BudgetLine";
ALTER TABLE "new_BudgetLine" RENAME TO "BudgetLine";
CREATE UNIQUE INDEX "BudgetLine_budgetId_wbsActivityId_costType_key" ON "BudgetLine"("budgetId", "wbsActivityId", "costType");
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "vendor" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" REAL NOT NULL DEFAULT 1.0,
    "fileUrl" TEXT,
    "ocrData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "docStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("createdAt", "currency", "date", "exchangeRate", "fileUrl", "id", "invoiceNumber", "ocrData", "projectId", "purchaseOrderId", "status", "total", "vendor") SELECT "createdAt", "currency", "date", "exchangeRate", "fileUrl", "id", "invoiceNumber", "ocrData", "projectId", "purchaseOrderId", "status", "total", "vendor" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE TABLE "new_Photo" (
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
    "dailyEntryId" TEXT,
    "capturedAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "dailyUpdateId" TEXT,
    CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Photo_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Photo_fieldUpdateId_fkey" FOREIGN KEY ("fieldUpdateId") REFERENCES "FieldUpdate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Photo_dailyEntryId_fkey" FOREIGN KEY ("dailyEntryId") REFERENCES "FieldDailyEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Photo_dailyUpdateId_fkey" FOREIGN KEY ("dailyUpdateId") REFERENCES "DailyUpdate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("activityId", "capturedAt", "createdBy", "dailyEntryId", "fieldUpdateId", "hash", "height", "id", "projectId", "sizeBytes", "uploadedAt", "urlMain", "urlThumb", "width") SELECT "activityId", "capturedAt", "createdBy", "dailyEntryId", "fieldUpdateId", "hash", "height", "id", "projectId", "sizeBytes", "uploadedAt", "urlMain", "urlThumb", "width" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "globalBudget" REAL,
    "enableReports" BOOLEAN NOT NULL DEFAULT false,
    "enablePMDashboard" BOOLEAN NOT NULL DEFAULT false,
    "enableOfflineQueue" BOOLEAN NOT NULL DEFAULT false,
    "enablePunchListPro" BOOLEAN NOT NULL DEFAULT false,
    "enableGanttPro" BOOLEAN NOT NULL DEFAULT false,
    "enableScrum" BOOLEAN NOT NULL DEFAULT false,
    "managerName" TEXT,
    CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("code", "createdAt", "currency", "enableOfflineQueue", "enablePMDashboard", "enablePunchListPro", "enableReports", "endDate", "globalBudget", "id", "name", "startDate", "status", "tenantId", "updatedAt") SELECT "code", "createdAt", "currency", "enableOfflineQueue", "enablePMDashboard", "enablePunchListPro", "enableReports", "endDate", "globalBudget", "id", "name", "startDate", "status", "tenantId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
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
    "manualProgress" INTEGER,
    "plannedWeight" REAL NOT NULL DEFAULT 1.0,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "contractorId" TEXT,
    "assignedUserId" TEXT,
    "budgetLineId" TEXT,
    "measurementType" TEXT NOT NULL DEFAULT 'QUANTITY',
    "measurementTemplateId" TEXT,
    "totalQty" REAL,
    "unit" TEXT,
    "lastUpdateAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedReason" TEXT,
    "blockedComment" TEXT,
    "blockedEta" DATETIME,
    "blockedOwnerUserId" TEXT,
    "committedDate" DATETIME,
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
INSERT INTO "new_ProjectActivity" ("assignedUserId", "blockedComment", "blockedEta", "blockedOwnerUserId", "blockedReason", "budgetLineId", "code", "committedDate", "contractorId", "createdAt", "endDate", "id", "lastUpdateAt", "measurementTemplateId", "measurementType", "name", "parentId", "percent", "plannedWeight", "projectId", "startDate", "status", "tenantId", "totalQty", "unit", "updatedAt") SELECT "assignedUserId", "blockedComment", "blockedEta", "blockedOwnerUserId", "blockedReason", "budgetLineId", "code", "committedDate", "contractorId", "createdAt", "endDate", "id", "lastUpdateAt", "measurementTemplateId", "measurementType", "name", "parentId", "percent", "plannedWeight", "projectId", "startDate", "status", "tenantId", "totalQty", "unit", "updatedAt" FROM "ProjectActivity";
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
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activityId" TEXT,
    CONSTRAINT "ProjectMilestone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectMilestone_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectMilestone" ("activityId", "createdAt", "date", "description", "id", "name", "projectId", "status", "tenantId", "updatedAt") SELECT "activityId", "createdAt", "date", "description", "id", "name", "projectId", "status", "tenantId", "updatedAt" FROM "ProjectMilestone";
DROP TABLE "ProjectMilestone";
ALTER TABLE "new_ProjectMilestone" RENAME TO "ProjectMilestone";
CREATE TABLE "new_PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "vendor" TEXT,
    "total" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "docStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "vendorId" TEXT,
    "approverId" TEXT,
    "notes" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Contractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("createdAt", "id", "projectId", "status", "total", "vendor", "vendorId") SELECT "createdAt", "id", "projectId", "status", "total", "vendor", "vendorId" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SprintItem_sprintId_backlogItemId_key" ON "SprintItem"("sprintId", "backlogItemId");
