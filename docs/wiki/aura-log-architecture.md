# 🏗️ AuraLog Architecture

> Local copy of the [GitHub Wiki page](https://github.com/GemsForge/aura-logbook-api/wiki/%F0%9F%8F%97%EF%B8%8F-AuraLog-Architecture). Last edited on GitHub: June 10, 2025. Retrieved October 18, 2026. Preserved as a dated snapshot; implementation details below are not current guidance. See the current [API README](../../AuraLogbook.Api/README.md), [runtime environments](../runtime-environments.md), and [database ERD](../database-erd.md).

AuraLog is designed as a modular, API-first web application that follows clean separation of concerns. It uses a layered architecture for flexibility, maintainability, and scalability.

## 🧱 Layered Structure

### 1. API Layer (`Controllers/`)

- Responsibility: Handle HTTP requests/responses
- Contents: Routes, request validation, auth decorators
- Example: `MoodController`, `AuthController`

### 2. Service Layer (`Services/`)

- Responsibility: Business logic
- Contents: Mood calculations, user auth, summaries
- Example: `MoodService`, `AuthService`

### 3. Data Access Layer (`Repositories/`)

- Responsibility: Communicate with SQLite using Dapper
- Contents: SQL queries, connection handling
- Example: `MoodRepository`, `UserRepository`

### 4. Domain Layer (`Models/`)

- Responsibility: Core data structures and contracts
- Contents: DTOs, database models, request/response types
- Example: `MoodEntry`, `User`, `DashboardSummaryDTO`

## 🗃️ Database Design

### SQLite + Dapper

Dapper is used for performance and SQL-first control, avoiding heavy ORM overhead.

### Tables

- `Users`
  - `Id` (PK)
  - `Email`
  - `PasswordHash`
  - `CreatedAt`
- `MoodEntries`
  - `Id` (PK)
  - `UserId` (FK)
  - `Date`
  - `Mood`
  - `Comment`
  - `CreatedAt`

> Each `MoodEntry` is tied to a specific user via `UserId`.

## 🔐 Authentication

AuraLog uses JWT (JSON Web Token) for stateless, secure authentication.

### Flow

1. User registers or logs in.
2. Server generates a JWT token.
3. Token is stored on client (e.g., in localStorage).
4. All protected endpoints require `Authorization: Bearer <token>`.

Middleware checks token validity and user identity for secure access.

## 📡 RESTful API Structure

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Authenticate and return JWT token |
| `GET` | `/moods` | Retrieve moods by date range |
| `POST` | `/moods` | Create a new mood entry |
| `PUT` | `/moods/{id}` | Update an existing mood entry |
| `DELETE` | `/moods/{id}` | Delete a mood entry |
| `GET` | `/dashboard/summary` | Return mood summary for the user |

## 🛡️ Security Practices

- Passwords are hashed securely (e.g., using BCrypt).
- JWT tokens include expiration and are validated per request.
- Each user can only access their own data via `UserId`-based authorization.

## 📈 Future Enhancements

| Feature | Layer(s) affected |
| --- | --- |
| Mood trend visualization | Service, Dashboard |
| CSV export of mood data | Controller, Repo |
| PWA support | Frontend (external) |
| Streak tracking/reminders | Service layer |
| Tags or emoji mood types | Model, API upgrade |

## 🔄 Dependency Flow

```text
Controllers → Services → Repositories → Database
                        ↓
                      Models
```
