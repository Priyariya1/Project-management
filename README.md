# Project Management System

A web application for managing projects and tasks: create projects, organise
tasks inside them, track progress, and see everything on a dashboard.

**Stack:** React 18 + Tailwind CSS · Express.js · MySQL 8

---

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Running the application](#running-the-application)
- [Tests](#tests)
- [Docker](#docker)
- [Project structure](#project-structure)
- [Security](#security)
- [Documentation](#documentation)

---

## Features

**Authentication** — register, log in, log out. Passwords are bcrypt-hashed;
sessions are JWTs that survive a page refresh and are revoked server-side on
logout.

**Projects** — full CRUD, with name, description, status (Not Started / In
Progress / Completed), start date, end date and created date. Each card shows
live task counts and a progress bar.

**Tasks** — full CRUD inside a project, with name, description, priority (Low /
Medium / High), status (Pending / In Progress / Completed), due date and
created date. One-click completion toggle, and tasks can be moved between
projects.

**Dashboard** — total projects, total tasks, completed tasks, pending tasks and
projects in progress, plus completion rate, overdue counts, recent projects and
upcoming deadlines. Every figure is scoped to the signed-in user.

**Search & filtering** — search projects and tasks by name; filter projects by
status; filter tasks by status, priority and project. Plus sorting and
pagination on both lists.

**Also included** — Docker support, 63 integration tests, pagination, sorting,
audit logs, rate limiting and structured request logging.

---

## Quick start

Requires **Node.js ≥ 18** and either **Docker** or a local **MySQL ≥ 8**.

```bash
# 1. Database (Docker — no local MySQL needed)
docker run -d --name pms-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=project_management \
  -e MYSQL_USER=pms_user \
  -e MYSQL_PASSWORD=pms_password \
  -p 3307:3306 mysql:8.0

# 2. Backend
cd server
cp .env.example .env                                   # then edit DB_PORT=3307
npm install
npm run db:migrate                                     # create tables
npm run db:seed                                        # optional demo data
npm run dev                                            # → http://localhost:4000

# 3. Frontend (in a second terminal)
cd client
cp .env.example .env
npm install
npm run dev                                            # → http://localhost:5173
```

Open **http://localhost:5173**.

If you seeded the database, sign in with:

| Email | Password |
| --- | --- |
| `ada@example.com` | `Password123` |
| `grace@example.com` | `Password123` |

The two accounts hold different data — useful for confirming that one user
cannot see another's projects.

---

## Setup

### Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 18 (20 LTS recommended) | `node -v` |
| npm | ≥ 9 | ships with Node |
| MySQL | ≥ 8.0 | or Docker (see above) |

### Install

```bash
cd server && npm install
cd ../client && npm install
```

### Configure

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Then edit `server/.env` — at minimum the `DB_*` values and `JWT_SECRET`.

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Environment variables

### `server/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` · `production` · `test` |
| `PORT` | `4000` | Port the API listens on |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated list of allowed browser origins |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_PORT` | `3306` | MySQL port (use `3307` with the Docker command above) |
| `DB_USER` | `pms_user` | MySQL user the app connects as |
| `DB_PASSWORD` | `pms_password` | Password for `DB_USER` |
| `DB_NAME` | `project_management` | Database name (tests use `<name>_test`) |
| `DB_CONNECTION_LIMIT` | `10` | Connection pool size |
| `DB_ROOT_USER` | `root` | **Migration only.** Account used to `CREATE DATABASE`. Leave blank to skip. |
| `DB_ROOT_PASSWORD` | — | Password for `DB_ROOT_USER` |
| `JWT_SECRET` | — | **Required in production**, ≥ 32 chars. Signs the tokens. |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime (`15m`, `12h`, `7d`, …) |
| `BCRYPT_SALT_ROUNDS` | `12` | bcrypt cost factor |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` | Auth rate-limit window (15 min) |
| `AUTH_RATE_LIMIT_MAX` | `10` | Failed auth attempts allowed per window per IP |
| `GLOBAL_RATE_LIMIT_WINDOW_MS` | `900000` | Global rate-limit window |
| `GLOBAL_RATE_LIMIT_MAX` | `500` | Requests allowed per window per IP |
| `LOG_LEVEL` | `info` | `error` · `warn` · `info` · `debug` |

The server refuses to start in production without a `JWT_SECRET` of at least 32
characters, so an insecure deployment fails loudly rather than silently.

### `client/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | API base URL. `/api` uses the Vite dev proxy. For a deployed front end, set the full origin, e.g. `https://api.example.com/api`. |

`VITE_*` variables are inlined into the bundle at **build** time — rebuild
after changing them, and never put a secret in one.

---

## Database setup

### Option A — Docker (recommended)

```bash
docker run -d --name pms-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=project_management \
  -e MYSQL_USER=pms_user \
  -e MYSQL_PASSWORD=pms_password \
  -p 3307:3306 mysql:8.0
```

Set `DB_PORT=3307` and `DB_ROOT_PASSWORD=rootpassword` in `server/.env`.

Port 3307 is used so this does not collide with a MySQL already running
locally on 3306.

### Option B — existing MySQL

```sql
CREATE DATABASE project_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'pms_user'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON project_management.* TO 'pms_user'@'localhost';
FLUSH PRIVILEGES;
```

Then set `DB_USER`, `DB_PASSWORD` and `DB_PORT=3306` in `server/.env`, and
leave `DB_ROOT_USER` blank since the database already exists.

### Create the tables

```bash
cd server
npm run db:migrate          # creates the database if needed, then applies schema.sql
npm run db:seed             # optional: 2 demo users with projects and tasks
npm run db:reset            # drop everything and start over
```

`db:migrate` is idempotent — every statement uses `IF NOT EXISTS`, so running
it twice is safe.

The schema is a single file: [`server/src/db/schema.sql`](server/src/db/schema.sql).
See [docs/DATABASE.md](docs/DATABASE.md) for the ER diagram and the reasoning
behind the design.

---

## Running the application

### Development

```bash
# Terminal 1
cd server && npm run dev     # http://localhost:4000 (nodemon)

# Terminal 2
cd client && npm run dev     # http://localhost:5173 (Vite)
```

The Vite dev server proxies `/api` to `http://localhost:4000`, so the browser
makes same-origin requests and CORS never enters the picture in development.

### Production build

```bash
cd client && npm run build   # static files → client/dist
cd ../server && npm start    # NODE_ENV=production
```

Serve `client/dist` from any static host or CDN, and point
`VITE_API_BASE_URL` at the deployed API before building.

### Scripts

**`server/`**

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon |
| `npm start` | Start for production |
| `npm run db:migrate` | Create the database and apply the schema |
| `npm run db:seed` | Insert demo data |
| `npm run db:reset` | Drop, recreate and reseed |
| `npm test` | Run the integration tests |

**`client/`**

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |

---

## Tests

63 integration tests covering authentication, authorisation, CRUD, validation,
search/filter/sort/pagination and the dashboard — exercising the real Express
app against a real MySQL database via supertest.

```bash
# One-time: create the test database
docker exec pms-mysql mysql -uroot -prootpassword \
  -e "CREATE DATABASE IF NOT EXISTS project_management_test
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      GRANT ALL PRIVILEGES ON project_management_test.* TO 'pms_user'@'%';"

docker exec -i pms-mysql mysql -uroot -prootpassword project_management_test \
  < server/src/db/schema.sql

# Run
cd server && npm test
```

```
Test Suites: 4 passed, 4 total
Tests:       63 passed, 63 total
```

Tests use `project_management_test` (never your development data), truncate
between suites, and disable rate limiting so they are not throttled. Set
`DEBUG_TESTS=1` to see the server logs during a run.

---

## Docker

Bring up all three services at once:

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| Front end (nginx) | http://localhost:8080 |
| API | http://localhost:4000 |
| MySQL | `localhost:3307` |

The schema is applied automatically when the MySQL volume is first created. To
seed demo data afterwards:

```bash
docker compose exec server node src/db/seed.js
```

Set `JWT_SECRET` in a `.env` file next to `docker-compose.yml` before exposing
the stack to anyone else.

Tear down with `docker compose down`, or `docker compose down -v` to delete the
database volume too.

---

## Project structure

```
.
├── client/                      React + Tailwind front end
│   └── src/
│       ├── api/                 axios instance, interceptors, endpoint wrappers
│       ├── components/          reusable UI (forms, modals, badges, states)
│       ├── context/             AuthContext, ToastContext
│       ├── hooks/               useForm, useDebouncedValue
│       ├── pages/               one component per route
│       └── utils/               formatting helpers, enum constants
│
├── server/                      Express REST API
│   ├── src/
│   │   ├── config/              env validation, MySQL pool, winston logger
│   │   ├── db/                  schema.sql, migrate.js, seed.js
│   │   ├── middleware/          auth, validate, rateLimiter, errorHandler, notFound
│   │   ├── modules/             one folder per resource
│   │   │   ├── auth/            routes · controller · service · validation
│   │   │   ├── projects/        routes · controller · service · validation
│   │   │   ├── tasks/           routes · controller · service · validation
│   │   │   └── dashboard/       routes · controller · service
│   │   ├── services/            audit log
│   │   ├── utils/               AppError, asyncHandler, validators, pagination
│   │   ├── app.js               middleware pipeline
│   │   ├── routes.js            mounts every module under /api
│   │   └── server.js            startup, DB check, graceful shutdown
│   └── tests/                   integration tests
│
├── docs/
│   ├── API.md                   full endpoint reference
│   └── DATABASE.md              ER diagram and schema notes
│
└── docker-compose.yml
```

The backend follows a **routes → controller → service** split:

- **Routes** declare the path and chain the middleware (auth, validation).
- **Controllers** handle HTTP: read the request, call a service, shape the response.
- **Services** hold the business logic and are the only layer that touches SQL.

Controllers contain no SQL and services contain no `req`/`res`, which keeps
each layer independently testable.

---

## Security

| Requirement | Implementation |
| --- | --- |
| Password hashing | bcrypt, cost factor 12. The hash column is excluded from every `SELECT` that feeds a response. |
| No plain-text passwords | Enforced at the service layer and covered by a test that reads the column directly. |
| Protected APIs | Every route except register, login and `/health` sits behind `requireAuth`. |
| JWT authentication | HS256, `sub` + `jti` claims, configurable expiry, verified on every request. |
| Effective logout | The token's `jti` is written to `revoked_tokens` and rejected thereafter — logout is not merely a client-side gesture. |
| Authorisation | Ownership is part of the SQL `WHERE` clause (`user_id = ?`), never a post-filter, so another user's rows are never loaded. The owner id always comes from the verified token, never from the request. |
| No information leaks | Another user's resource returns `404`, not `403`, so ids cannot be enumerated. Login returns one message for both a wrong password and an unknown email. |
| Input validation | Every body, query and route param is parsed by a zod schema: required fields, email format, real calendar dates (`2026-02-31` is rejected), non-empty strings, enum values, integer ids and ranges. |
| No mass assignment | Schemas are `.strict()`, so unknown keys such as `user_id` or `id` are rejected outright. |
| SQL injection | Every query is parameterised — no user input is ever concatenated into SQL. `ORDER BY` columns come from a whitelist; `LIMIT`/`OFFSET` are integers re-coerced after validation. `multipleStatements` is disabled on the pool. |
| Rate limiting | 10 failed auth attempts per IP per 15 minutes, plus a 500-request global cap. Successful logins are not counted. |
| Security headers | `helmet`, and `x-powered-by` disabled. |
| CORS | Restricted to an explicit origin allowlist. |
| Error handling | One centralised handler. Stack traces and driver messages never reach a client; unexpected errors return a generic message and are logged in full server-side. |
| Payload limits | Request bodies capped at 100 kB. |
| Audit trail | Every create, update, delete and auth event is recorded with the user, entity and IP. |

### Verified

```
✓ user B reading   user A's project        → 404
✓ user B updating  user A's project        → 404
✓ user B deleting  user A's project        → 404
✓ user B attaching a task to A's project   → 404
✓ no token                                 → 401
✓ tampered token signature                 → 401
✓ token reused after logout                → 401
✓ "' OR 1=1 --" in search                  → 0 results, treated as literal text
✓ "name; DROP TABLE users" in sortBy       → 422, tables intact
✓ {"user_id": 2} in a create body          → 422, unrecognized key
✓ password column                          → $2a$12$… (60-char bcrypt hash)
✓ 11 rapid failed logins                   → 429 from the 9th
```

---

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how the app is put
  together: the request path traced end to end, the layering, and the reasoning
  behind each decision.
- **[docs/API.md](docs/API.md)** — every endpoint, with request/response
  examples, query parameters, validation rules and error codes.
- **[docs/DATABASE.md](docs/DATABASE.md)** — ER diagram, relationships, index
  strategy and the reasoning behind each design decision.

---

## Troubleshooting

**`Could not connect to MySQL`** — check the container is up
(`docker ps`), and that `DB_PORT` in `server/.env` matches the published port
(`3307` for the Docker command above, `3306` for a local install).

**`ER_ACCESS_DENIED_ERROR` during migration** — `DB_ROOT_USER` /
`DB_ROOT_PASSWORD` are wrong. If the database already exists, leave
`DB_ROOT_USER` blank to skip the `CREATE DATABASE` step.

**Front end shows "Cannot reach the server"** — the API is not running, or
`VITE_API_BASE_URL` points somewhere else. With the default `/api`, the Vite
proxy expects the API on port 4000.

**`429 Too many requests` while testing logins** — the brute-force guard, working
as intended. Wait 15 minutes, raise `AUTH_RATE_LIMIT_MAX`, or restart the server
(the counters are in memory).

**Port already in use** — change `PORT` in `server/.env`, or `server.port` in
`client/vite.config.js`.


The project, in short

You built a three-tier app: React talks HTTP, Express owns all the logic and SQL, MySQL enforces the rules a second time. Each tier assumes the one above it may be lying — the browser's form validation is for feedback speed only, the API re-validates everything, and the database still refuses a bad foreign key or an invalid enum.

The one requirement that shaped everything is buried in the brief's security section: a user must never reach another user's data. That's why two things are true throughout the codebase — ownership lives in the SQL WHERE clause rather than a JavaScript check after the fact, and someone else's record returns 404 rather than 403. The first means another user's row is never loaded into memory at all; the second means an attacker can't walk the ids to learn which records exist.

The backend is four files per resource, always the same: routes declare paths and chain middleware, controllers speak HTTP, services hold the logic and are the only place SQL is written, validation files hold the Zod schemas. Two rules keep it honest — controllers have no SQL, services have no req.

The single most useful thing to be able to narrate is one request end to end. POST /api/tasks goes: form validates locally → axios attaches the token → middleware chain → requireAuth verifies the signature, checks the revocation list, sets req.user → Zod parses and replaces the body → controller calls service.create(req.user.id, req.body) → service proves the parent project is yours → parameterised insert → MySQL enforces FKs and enums → audit log → standard response envelope. The sentence that ties it together: the client is asked which project, but never asked who it is.

---

Two things worth knowing about the doc

It's written for the interview, not just as a reference. The brief says you'll be asked to explain your decisions, so roughly a third of it is trade-offs with the rejected alternative stated, plus nine likely questions with short answers — including "what's the weakest point of this design?" The honest answer there is the token in localStorage, readable by any XSS; an httpOnly cookie would close it but needs CSRF protection alongside.

It documents the denormalisation deliberately. tasks.user_id duplicates a fact you could derive by joining through projects. That's a real exception to 3NF and an interviewer may well probe it, so the doc states the two reasons (ownership becomes one indexed predicate; dashboard aggregates skip a join) and why it can't drift — the API always derives it from the parent project, and the schema refuses a client-supplied user_id.