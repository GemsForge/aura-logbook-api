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

### Backend – AuraLogbook.Api

```bash
cd AuraLogbook.Api
```

# Restore packages
```
dotnet restore
```

# Run the API
```
dotnet run
```
Swagger is enabled at: https://localhost:{port}/swagger

Uses file-based JSON storage for Users & MoodEntries (configurable in appsettings.json)
---

### Frontend – aura-ui (React + MUI)
bash
Copy code
cd aura-ui

# Install dependencies
npm install

# Start the development server
npm run dev
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
.env for React (aura-ui/.env)
```env
VITE_API_BASE_URL=https://localhost:5001/api
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
MIT License – Feel free to fork, use, or contribute!


