# REST API Plan

## 1. Resources

- Users (Auth-managed): Supabase Auth user; no custom table CRUD exposed.
- Sports: Table `sports` — catalog of sport codes and names.
- Goals: Table `goals` — yearly targets per user, optionally per sport.
- Goal History: Table `goal_history` — append-only audit trail of goal changes.
- Activities: Table `activities` — generated Strava-like activities per user.
- AI Suggestions: Table `ai_suggestions` — stored proposals and statuses.
- Stats/Progress (computed): Aggregated/cumulative metrics used for charts (no table; implemented via RPC or Edge Functions).

Implementation notes

- CRUD endpoints for tables use Supabase PostgREST at `/*` with RLS enforcing per-user access.
- Business logic endpoints (generation, stats, AI) use Supabase Edge Functions at `/functions`.

## 2. Endpoints

Conventions

- Authentication: `Authorization: Bearer <supabase_access_token>` on every request.
- Pagination: `page` (default 1), `limit` (default 20, max 100). Offset = `(page-1)*limit`.
- Sorting: `sort_by` (column), `sort_dir` (`asc|desc`).
- Timestamps: ISO 8601 with timezone. Durations in seconds in payloads; mapped to SQL `INTERVAL`.
- Errors: Unified error model described in section 6.

### 2.1 Sports

List sports

- Method: GET
- Path: `/sports`
- Query params: `code` (eq), `name` (ilike), `page`, `limit`, `sort_by`, `sort_dir`
- Response 200 JSON: array of sports

```json
[{ "id": "uuid", "code": "run", "name": "Running", "description": "", "consolidated": null }]
```

- Errors: 401

Get sport by id

- Method: GET
- Path: `/sports?id=eq.{id}`
- Response 200 JSON: single-element array with sport or empty array
- Errors: 401, 404 if empty and handled by wrapper

Create sport (admin-only; optional for MVP)

- Method: POST
- Path: `/sports`
- Body JSON:

```json
{ "code": "run", "name": "Running", "description": "optional", "consolidated": null }
```

- Response: 201 with created row
- Errors: 401, 403 (RLS), 409 (unique violation)

### 2.2 Goals

List goals

- Method: GET
- Path: `/goals`
- Query params:
  - `user_id=eq.auth.uid()` is enforced by RLS; clients need not send it
  - Filters: `year=eq.2025`, `sport_id=eq.{uuid}`, `scope_type=eq.global|per_sport`, `metric_type=eq.distance|time|elevation_gain`
  - Pagination/Sorting: `page`, `limit`, `sort_by` (e.g. `created_at`), `sort_dir`
- Response 200 JSON: array of goals

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "sport_id": null,
    "scope_type": "global",
    "year": 2025,
    "metric_type": "distance",
    "target_value": 2000000,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

- Errors: 401

Get goal by id

- Method: GET
- Path: `/goals?id=eq.{id}`
- Response 200 JSON: single-element array with goal
- Errors: 401, 404 (if wrapped to enforce existence)

Create goal

- Method: POST
- Path: `/goals`
- Body JSON:

```json
{
  "scope_type": "global",
  "year": 2025,
  "metric_type": "distance",
  "target_value": 2000000,
  "sport_id": null
}
```

- Response: 201 with created row
- Success codes: 201 (created)
- Errors: 400/422 (validation), 401, 409 (conflict if unique policy applied per year/metric), 500

Update goal (append-only history is recorded)

- Method: PATCH
- Path: `/goals?id=eq.{id}`
- Body JSON (partial):

```json
{ "target_value": 2200000, "metric_type": "distance" }
```

- Response: 200 with updated row
- Side effects: a `goal_history` row is inserted with previous values (via DB trigger or Edge Function — see section 4)
- Errors: 400/422, 401, 403 (RLS), 404

Delete goal

- Method: DELETE
- Path: `/goals?id=eq.{id}`
- Response: 204
- Errors: 401, 403, 404

List goal history for a goal

- Method: GET
- Path: `/goal_history?goal_id=eq.{goal_id}`
- Query params: `page`, `limit`, `sort_by=changed_at`, `sort_dir=desc`
- Response 200 JSON: array of entries

```json
[
  {
    "id": "uuid",
    "goal_id": "uuid",
    "previous_metric_type": "distance",
    "previous_target_value": 2000000,
    "changed_at": "2025-02-01T00:00:00Z"
  }
]
```

