-- CreateTable
CREATE TABLE "task_statuses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "task_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_listId_fkey" FOREIGN KEY ("listId") REFERENCES "task_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "task_statuses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "task_sessions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workspace_metadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appVersion" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "lastExportAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "task_statuses_name_key" ON "task_statuses"("name");

-- CreateIndex
CREATE INDEX "task_lists_name_idx" ON "task_lists"("name");

-- CreateIndex
CREATE INDEX "tasks_listId_idx" ON "tasks"("listId");

-- CreateIndex
CREATE INDEX "tasks_statusId_idx" ON "tasks"("statusId");

-- CreateIndex
CREATE INDEX "tasks_name_idx" ON "tasks"("name");

-- CreateIndex
CREATE INDEX "task_sessions_taskId_idx" ON "task_sessions"("taskId");

-- CreateIndex
CREATE INDEX "task_sessions_startedAt_idx" ON "task_sessions"("startedAt");
