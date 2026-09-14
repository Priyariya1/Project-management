# API Documentation

Base URL: `http://localhost:4000/api`

## Conventions

Every response uses the same envelope.

**Success**

```json
{
  "success": true,
  "message": "Projects retrieved",
  "data": { "projects": [] },
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```

`meta` is present only on paginated list endpoints.

**Error**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Please provide a valid email address" }]
}
```

`errors` is present only when individual fields failed validation.

### Status codes

| Code | Meaning |
| --- | --- |
| `200` | OK |
| `201` | Created |
| `400` | Malformed request |
| `401` | Missing, invalid, expired or revoked token |
| `404` | Not found, **or** owned by another user |
| `409` | Conflict (duplicate email) |
| `422` | Validation failed — see `errors` |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |
| `503` | Database unavailable |

> A resource belonging to another user returns `404`, not `403`. Returning
> `403` would confirm that the id exists, which leaks information.

### Authentication

All endpoints except `POST /api/auth/register`, `POST /api/auth/login` and
`GET /health` require a bearer token:

```
Authorization: Bearer <token>
```

Tokens are HS256 JWTs containing `sub` (user id), `email` and `jti` (token id),
and expire after `JWT_EXPIRES_IN` (default `1d`).

### Field naming

Requests and responses use `camelCase` (`fullName`, `startDate`, `projectId`).
The database uses `snake_case`; the API translates between the two.

---

## Authentication

### `POST /api/auth/register`

Rate limited. Creates an account and returns a token — no separate login needed.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `fullName` | string | required, 2–120 chars |
| `email` | string | required, valid email, unique, lower-cased |
| `password` | string | required, 8–72 chars, ≥1 lowercase, ≥1 uppercase, ≥1 number |

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.com","password":"Password123"}'
```

**`201`**

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "id": 1, "fullName": "Ada Lovelace", "email": "ada@example.com", "createdAt": "2026-09-13T12:45:31.000Z" },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-09-14T12:45:31.000Z"
  }
}
```

**Errors** — `409` duplicate email · `422` validation · `429` too many attempts

---

### `POST /api/auth/login`

Rate limited.

**Body:** `email` (required), `password` (required)

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"Password123"}'
```

**`200`** — same shape as register.

**Errors** — `401` `"Invalid email or password"` (identical for an unknown email
and a wrong password, so the response never reveals whether an address is
registered) · `422` · `429`

---

### `POST /api/auth/logout`

Requires authentication. Adds the token's `jti` to the revocation list, so the
token stops working immediately even though it has not expired.

```bash
curl -X POST http://localhost:4000/api/auth/logout -H "Authorization: Bearer $TOKEN"
```

**`200`** `{ "success": true, "message": "Logged out successfully" }`

---

### `GET /api/auth/me`

Requires authentication. Returns the current user. Used by the front end to
validate a stored token on page load.

**`200`** `{ "data": { "user": { "id": 1, "fullName": "…", "email": "…", "createdAt": "…" } } }`

---

## Projects

All project endpoints require authentication and operate **only** on projects
owned by the authenticated user.

### `GET /api/projects`

**Query parameters**

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `search` | string | — | Case-insensitive substring match on name |
| `status` | enum | — | `not_started` · `in_progress` · `completed` |
| `sortBy` | enum | `created_at` | `created_at` · `name` · `status` · `start_date` · `end_date` |
| `sortOrder` | enum | `desc` | `asc` · `desc` |
| `page` | integer | `1` | ≥ 1 |
| `limit` | integer | `20` | 1–100 |

```bash
curl -G http://localhost:4000/api/projects \
  --data-urlencode 'search=Website' --data-urlencode 'status=in_progress' \
  -H "Authorization: Bearer $TOKEN"
```

**`200`**

