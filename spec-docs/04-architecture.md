# Architecture & Stack

## 1. Backend (Java)

| Layer | Choice |
|---|---|
| Language | Java 21 (LTS) |
| Framework | Spring Boot 3.5.x |
| Build tool | Maven (via Maven Wrapper `./mvnw`) |
| Web layer | Spring Web MVC (synchronous) |
| Persistence | Spring Data JPA + Hibernate |
| Database | PostgreSQL 16 |
| DB migrations | Flyway (SQL-based migrations) |
| Auth | Spring Security + JJWT (BCrypt password hashing) |
| Validation | Jakarta Bean Validation |
| API docs | springdoc-openapi (Swagger UI auto-generated from controllers) |
| Testing | JUnit 5 + Spring Boot Test + Testcontainers (real Postgres in Docker) |
| Photo storage | Local filesystem in dev; production backend deferred (see PRD §7) |

**JDK install (macOS):**
```bash
brew install openjdk@21
```

## 2. Frontend (React)

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Build tool | Vite |
| Framework | React 18 |
| Routing | React Router v6 |
| Server state / caching | TanStack Query (React Query) |
| Auth state | React Context |
| HTTP client | Auto-generated from `03-api.yaml` via `openapi-typescript-codegen` |
| Forms | React Hook Form + Zod |
| Component library | MUI (Material UI) |
| Styling | MUI's built-in system (`sx` prop, `styled()`, Emotion under the hood) |
| Testing | Vitest + React Testing Library + MSW (mock service worker) |

**Polling**: TanStack Query is configured to refetch `/me/inbox` on page load and every 30 seconds while the tab is active (per spec).

## 3. Repo Structure (Monorepo)

```
wendyApp/
├── spec-docs/              # All spec markdown + OpenAPI YAML
├── backend/                # Spring Boot app
│   ├── src/main/java/...
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/   # Flyway SQL files (V1__init.sql, etc.)
│   ├── src/test/java/...
│   ├── mvnw, mvnw.cmd
│   └── pom.xml
├── frontend/               # React + Vite + TS app
│   ├── src/
│   │   ├── generated/      # Auto-generated API client (do not hand-edit)
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml      # Postgres for local dev
├── .gitignore
└── README.md
```

## 4. How the Pieces Talk

### Local dev
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`
- Vite dev server proxies `/api/*` to the backend → no CORS in dev
- Frontend code calls `/api/v1/...` paths directly

### Production
- CORS configured in Spring to allow the deployed frontend's origin
- Frontend gets API base URL from build-time env var `VITE_API_BASE_URL`

### Auth
- JWT in `Authorization: Bearer <token>` header
- Token stored in `sessionStorage` on the frontend
- 7-day expiry, no refresh token (revisit per PRD §7)

### API contract sync
1. Edit `spec-docs/03-api.yaml` (the source of truth)
2. Backend: springdoc validates controllers against the spec
3. Frontend: run `npm run generate-api` → regenerates `frontend/src/generated/`
4. TypeScript surfaces any mismatches immediately

## 5. Tooling

| Tool | Purpose | Cost |
|---|---|---|
| **IntelliJ IDEA Community Edition** | Backend IDE (Java/Spring) | Free |
| **VS Code** + Extension Pack for Java (optional) | Frontend IDE; can also handle backend if preferred | Free |
| **Rancher Desktop** | Docker runtime (use the `dockerd (moby)` engine) | Free |
| **Homebrew** | Package manager for JDK, Node, etc. (macOS) | Free |
| **Node.js 20+** | For the frontend toolchain | Free |

## 6. Local Dev Workflow

```bash
# One-time setup
brew install openjdk@21 node
# Install Rancher Desktop from rancherdesktop.io

# Daily workflow (three terminals)
docker compose up -d                      # Postgres
cd backend && ./mvnw spring-boot:run      # Backend on :8080
cd frontend && npm run dev                # Frontend on :5173

# Tests
cd backend && ./mvnw test
cd frontend && npm test
```

You can also run everything from the terminal without an IDE — the Maven Wrapper (`./mvnw`) and `npm` scripts are sufficient. IDEs add convenience (autocomplete, debugging, refactoring), not necessity.

## 7. Key Architectural Principles

- **API spec is the contract**: any change to behavior starts with an edit to `03-api.yaml`.
- **Spec-driven tests first**: backend controller tests and frontend component tests are written against the spec, before implementation.
- **Soft deletes**: Listings, Users keep historical references; never hard-delete records that are part of completed Deals.
- **Database is the source of truth for state machines**: Offer.status and Deal.status transitions are enforced server-side, not just in the UI.
- **No premature optimization**: small scale (tens of users in v1). Plain offset pagination, synchronous request handling, no caching layer, no background workers.

## 8. Out of Scope for v1 Architecture

- WebSockets / Server-Sent Events (use polling)
- Redis or any cache
- Background job queue
- CDN for static assets
- Container orchestration (Kubernetes, ECS)
- Microservices (monolith is correct for this scale)
- Separate read replicas
- Search engine (Elasticsearch, etc.) — Postgres `ILIKE` or full-text search is plenty
