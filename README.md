# TaskList

TaskList is a direct-access personal workspace for projects, tasks, timers, and portable JSON backups. It has no login or cloud account requirement: data is stored in a local SQL database through the backend.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand
- Backend: Node.js, Express, Prisma
- Database: SQLite by default, with a normalized relational schema

## Run Locally

Install Node.js first, then run:

```bash
npm run install:all
npm run db:migrate
npm run dev:backend
npm run dev:frontend
```

Open `http://localhost:5173`.

## Data Model

The Prisma schema defines normalized SQL tables for:

- `task_lists`
- `tasks`
- `task_sessions`
- `task_statuses`
- `workspace_metadata`

Tasks belong to task lists and statuses. Work sessions belong to tasks and record start time, optional end time, and duration.

## Backup And Restore

Use the workspace header to export or import a JSON backup. Exports include app version, schema version, export timestamp, task/list counts, total recorded duration, statuses, lists, tasks, sessions, and timestamps.

Imports are validated before recovery. Invalid files return clear schema and relationship errors. Valid backups can be merged into the current workspace or used to replace it.