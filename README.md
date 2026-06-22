# TaskList

TaskList is a production-oriented workspace platform for tasks, history, timers, import/export, and SQL-backed persistence.

It ships as one shared TypeScript codebase with:

- Website deployment
- Android APK deployment through Capacitor
- Live-update-friendly frontend loading
- SQLite for local development
- PostgreSQL-ready backend persistence
- JSON import/export with validation

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand
- Backend: Node.js, Express, Prisma ORM
- Database: SQLite for development, PostgreSQL for production
- Mobile: Capacitor for Android APK packaging

## Getting Started

Install all dependencies from the repo root:

```bash
npm run install:all
```

Run the full desktop/dev stack:

```bash
npm run dev
```

This starts:

- Backend API on `http://localhost:4000`
- Frontend on `http://localhost:5173`
- Electron desktop shell

## Development

Frontend only:

```bash
npm run dev:frontend
```

Backend only:

```bash
npm run dev:backend
```

Build everything:

```bash
npm run build
```

Run backend tests:

```bash
npm test
```

## Database

TaskList uses SQL only.

- SQLite is the default development database
- PostgreSQL is the preferred production database

The backend reads `DATABASE_URL` from the environment.

## Website Deployment

Build the frontend and backend for production, then deploy them behind the same origin or a reverse proxy that exposes the API at `/api`.

```bash
npm run build
```

The frontend will use:

- `http://localhost:4000/api` during local development
- the current site origin plus `/api` in production browser builds
- the packaged Electron API bridge when loaded from file mode

## Android APK

TaskList uses Capacitor for Android packaging and the same frontend codebase as the website.

1. Build the frontend:

```bash
npm run build --prefix frontend
```

2. Sync the Capacitor Android project:

```bash
npm run mobile:build
```

3. Build the APK:

```bash
npm run mobile:apk
```

To point the Android app at a live deployed web frontend for instant UI updates, set:

```bash
TASKLIST_WEB_URL=https://your-deployed-tasklist.example
```

Then re-run the sync/build step.

## Live Updates

TaskList is structured to pick up UI and behavior updates without a reinstall when the frontend is hosted remotely.

The app supports:

- backend version checks through `/api/health`
- refresh prompts when a newer build is detected
- remote frontend loading for the Android shell when `TASKLIST_WEB_URL` is configured

## Import and Export

Workspace backups are JSON-based and include:

- task lists
- tasks
- statuses
- history
- timer sessions
- metadata

Import validation checks:

- file type
- schema
- required fields
- corruption
- compatibility
- duplicate IDs

Supported import modes:

- Merge
- Replace
- Cancel

## Folder Layout

```text
TaskList/
  frontend/
    src/
      workspace/
      kanban/
      task/
      history/
      deleted/
      importExport/
      sidebar/
      timer/
      tabs/
      shared/
      layouts/
      app/
  backend/
    src/
      workspace/
      task/
      history/
      deleted/
      timer/
      importExport/
      validation/
      database/
      middleware/
      config/
  mobile/
    capacitor.config.ts
    android/
```

## Security

TaskList includes:

- request validation
- payload limits
- rate limiting
- safe error handling
- input validation and sanitization
- SQL-backed persistence only

## Notes

- No single file should exceed 800 lines.
- Keep new features split into components, services, hooks, validators, and utilities.
- If you publish the Android shell with remote web assets, users get frontend updates without reinstalling the APK.
