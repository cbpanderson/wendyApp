# wendyApp

A no-money bartering web app for Sequim, WA. Users list goods/services, browse what neighbors offer, and trade or gift items — with a rating system to build trust.

See `spec-docs/` for the full specification:
- `01-prd.md` — Product requirements
- `02-domain.md` — Data model & state machines
- `03-api.yaml` — OpenAPI contract
- `04-architecture.md` — Tech stack
- `05-test-plan.md` — Test strategy

## Repo Layout

```
wendyApp/
├── spec-docs/        # Specification documents (source of truth)
├── backend/          # Spring Boot 3.5 + Java 21 + Postgres
├── frontend/         # React 18 + TypeScript + Vite + MUI
├── docker-compose.yml
└── README.md
```

## One-Time Setup

You'll need:

| Tool | Install |
|---|---|
| Java 21 | `brew install openjdk@21` (set `JAVA_HOME` in `~/.zshrc`) |
| Node 20+ | `brew install node` |
| Docker | Install [Rancher Desktop](https://rancherdesktop.io); choose `dockerd (moby)` engine |
| IntelliJ IDEA Community (optional) | https://www.jetbrains.com/idea/download/ |
| VS Code (optional) | https://code.visualstudio.com/ |

After installing the frontend toolchain, install dependencies:

```bash
cd frontend
npm install
```

## Daily Dev Workflow

Three terminals:

```bash
# 1. Databases (dev on :5432, test on :5433)
docker compose up -d

# 2. Backend (http://localhost:8080)
cd backend
./mvnw spring-boot:run

# 3. Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

API docs (Swagger UI) available at http://localhost:8080/api/v1/swagger-ui.html once the backend is running.

## Tests

```bash
# Backend
cd backend
./mvnw test

# Frontend
cd frontend
npm test
```

## Regenerating the API client

When `spec-docs/03-api.yaml` changes:

```bash
cd frontend
npm run generate-api
```

This rewrites `frontend/src/generated/` with TypeScript types and a `fetch`-based client matching the OpenAPI spec.

## Env Vars

Backend (defaults are fine for local dev):

| Var | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/wendyapp` | |
| `DATABASE_USER` | `wendyapp` | |
| `DATABASE_PASSWORD` | `wendyapp` | Change for production |
| `JWT_SECRET` | dev placeholder | **Must set** to ≥32 random bytes for prod |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated |
