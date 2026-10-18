# AuraLogbook

A personal mood tracking application built with a **.NET Core Web API** backend and a **React + MUI** frontend.  
Users can log moods, track patterns, and visualize emotional trends over time.
---

## 📦 Project Structure

AuraLogbook/
├── AuraLogbook.Api/ # .NET Core Web API (C#)
├── aura-ui/ # React frontend (Vite + MUI)
└── AuraLogbook.sln # Solution file
---

## 🔧 Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download)
- [Node.js + npm](https://nodejs.org/)
- [Visual Studio 2022+](https://visualstudio.microsoft.com/) (or VS Code)
- (Optional) SQLite browser like **DB Browser for SQLite**
---

## 🚀 Getting Started

### Run the API and UI together

From the repository root, run:

```bash
npm run dev
```

This root npm script is a cross-platform alias for `node Scripts/dev.mjs`.

The launcher starts the API with its `http` Development profile and the Vite UI, prefixes their output with `[API]` and `[UI]`, and stops the sibling service if either process exits or fails to start. Press **Ctrl+C** to stop both. On Windows, it uses `taskkill` to stop each child-process tree.

Expected local URLs:

- UI: http://localhost:58407 (configured in `aura-ui/vite.config.ts`)
- API: http://localhost:5082/api
- API Swagger: http://localhost:5082/swagger

The combined launcher defaults the UI's `VITE_API_BASE_URL` to the selected API URL (normally `http://localhost:5082/api`). An exported `VITE_API_BASE_URL` takes precedence. A conflicting `aura-ui/.env.local` value is reported and ignored for this combined launch, so stale local settings cannot silently route the UI to a different project. Standalone Vite runs continue to use `.env.local` normally. Keep `.env.local` local; it is ignored by Git.

For another local instance, set `AURA_API_PORT` and/or `AURA_UI_PORT` before running the launcher; the API URL defaults to the selected API port. An explicit `VITE_API_BASE_URL` still takes precedence.

Prerequisites: .NET 8 SDK, Node.js 20 or newer, and npm. Install UI dependencies once with `npm ci` from `aura-ui/`.

Troubleshooting:

- If startup reports that a port is already in use, stop the existing service yourself, then retry. The launcher uses Vite's strict-port option and does not kill unrelated processes.
- If UI startup reports missing packages, run `npm ci` in `aura-ui/`.
- If the UI cannot reach the API, confirm the API is listening on port 5082 and that any exported `VITE_API_BASE_URL` points to `http://localhost:5082/api`; restart Vite after changing the value. The combined launcher prints a warning when a local `.env.local` setting conflicts with the selected backend URL.
- If either child exits unexpectedly, the launcher stops its sibling and returns a nonzero exit status. Check the prefixed service output for the first failure.

Manual smoke test: run the root command, open the UI and Swagger URLs above, confirm the UI can make an API request, press Ctrl+C in the launcher terminal, then verify neither port 5082 nor 58407 is still listening.

The launcher tests can be run from the repository root with `node --test Scripts/dev.test.mjs`.

### Clean up stale Git branches

Review local and remote branches conservatively, preserving protected branches, active worktrees, and any unmerged work. Follow the [safe branch cleanup guide](BRANCH_CLEANUP.md) before deleting a branch.

### Run one service by itself

#### Backend – AuraLogbook.Api

```bash
cd AuraLogbook.Api
```

# Restore packages
```
dotnet restore
```

# Run the API on the port used by the frontend
```
dotnet run --launch-profile http
```
The API is available at: http://localhost:5082/api
Swagger is enabled at: http://localhost:5082/swagger

Uses file-based JSON storage for Users & MoodEntries (configurable in appsettings.json)

See [DEPENDENCIES.md](DEPENDENCIES.md) for the weather provider, usage terms, limits, and attribution requirements.
---

#### Frontend – aura-ui (React + MUI)
```bash
cd aura-ui
```

# Install dependencies
```
npm install
```

# Start the development server
```
npm run dev
```
* Accessible at: http://localhost:5173 (Vite default)
* Uses Material UI (MUI) for styled components
* Axios is preconfigured with a base API URL for backend integration
---
# ✨ Features
* 🔐 User authentication with JWT
* 📊 Mood tracking (log, edit, delete)
* 📈 Mood summaries and breakdowns
* 📆 Filter moods by date range
* 📦 JSON-based data storage (simple local persistence for development)
---
# 📁 Environment Configuration
`.env.local` for React (`aura-ui/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:5082/api
```
appsettings.json for API (AuraLogbook.Api/appsettings.json)
```json
"Jwt": {
  "Key": "your_super_secret_key",
  "Issuer": "AuraLogbook",
  "Audience": "AuraLogbookUsers"
},
"Storage": {
  "UserFilePath": "Data/users.json",
  "MoodFilePath": "Data/moods.json"
}
```
---
# 💻 Development Tools
* Swagger for API testing
* Dummy mood seeder available for generating test data
* Environment-aware JWT authentication
* Role-based auth-ready foundation
---
# 📌 Milestones
* ✅ v0.1 - MVP API complete
* 🧠 v0.2 - Mood dashboard analytics
* 🎨 v0.3 - Frontend UI with login, mood entry, summaries
---
# 📃 License
MIT License – Feel free to fork, use, and contribute!