- Errors: 401, 403

### 2.3 Activities

List activities

- Method: GET
- Path: `/api/activities`
- Query params: `from` (gte start_date), `to` (lte start_date), `sport_type` (eq), `type` (eq), `page`, `limit`, `sort_by`, `sort_dir`
- Response 200 JSON: array of activities

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Lunch Run",
    "type": "Run",
    "sport_type": "running",
    "start_date": "2025-09-01T12:00:00Z",
    "start_date_local": "2025-09-01T14:00:00+02:00",
    "timezone": "Europe/Warsaw",
    "utc_offset": 7200,
    "distance": 10000,
    "moving_time": "3600s",
    "elapsed_time": "3700s",
    "total_elevation_gain": 120,
    "average_speed": 2.7
  }
]
```

- Errors: 401

Generate 100 activities for last 12 months (per PRD)

- Method: POST
- Path: `/api/activities-generate`
- Description: Simulates 100 activities using defined distributions; inserts into `activities` for the authenticated user.
- Body JSON (optional overrides):

```json
{
  "primary_sports": ["running", "cycling", "swimming", "hiking"],
  "distribution": { "primary": 0.5, "secondary": 0.3, "tertiary": 0.15, "quaternary": 0.05 },
  "timezone": "Europe/Warsaw"
}
```

- Response 201 JSON:

```json
{ "created_count": 100 }
```

- Errors: 401, 422 (invalid overrides), 500

### 2.4 Stats/Progress (computed)

Annual cumulative progress for charts (My Goals)

- Method: POST
- Path: `/functions/v1/progress-annual`
- Body JSON:

```json
{
  "year": 2025,
  "metric_type": "distance",
  "sport_id": null
}
```

- Response 200 JSON:

```json
{
  "year": 2025,
  "metric_type": "distance",
  "scope_type": "global",
  "series": [
    { "date": "2025-01-01", "value": 0 },
    { "date": "2025-01-02", "value": 5000 }
  ],
  "target_value": 2000000
}
```

- Errors: 401, 422

Historical comparison (goal vs achieved)

- Method: POST
- Path: `/functions/v1/progress-history`
- Body JSON:

```json
{ "years": [2023, 2024, 2025], "metric_type": "distance", "sport_id": null }
```

- Response 200: aggregated per year

### 2.5 AI Suggestions

Generate suggestions (analyze last 3 months, 5% sport threshold)

- Method: POST
- Path: `/functions/v1/ai-suggestions-generate`
- Body JSON:

```json
{ "lookback_days": 90 }
```

- Response 201 JSON:

```json
{
  "suggestions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "status": "pending",
      "suggestion_data": {
        "year": 2025,
        "scope_type": "per_sport",
        "sport_id": "uuid",
        "metric_type": "time",
        "target_value": 600000
      },
      "created_at": "2025-01-05T00:00:00Z"
    }
  ]
}
```

- Errors: 401, 429 (LLM rate limit), 500

List suggestions

- Method: GET
- Path: `/ai_suggestions`
- Query params: `status=eq.pending|accepted|rejected`, `page`, `limit`, `sort_by=created_at`, `sort_dir`
- Response 200 JSON: array of suggestion rows
- Errors: 401

Get suggestion by id

- Method: GET
- Path: `/ai_suggestions?id=eq.{id}`
- Response 200 JSON: single-element array
- Errors: 401, 404

Accept suggestion (create/update goal, mark accepted)

- Method: POST
- Path: `/functions/v1/ai-suggestions-accept`
- Body JSON:

```json
{ "suggestion_id": "uuid" }
```

- Response 200 JSON:

```json
{ "updated_goal_id": "uuid", "status": "accepted" }
```

- Errors: 400 (invalid), 401, 404, 409 (conflict), 500

Reject suggestion

- Method: POST
- Path: `/functions/v1/ai-suggestions-reject`
- Body JSON:

```json
{ "suggestion_id": "uuid" }
```

- Response 200 JSON:

```json
{ "status": "rejected" }
```

- Errors: 400, 401, 404

## 3. Authentication and Authorization

- Mechanism: Supabase Auth (email/password). Clients store session; send `Authorization: Bearer <access_token>`.
- RLS: Enforced on `users`, `goals`, `goal_history`, `activities`, `ai_suggestions` so that only `auth.uid()` can access their rows. Sports may be open read-only.
- Table access via PostgREST: `/{table}`; RLS ensures isolation.
- Edge Functions: Verify JWT with Supabase client; pass `user.id` to business logic. All writes occur with the authenticated service role only when necessary and after explicit checks.
- Scopes/roles: MVP uses a single user role. Admin-only endpoints (sports CRUD) should require a custom claim or separate service route.

## 4. Validation and Business Logic

Validation (from schema)

- Enums: `goal_scope_type` in {`global`, `per_sport`}; `goal_metric_type` in {`distance`, `time`, `elevation_gain`}; `suggestion_status` in {`pending`, `accepted`, `rejected`}.
- Non-negatives: `target_value` ≥ 0; `distance` ≥ 0; `total_elevation_gain` ≥ 0; `average_speed` ≥ 0; `response_time_ms` ≥ 0.
- Types: `year` integer (YYYY). Activities durations in seconds (API payload) mapped to SQL `INTERVAL` on write.
- Sports in Pilates/strength: Only `time` metric is valid — enforced at API layer for goal creation/update.

Goal History

- On any PATCH to `goals` where `metric_type` or `target_value` changes, insert a `goal_history` row capturing previous values and `changed_at`.
- Implementation: Prefer a PostgreSQL trigger for invariants and audit consistency. Alternatively, Edge Function wrapper for updates that performs both steps in a transaction.

Activities Generation (PRD-compliant)

- Generates 100 activities within last 12 months.
- Time-of-day distribution: weekdays mostly afternoons; weekends all day.
- Sport distribution: 50% primary, 30% secondary, 15% tertiary, 5% quaternary.
- Minimal Strava-like fields are populated per PRD.

AI Suggestions

- Analyze last 90 days (default) of activities; compute per-sport share.
- Threshold: suggest only sports with ≥ 5% share.
- Suggestions either create new goals or propose adjustments; accepting will create/update `goals` and mark the suggestion `accepted`; rejecting sets `rejected` and suggestion should not be offered again.

Deletion

- Account deletion removes Auth user and cascades app data via FK `ON DELETE CASCADE`.

## 5. Pagination, Filtering, Sorting

- Pagination: `page` and `limit`; map to PostgREST `range` headers or SQL `limit/offset` in Edge Functions.
- Filtering: Use PostgREST filters (`col=eq.value`, `col=ilike.*value*`, `gte`, `lte`, etc.). Edge Functions validate and convert friendly params to SQL filters.
- Sorting: `order=col.asc|desc` (PostgREST) or `sort_by`/`sort_dir` on functions.

## 6. Error Model

Common error response format

```json
{
  "error": {
    "code": "string",
    "message": "Human readable message",
    "details": { "field": "optional context" }
  }
}
```

HTTP codes

- 200 OK, 201 Created, 204 No Content
- 400 Bad Request (invalid payload), 401 Unauthorized, 403 Forbidden (RLS/ownership), 404 Not Found, 409 Conflict (uniqueness/accept race), 422 Unprocessable Entity (semantic validation), 429 Too Many Requests, 500 Internal Server Error

## 7. Security and Limits

- JWT verification on every request; Edge Functions must validate token and user id matches data ownership.
- RLS is the primary isolation control; never bypass with service role except within strictly validated, minimal operations.
- Rate limits (recommended starting values):
  - PostgREST: 120 requests/user/minute
  - Edge Functions: 60 requests/user/minute; AI generation: 10 requests/user/day
- Secrets: Store OpenRouter API key as environment variable; do not expose to client.
- CORS: Restrict origins to production and preview domains.
- Content Security Policy: Disallow inline scripts; restrict `connect-src` to Supabase and OpenRouter endpoints used by server-side functions only.

## Appendix: Example Requests

Create goal

```bash
curl -X POST "$SUPABASE_URL/goals" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope_type":"global","year":2025,
    "metric_type":"distance","target_value":2000000
  }'
```

Generate activities

```bash
curl -X POST "$SUPABASE_URL/functions/v1/activities-generate" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timezone":"Europe/Warsaw"}'
```

Generate AI suggestions

```bash
curl -X POST "$SUPABASE_URL/functions/v1/ai-suggestions-generate" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lookback_days":90}'
```
