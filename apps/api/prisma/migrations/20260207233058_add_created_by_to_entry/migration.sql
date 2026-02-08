-- CreateTable
CREATE TABLE "FieldDailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FieldDailyReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldDailyEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyReportId" TEXT NOT NULL,
    "scheduleActivityId" TEXT,
    "wbs" TEXT,
    "activityName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progressChip" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "FieldDailyEntry_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "FieldDailyReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FieldDailyEntry_scheduleActivityId_fkey" FOREIGN KEY ("scheduleActivityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Photo_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ProjectActivity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Photo_fieldUpdateId_fkey" FOREIGN KEY ("fieldUpdateId") REFERENCES "FieldUpdate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Photo_dailyEntryId_fkey" FOREIGN KEY ("dailyEntryId") REFERENCES "FieldDailyEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("activityId", "capturedAt", "createdBy", "fieldUpdateId", "hash", "height", "id", "projectId", "sizeBytes", "uploadedAt", "urlMain", "urlThumb", "width") SELECT "activityId", "capturedAt", "createdBy", "fieldUpdateId", "hash", "height", "id", "projectId", "sizeBytes", "uploadedAt", "urlMain", "urlThumb", "width" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FieldDailyReport_projectId_date_key" ON "FieldDailyReport"("projectId", "date");
