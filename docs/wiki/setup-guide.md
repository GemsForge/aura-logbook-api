# Setup Guide

> Historical snapshot of the [GitHub Wiki Setup Guide](https://github.com/GemsForge/aura-logbook-api/wiki/Setup-Guide), retrieved October 18, 2026. The page was last edited June 10, 2025. These commands may no longer work for the current project; use the current [repository README](../../README.md) for setup instructions.

## 1. Clone the respository

```bash
git clone https://github.com/GemsForge/aura-logbook-api.git
cd aura-logbook-api
```

## 2. Run the project

```bash
cd AuraLogbook.Api
dotnet run
```

## 3. Install dependencies (if needed)

```bash
dotnet add package Dapper
dotnet add package Microsoft.Data.Sqlite
```

## 🔐 Authentication

AuraLog uses JWT tokens for secure access to endpoints.

- **Register:** `POST /auth/register`
- **Login:** `POST /auth/login`
- Send the token as `Authorization: Bearer` in request headers.
