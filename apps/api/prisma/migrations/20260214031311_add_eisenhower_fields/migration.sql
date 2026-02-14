-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BacklogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_BacklogItem" ("assigneeUserId", "contractorId", "createdAt", "definitionOfDone", "description", "discipline", "dueDate", "estimatedHours", "evidenceRequired", "id", "linkedWbsActivityId", "parentId", "priority", "projectId", "status", "storyPoints", "title", "type", "updatedAt") SELECT "assigneeUserId", "contractorId", "createdAt", "definitionOfDone", "description", "discipline", "dueDate", "estimatedHours", "evidenceRequired", "id", "linkedWbsActivityId", "parentId", "priority", "projectId", "status", "storyPoints", "title", "type", "updatedAt" FROM "BacklogItem";
DROP TABLE "BacklogItem";
ALTER TABLE "new_BacklogItem" RENAME TO "BacklogItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
