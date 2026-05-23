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
