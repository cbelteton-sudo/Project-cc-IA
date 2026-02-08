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
    "lastUpdateAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedReason" TEXT,
    "blockedComment" TEXT,
    "blockedEta" DATETIME,
    "blockedOwnerUserId" TEXT,
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
INSERT INTO "new_ProjectActivity" ("assignedUserId", "budgetLineId", "code", "contractorId", "createdAt", "endDate", "id", "measurementTemplateId", "measurementType", "name", "parentId", "percent", "plannedWeight", "projectId", "startDate", "status", "tenantId", "totalQty", "unit", "updatedAt") SELECT "assignedUserId", "budgetLineId", "code", "contractorId", "createdAt", "endDate", "id", "measurementTemplateId", "measurementType", "name", "parentId", "percent", "plannedWeight", "projectId", "startDate", "status", "tenantId", "totalQty", "unit", "updatedAt" FROM "ProjectActivity";
DROP TABLE "ProjectActivity";
ALTER TABLE "new_ProjectActivity" RENAME TO "ProjectActivity";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
