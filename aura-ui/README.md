# Aura UI ✨

This is the frontend UI for the **Aura Logbook** project — a mood tracking application that interfaces with the AuraLogbook API.

Built with:
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [MUI (Material UI)](https://mui.com/)
- [Axios](https://axios-http.com/)
- [TypeScript](https://www.typescriptlang.org/)


---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server
```bash
Copy code
npm run dev
```
The app will be served at http://localhost:5173 (or similar).
---
## 🔧 Environment Variables
Create a .env file in the root:
```env
VITE_API_BASE_URL=http://localhost:5082/api
```
Use import.meta.env.VITE_API_BASE_URL inside your Axios config to dynamically read the backend URL.
---
## 📁 Folder Structure
```csharp
aura-ui/
├── public/             # Static assets
├── src/                # Main frontend code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-based views
│   ├── services/       # API services (Axios)
│   ├── hooks/          # Custom hooks
│   └── App.tsx         # Root component
├── .gitignore
├── package.json
└── vite.config.ts
```
---
## 📌 To-Do
[] Build Login & Register pages

[] Add mood entry form

[] Create Dashboard views for analytics (charts, stats)

[] Protect routes with JWT authentication
---
## 💡 Tips
- Keep API token in localStorage or authContext
- Use MUI’s ThemeProvider to manage dark/light mode
- Style components with sx={{}} or styled() from Emotion
---
## 🛠 Contributors
Built by @GemsForge
---