```json
{
  "success": true,
  "message": "Projects retrieved",
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "Website Redesign",
        "description": "Rebuild the marketing site",
        "status": "in_progress",
        "startDate": "2026-08-24",
        "endDate": "2026-10-08",
        "createdAt": "2026-09-13T12:45:32.000Z",
        "updatedAt": "2026-09-13T12:45:32.000Z",
        "taskCount": 5,
        "completedTaskCount": 1,
        "pendingTaskCount": 3,
        "inProgressTaskCount": 1,
        "progress": 20
      }
    ]
  },
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```

`taskCount`, `completedTaskCount`, `pendingTaskCount`, `inProgressTaskCount`
and `progress` (0–100) are computed server-side.

---

### `GET /api/projects/{id}`

**`200`** — one project, same shape as a list entry, under `data.project`.
**Errors** — `404` not found or owned by someone else · `422` non-numeric id

---

### `POST /api/projects`

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required, 2–150 chars |
| `description` | string \| null | optional, ≤ 5000 chars |
| `status` | enum | optional, default `not_started` |
| `startDate` | `YYYY-MM-DD` \| null | optional, must be a real calendar date |
| `endDate` | `YYYY-MM-DD` \| null | optional, must be ≥ `startDate` |

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Website Redesign","status":"in_progress","startDate":"2026-01-01","endDate":"2026-06-30"}'
```

**`201`** — the created project. **Errors** — `422`

Unknown fields are rejected, so `user_id` or `id` cannot be injected into the row.

---

### `PUT /api/projects/{id}` · `PATCH /api/projects/{id}`

Partial update — send only the fields you want to change. Both verbs behave
identically. At least one field is required.

```bash
curl -X PUT http://localhost:4000/api/projects/1 \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"completed"}'
```

**`200`** — the updated project. **Errors** — `404` · `422`

---

### `DELETE /api/projects/{id}`

Deletes the project **and all of its tasks** (`ON DELETE CASCADE`).

**`200`** — the deleted project, under `data.project`. **Errors** — `404` · `422`

---

### `GET /api/projects/{id}/tasks`

The tasks inside one project. Accepts the same query parameters as
`GET /api/tasks` (except `projectId`, which is taken from the path).

**Errors** — `404` if the project is not yours

---

## Tasks

All task endpoints require authentication and operate only on tasks owned by
the authenticated user.

### `GET /api/tasks`

**Query parameters**

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `search` | string | — | Substring match on name |
| `status` | enum | — | `pending` · `in_progress` · `completed` |
| `priority` | enum | — | `low` · `medium` · `high` |
| `projectId` | integer | — | Restrict to one project |
| `sortBy` | enum | `created_at` | `created_at` · `name` · `due_date` · `priority` · `status` |
| `sortOrder` | enum | `desc` | `asc` · `desc` |
| `page` | integer | `1` | ≥ 1 |
| `limit` | integer | `20` | 1–100 |

```bash
curl -G http://localhost:4000/api/tasks \
  --data-urlencode 'status=pending' --data-urlencode 'priority=high' \
  -H "Authorization: Bearer $TOKEN"
