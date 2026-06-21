# TaskList

TaskList is a place to keep your work organized without making it feel heavy. It gives you tabs, boards, history, backups, and recovery in one app. The frontend is built with React and Vite, and the backend uses Express, Prisma, and SQLite for local development.

## What You Get

- Separate workspace tabs for different parts of your life or job
- Create, edit, delete, and restore tasks
- A task history and recycle bin when you need to recover something
- Kanban-style columns with drag and drop
- Compact mode for tighter layouts
- Search and filtering so you can find things quickly
- JSON import and export for backups and moving data around
- Persistent storage through Prisma
- Popups and modals for focused actions

## Project Layout

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
├── frontend/
│   └── src/
│       ├── app/
│       ├── layouts/
│       ├── shared/
│       ├── task/
│       └── workspace/
├── docker-compose.yml
└── package.json
```

## Requirements

- Node.js 20 or newer
- npm
- SQLite for local development
- Docker and Docker Compose if you want to run the container setup

## Install

```powershell
npm run install:all
```

## Environment Variables

Backend settings live in `backend/.env`.

```env
DATABASE_URL="file:./tasklist.db"
PORT=4000
HOST=127.0.0.1
FRONTEND_ORIGIN="http://localhost:5173"
ALLOW_FILE_ORIGIN=false
```

- `FRONTEND_ORIGIN` can be a single origin or a comma-separated list.
- If the frontend and backend are served from the same place, the client uses `/api` by default.
- If the frontend is hosted somewhere else, set `VITE_API_BASE_URL` when you build it.

## Local Development

Start the backend and frontend together:

```powershell
npm run dev:web
```

The root `dev` script does the same thing.

## Build

Build the web app:

```powershell
npm run build:web
```

That command builds both the backend and frontend for browser deployment.

## Database

The Prisma schema lives in `backend/prisma/schema.prisma`.

Initialize the local database with:

```powershell
npm run db:migrate
```

SQLite is the default development database. If you want a different database, update `DATABASE_URL` in the backend environment file.

## Import and Export

TaskList uses JSON workspace backups.

- Export downloads the current workspace as a JSON file.
- Import checks schema version, required fields, structure, and file size before it is accepted.
- Import supports merge and replace workflows.

## Docker

The repository includes a `docker-compose.yml` setup with:

- `backend` on port `4000`
- `web` behind a domain proxy
- `proxy` serving the public site on ports `80` and `443`

The proxy sends `/api` requests to the backend and everything else to the frontend container, so the browser sees the app as one site.

For local testing you can still open the site on your machine after mapping the proxy ports.

## Deploying to a Domain

Yes, TaskList can live at a real website address like `https://www.tasklist.com`.

In that setup, people just open the domain in their browser. The shell commands are only for you when you deploy or update the server.

The usual setup looks like this:

1. Point your domain's DNS A record at the server's public IP.
2. Copy [.env.example](.env.example) to `.env`.
3. Set `TASKLIST_DOMAIN` to your public domain, for example `www.tasklist.com`.
4. Set `TASKLIST_FRONTEND_ORIGIN` to the same public URL, for example `https://www.tasklist.com`.
5. Set `TASKLIST_CADDY_EMAIL` to the email address used for TLS certificates.
6. Start the stack on the server.

If you use a reverse proxy, keep the browser-facing URL and `TASKLIST_FRONTEND_ORIGIN` in sync.

## VPS Notes

- Backend data persists in the Docker volume `tasklist-db`.
- The backend container binds to `0.0.0.0` so it is reachable inside the Docker network.
- Public traffic should go to the `web` container, not the backend directly.
- Caddy automatically handles HTTPS for the configured domain.

## Domain Setup Example

If you want the app on `https://www.tasklist.com`, the moving parts usually look like this:

- DNS points `www.tasklist.com` to your server IP
- Caddy gets a certificate for `www.tasklist.com`
- The browser opens `https://www.tasklist.com`
- The proxy sends traffic to the frontend and backend containers internally

That means nobody has to remember a port number or type a command line just to use the app.

## Validation and Security

- Inputs are trimmed and length-limited on the backend
- JSON payloads are validated with Zod
- Large payloads are capped
- Import and export actions are rate-limited
- Server errors are sanitized before they go back to the browser
- CORS is restricted through `FRONTEND_ORIGIN`

## Testing

Run the backend test suite:

```powershell
npm run test --prefix backend
```

The backend tests cover timer math, import validation, and workspace round-trip behavior.
