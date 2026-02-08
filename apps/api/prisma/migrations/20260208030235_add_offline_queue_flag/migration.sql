-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("code", "createdAt", "currency", "enablePMDashboard", "enableReports", "endDate", "globalBudget", "id", "name", "startDate", "status", "tenantId", "updatedAt") SELECT "code", "createdAt", "currency", "enablePMDashboard", "enableReports", "endDate", "globalBudget", "id", "name", "startDate", "status", "tenantId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
