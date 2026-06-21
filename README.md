# TaskList

TaskList is a local-first, offline-ready desktop workspace designed to help you organize your tasks, track your time, and manage your focus without relying on third-party cloud services. 

If you like the clean tabs and Kanban boards of **Notion** but want something fast, privacy-first, and fully functional offline, TaskList was built for you.

---

## Why I Created This (Inspiration)

I'm a big fan of Notion's clean layouts and organizational system, but I wanted a task manager that:
1. **Runs 100% local:** No internet connection required, zero loading screens, and no mandatory cloud logins.
2. **Has built-in time tracking:** A simple way to track task duration directly on the cards.
3. **Respects privacy:** My data should remain on my computer, not on someone else's server.

---

## Frequently Asked Questions & Security

### Where is my information stored?
Your tasks, subtasks, timers, and history are stored **100% locally** in an SQLite database on your own computer. 
- When running the app, it saves your data in your operating system's standard AppData directory (e.g., `C:\Users\<username>\AppData\Roaming\TaskList` on Windows).
- Your data never leaves your machine. There are no tracking scripts, analytics, or cloud uploads.

### Can other people hack it?
Because TaskList runs entirely on your local machine and has **no backend cloud server**, it cannot be hacked remotely. There is no website or database endpoint for hackers to target. Your tasks are as secure as your computer itself. Keep your own operating system secure, and your tasks will remain safe.

### Does it contain malware?
**No.** The entire codebase is open-source and visible here on GitHub. It does not contain any telemetry, trackers, miners, or malicious code.

### Why does Windows Defender SmartScreen block the app?
When you first run the installer, Windows might pop up a warning saying:
> *"Microsoft Defender SmartScreen prevented an unrecognized app from starting..."*

This is **normal behavior for self-packaged/open-source applications**. 
To make this warning go away permanently for everyone, developers have to purchase a digital code-signing certificate from a Microsoft-approved Certificate Authority (which costs hundreds of dollars a year). Because this is a free, self-built project, it isn't digitally signed.

#### How to safely bypass this:
1. When the blue SmartScreen window pops up, click **"More info"**.
2. Click the **"Run anyway"** button that appears.
3. The app will launch normally, and Windows will remember your choice.

---

## How to Download & Install

You don't need any technical setup to use TaskList. Just grab the installer for your operating system:

->> **[Download the Latest Release on GitHub](https://github.com/kiezzyy/TaskList/releases/latest)**

* **Windows:** Download the `.exe` installer.
* **macOS:** Download the `.dmg` file.
* **Linux:** Download the `.AppImage` file.

---

## For Developers (Local Setup)

If you want to run or build the application from source, follow these steps.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies
Clone the repository, open your terminal in the project root, and run:
```powershell
# Installs dependencies for root, frontend, and backend
npm run install:all
```
*Note: If Windows PowerShell blocks the command due to script execution policies, run `npm.cmd run install:all` instead.*

### 2. Set Up Database
Generate the local Prisma database client:
```powershell
npm run prisma:generate --prefix backend
```

### 3. Run in Development Mode
Start the local Express backend, Vite dev server, and Electron shell concurrently:
```powershell
npm run dev
```

### 4. Package/Build the Desktop App
To package the app into a production-ready installer for your OS:
```powershell
# Generates a production installer in the /release directory
npm run dist
```

## Build

```bash
npm run build
```

The build command compiles the backend, frontend, and Electron entry points.

## Desktop Installers

Download the latest ready-to-install desktop builds from:

[TaskList GitHub Releases](https://github.com/kiezzyy/TaskList/releases/latest)

End users do not need Node.js, npm, a terminal, or any development setup. Download the installer for your operating system, install it, and open TaskList.

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

- Windows: `TaskList-1.0.0-win-x64.exe`
- macOS: `TaskList-1.0.0-mac-<arch>.dmg`
- Linux: `TaskList-1.0.0-linux-<arch>.AppImage`

The filenames above are examples. The actual downloadable files are attached to the GitHub Release after the release workflow finishes.

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
