# 🌈 AuraLog API

**AuraLog** is a privacy-first mood tracking API built with simplicity, self-reflection, and scalability in mind. Developed by [GemsForge](https://github.com/GemsForge), the API allows users to log daily emotional states and review patterns over time.

---

## 🔧 Tech Stack

- **.NET Core Web API** – backend framework
- **SQLite** – lightweight embedded database
- **Dapper** – minimal ORM for fast data access
- **JWT** – stateless authentication
- **React (coming soon)** – frontend interface

---

## 📦 Features

- ✅ User registration and JWT-based login
- ✅ Create, update, and delete daily mood entries
- ✅ Secure endpoints scoped to individual users
- ✅ Summary dashboard endpoint (in progress)
- ✅ Commit policy and project board enabled

---

## 🗂 Project Structure
```
AuraLogbook.sln
│
├── AuraLogbook.Api/
│ ├── Controllers/
│ ├── Models/
│ ├── Repositories/
│ ├── Services/
│ ├── Middleware/
│ └── Program.cs
│
└── .github/
└── commit_template.txt
```
---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/GemsForge/aura-logbook-api.git
cd aura-logbook-api
```
### 2.  Build & run the project
```
cd AuraLogbook.Api
dotnet restore
dotnet run
```

### 3.  Configure the SQLite connection
```json
Configure the SQLite connection
```

# Authentication
AuraLog uses JWT (Bearer tokens) for authentication. After login, pass the token in headers:
```
Authorization: Bearer <your_token_here>
```
---
# 🧪 Commit Policy
The commit policy is enforced by the `.github/commit_template.txt`:
```
<type>(scope): <short summary>

feat(auth): add JWT-based login
```
---
#  🛣️ Roadmap
- [ ] MVP API with auth and moods
- [ ] Dashboard summary endpoint
- [ ] Frontedn React UI
- [ ] Data export options
- [ ] API documentation
---
# License
This project is licensed under the MIT License.
---
Built by GemsForge • Forging Simplicity from Complexity 💎
---