```

**`200`**

```json
{
  "success": true,
  "message": "Tasks retrieved",
  "data": {
    "tasks": [
      {
        "id": 2,
        "projectId": 1,
        "projectName": "Website Redesign",
        "name": "Design new component library",
        "description": null,
        "priority": "high",
        "status": "in_progress",
        "dueDate": "2026-09-17",
        "createdAt": "2026-09-13T12:45:32.000Z",
        "updatedAt": "2026-09-13T12:45:32.000Z"
      }
    ]
  },
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```

---

### `GET /api/tasks/{id}`

**`200`** — one task under `data.task`. **Errors** — `404` · `422`

---

### `POST /api/tasks`

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `projectId` | integer | required, **must be a project you own** |
| `name` | string | required, 2–150 chars |
| `description` | string \| null | optional, ≤ 5000 chars |
| `priority` | enum | optional, default `medium` |
| `status` | enum | optional, default `pending` |
| `dueDate` | `YYYY-MM-DD` \| null | optional, must be a real calendar date |

```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"projectId":1,"name":"Write the spec","priority":"high","dueDate":"2026-10-01"}'
```

**`201`** — the created task.
**Errors** — `404` if `projectId` is not yours · `422`

---

### `PUT /api/tasks/{id}` · `PATCH /api/tasks/{id}`

Partial update. Passing `projectId` moves the task to another project — which
must also be one you own.

**`200`** — the updated task. **Errors** — `404` · `422`

---

### `PATCH /api/tasks/{id}/complete`

Convenience endpoint for the checkbox in the UI.

**Body:** `{ "completed": true }` — optional, defaults to `true`.
`false` reopens the task (sets it back to `pending`).

```bash
curl -X PATCH http://localhost:4000/api/tasks/2/complete \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"completed":true}'
```

**`200`** — the updated task.

---

### `DELETE /api/tasks/{id}`

**`200`** — the deleted task. **Errors** — `404` · `422`

---

## Dashboard

### `GET /api/dashboard/stats`

Also available at `GET /api/dashboard`. Every figure is scoped to the
authenticated user.

```bash
curl http://localhost:4000/api/dashboard/stats -H "Authorization: Bearer $TOKEN"
```

**`200`**

```json
{
  "success": true,
  "message": "Dashboard statistics",
  "data": {
    "projects": { "total": 4, "notStarted": 1, "inProgress": 2, "completed": 1 },
    "tasks": {
      "total": 15,
      "pending": 8,
      "inProgress": 2,
      "completed": 5,
      "overdue": 1,
      "dueToday": 0,
      "byPriority": { "high": 7, "medium": 5, "low": 3 }
    },
    "completionRate": 33,
    "recentProjects": [{ "id": 4, "name": "Customer Onboarding Revamp", "status": "in_progress", "startDate": "2026-09-08", "endDate": "2026-10-23", "createdAt": "2026-09-13T12:45:32.000Z" }],
    "upcomingTasks": [{ "id": 12, "name": "Build in-app checklist", "priority": "high", "status": "pending", "dueDate": "2026-09-12", "projectId": 4, "projectName": "Customer Onboarding Revamp" }]
  }
}
```

The five figures the brief asks for map as follows:

| Requirement | Field |
| --- | --- |
| Total Projects | `projects.total` |
| Total Tasks | `tasks.total` |
| Completed Tasks | `tasks.completed` |
| Pending Tasks | `tasks.pending` |
| Projects In Progress | `projects.inProgress` |

---

### `GET /api/dashboard/activity`

The authenticated user's audit trail, newest first.

**Query:** `limit` (default `50`, max `200`)

**`200`**

```json
{
  "data": {
    "activity": [
      { "id": 42, "action": "project.create", "entityType": "project", "entityId": 7, "metadata": { "name": "New Project" }, "createdAt": "2026-09-13T12:50:00.000Z" }
    ]
  }
}
```

Recorded actions: `user.register`, `user.login`, `user.logout`,
`project.create`, `project.update`, `project.delete`, `task.create`,
`task.update`, `task.delete`, `task.complete`, `task.reopen`.

---

## Utility

### `GET /health`

No authentication, not rate limited — intended for container and load-balancer probes.

```json
{ "success": true, "status": "ok", "uptime": 128.4, "timestamp": "2026-09-13T12:45:44.746Z" }
```

### `GET /api`

Lists the available endpoints.

---

## Rate limiting

| Scope | Window | Limit |
| --- | --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login` | 15 min | 10 failed attempts per IP |
| All `/api/*` | 15 min | 500 requests per IP |

Successful auth requests are not counted against the auth budget, so a
legitimate user cannot lock themselves out by signing in. Responses carry
`RateLimit-*` headers; exceeding a limit returns `429`.

All four values are configurable — see
[Environment Variables](../README.md#environment-variables).
