-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "code" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'ISSUE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "locationBuilding" TEXT,
    "locationLevel" TEXT,
    "locationZone" TEXT,
    "trade" TEXT,
    "ownerUserId" TEXT,
    "contractorId" TEXT,
    "dueDate" DATETIME,
    "readyForValidationAt" DATETIME,
    "validatedAt" DATETIME,
    "validatedBy" TEXT,
    "reopenedAt" DATETIME,
    "reopenedBy" TEXT,
    "closedAt" DATETIME,
    "activityId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("activityId", "closedAt", "contractorId", "createdAt", "createdBy", "description", "dueDate", "id", "ownerUserId", "projectId", "severity", "status", "title", "updatedAt") SELECT "activityId", "closedAt", "contractorId", "createdAt", "createdBy", "description", "dueDate", "id", "ownerUserId", "projectId", "severity", "status", "title", "updatedAt" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
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
    CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("code", "createdAt", "currency", "enableOfflineQueue", "enablePMDashboard", "enableReports", "endDate", "globalBudget", "id", "name", "startDate", "status", "tenantId", "updatedAt") SELECT "code", "createdAt", "currency", "enableOfflineQueue", "enablePMDashboard", "enableReports", "endDate", "globalBudget", "id", "name", "startDate", "status", "tenantId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
