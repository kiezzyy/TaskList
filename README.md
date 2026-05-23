# TaskList

TaskList is a local-first workspace application for organizing tasks in Notion-inspired tabs and kanban boards. It preserves the original task, subtask, timer, session history, timestamp, recovery, export, and import workflows while moving the interface to a modern workspace layout.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand
- Backend: Node.js, Express, TypeScript, Prisma
- Database: SQLite only, stored locally
- Desktop shell: Electron

## Install

```bash
npm run install:all
npm run db:migrate
```

If PowerShell blocks `npm`, use `npm.cmd` for the same commands.

## Run

```bash
npm run dev
```

This starts the backend API on `http://localhost:4000`, the Vite frontend on `http://localhost:5173`, and the Electron desktop window.

For browser-only development:

```bash
npm run dev:backend
npm run dev:frontend
```

## Build

```bash
npm run build
```

The build command compiles the backend, frontend, and Electron entry points.

## Desktop Installers

TaskList uses Electron Builder to create normal desktop installers:

```bash
npm run dist:win
npm run dist:mac
npm run dist:linux
```

Outputs are written to `release/`:

- Windows: `.exe` NSIS installer
- macOS: `.dmg`
- Linux: `.AppImage`

Installed builds start the local API automatically and store SQLite data in the operating system's app data directory. End users only need to download, install, and open TaskList.

## Test

```bash
npm run test
```

Backend tests cover timer math and workspace import validation.

## Workspace Features

- Workspace tabs for Personal, School, Work, Projects, or any custom area
- Kanban columns: To Do, Progress, Reviewing, Complete
- Drag-and-drop task movement between columns
- Task creation, editing, deletion, priority changes, and status changes
- Subtasks with their own status and timer controls
- Start, pause, resume, and stop timers
- Multiple timer sessions with accumulated duration
- Activity history and recycle-bin recovery metadata
- JSON workspace export and import
- SQL persistence across refreshes, browser restarts, Electron restarts, and machine restarts

## Export And Import

Use the workspace header buttons:

- Export downloads a JSON backup.
- Import validates the selected JSON file before restoring.
- Import supports `merge` and `replace` modes.

Backups include task lists, tasks, statuses, priorities, descriptions, subtasks, history, timestamps, timer sessions, recycle-bin metadata, app version, schema version, and total recorded duration.

Invalid imports are rejected with validation messages for malformed JSON, incompatible schema versions, broken relationships, duplicate IDs, missing required fields, or corrupted structure.

## Database

The schema lives in `backend/prisma/schema.prisma`. Runtime initialization reads `backend/prisma/migrations/20260519061000_init_desktop/migration.sql` and creates the SQLite tables if needed.

Set a custom database path with:

```bash
DATABASE_URL="file:./tasklist.db"
```

Local database files are ignored by Git.

## Architecture

```text
project-root/
├── backend/
│   ├── prisma/
│   └── src/
│       ├── config/
│       ├── database/
│       ├── middleware/
│       ├── task/
│       └── workspace/
├── electron/
├── frontend/
│   └── src/
│       ├── app/
│       ├── layouts/
│       ├── shared/
│       ├── task/
│       └── workspace/
└── package.json
```

The backend owns validation, persistence, timer sessions, export/import, recovery metadata, and API security. The frontend owns workspace navigation, tabs, kanban interactions, task cards, timer controls, and import/export actions.

## Automated Releases

GitHub Actions is configured in `.github/workflows/release.yml`.

The workflow runs when:

- a version tag such as `v1.0.0` is pushed
- a GitHub Release is created or published
- it is manually dispatched

The release pipeline installs dependencies, generates the Prisma client, runs backend tests, builds the frontend/backend/Electron app, packages installers on native runners, uploads workflow artifacts, and attaches binaries to GitHub Releases.

Release outputs:

- `TaskList-<1.0.0>-win-x64.exe`
- `TaskList-<version>-mac-<arch>.dmg`
- `TaskList-<version>-linux-<arch>.AppImage`

## Security Notes

- The app is designed for local machine usage.
- Data is stored in SQLite, not a cloud database.
- Imports are parsed as JSON and validated with Zod before restore.
- Import/export operations are rate-limited.
- Express uses Helmet, a restricted CORS origin, and binds to `127.0.0.1` by default.
- Request bodies are size-limited.
- User-entered text and imported text fields are trimmed, length-limited, and stripped of unsafe control characters.
- Timer state is calculated from persisted session timestamps, with active timer operations serialized per task or subtask to prevent duplicate running sessions.
- Electron runs with `nodeIntegration` disabled, `contextIsolation` enabled, renderer sandboxing enabled, no preload bridge, denied permission prompts, blocked unsafe navigation, and external opening limited to safe URL schemes.
- Sensitive files, environment variables, local databases, logs, caches, and build artifacts are ignored by Git.