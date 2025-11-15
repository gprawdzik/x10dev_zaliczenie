# StravaGoals

## Description

StravaGoals is a web application that enables users to define, track, and visualize annual training goals based on simulated Strava activity data. Users can create, edit, and delete goals, review their versioned history, and generate AI-driven suggestions for new or adjusted goals.

## Tech Stack

- **Frontend:** Astro 5.15 with Vue 3.5, TypeScript 5, Tailwind CSS 4.1
- **Backend:** Supabase
- **AI Module:** Openrouter.ai
- **CI/CD & Hosting:** GitHub Actions (CI pipelines), mikr.us (Docker hosting)

## Getting Started Locally

### Prerequisites

- Node.js (v20.19.0 or >=22.12.0)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/gprawdzik/x10dev_zaliczenie.git
cd x10dev_zaliczenie

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following placeholders:

```env
PUBLIC_SUPABASE_URL=<your-supabase-url>
PUBLIC_SUPABASE_KEY=<your-supabase-anon-key>
PUBLIC_SUPABASE_GENERATOR_USER_ID=<uuid-of-demo-user-for-activity-generator>
```

> **Note:** In Astro, environment variables prefixed with `PUBLIC_` are accessible on the client-side. Variables without this prefix are only available on the server-side.

### Running the App

```bash
npm run dev
```

The app will be available at `http://localhost:4321` by default (Astro development server).

## Available Scripts

- `npm run dev` : Start development server
- `npm run build` : Build for production
- `npm run preview` : Preview production build locally
- `npm run test:unit` : Run unit tests (Vitest)
- `npm run test:e2e` : Run end-to-end tests (Cypress)
- `npm run lint` : Run ESLint and auto-fix issues
- `npm run format` : Run Prettier formatter on source files

## Project Scope

- **Authentication:** Email/password registration, login, logout, password change, account deletion
- **Annual Goals Management:** Create, read, update, delete goals with metrics (distance, time, elevation; time-only for Pilates/strength) and scopes (global, consolidation, per-sport)
- **Goal History:** Append-only versioning of edits without rollback
- **Activity Generator:** Simulate 100 activities over the last 12 months with realistic time-of-day and sport distributions; include minimal Strava fields (e.g., id, athlete.id, type, distance, moving_time, etc.)
- **Visualizations:** “My Goals” cumulative progress chart and goal cards; “History” comparative charts of goal vs. actual performance
- **UI Preferences:** Manual light/dark mode toggle persisted in the browser
- **AI Suggestions:** On-demand analysis of the last 3 months (5% sport threshold), with accept/reject controls to create or update goals

_Boundaries & Exclusions:_

- No real Strava API integration (activities are simulated)
- Only annual goals supported
- No advanced activity analysis or logistical planning
- Minimal security beyond basic password hashing

## REST API

All API routes live under `src/pages/api`. Each endpoint expects a valid Supabase JWT (send `Authorization: Bearer <access_token>` or the standard `sb-access-token` cookie), **except** `POST /api/activities-generate`, which uses the configured generator user and does not require authentication. Responses follow the shared `ErrorDto` shape on failure.

### `GET /api/activities`

- **Auth:** Required (user tied to Supabase session)
- **Description:** Lists the authenticated user’s activities with filtering, sorting, and pagination.
- **Query params:**
  - `from`, `to`: ISO 8601 timestamps (`from ≤ to`)
  - `sport_type`, `type`: exact matches on corresponding columns
  - `page` (default 1, ≥1), `limit` (default 20, max 100)
  - `sort_by`: `start_date` (default), `distance`, `moving_time`
  - `sort_dir`: `asc` or `desc` (default)
- **Response:** `200 OK` with `Paginated<ActivityDto>` (data, page, limit, total)
- **Errors:** `400` (validation issues), `401` (missing/invalid token), `500` (unexpected failure)

### `POST /api/activities-generate`

- **Auth:** Not required (uses `PUBLIC_SUPABASE_GENERATOR_USER_ID` as the target user)
- **Description:** Generates and stores 100 simulated activities for the configured demo user (last 12 months). Sports are retrieved from the database via `/api/sports` endpoint.
- **Body (optional JSON overrides):**

  ```json
  {
    "primary_sports": ["running", "cycling", "swimming", "hiking"],
    "distribution": {
      "primary": 0.5,
      "secondary": 0.3,
      "tertiary": 0.15,
      "quaternary": 0.05
    },
    "timezone": "Europe/Warsaw"
  }
  ```

  - `primary_sports`: 1–25 sport codes from database; if omitted, all available sports are used
  - `distribution`: values must sum to ~1.0 (±0.01)
  - `timezone`: valid IANA identifier
  - **Note:** Sport profiles (distance/speed/elevation ranges) are read from the `consolidated` JSONB field in the sports table

- **Response:** `201 Created` with `{ "created_count": 100 }`
- **Errors:** `422` (invalid overrides or no matching sports in database), `500` (configuration/database/unknown)

### `GET /api/goals`

- **Auth:** Required
- **Description:** Lists the authenticated user’s annual goals with filtering, sorting, and pagination. Pass `id=eq.<goal_id>` to retrieve a single goal.
- **Query params:**
  - `year`: integer (optional)
  - `sport_id`: UUID (optional)
  - `scope_type`: `global` or `per_sport`
  - `metric_type`: `distance`, `time`, or `elevation_gain`
  - `page` (default 1, ≥1), `limit` (default 20, max 100)
  - `sort_by`: `created_at` (default), `year`, `target_value`
  - `sort_dir`: `asc` or `desc` (default)
- **Response:** `200 OK` with `Paginated<GoalDto>` for list requests or `GoalDto` for single-goal lookups.
- **Errors:** `400` (invalid filters), `401` (auth), `404` (goal not found), `500` (unexpected failure)

### `POST /api/goals`

- **Auth:** Required
- **Description:** Creates a new annual goal for the authenticated user. Body must be JSON (`Content-Type: application/json`).
- **Body:**

  ```json
  {
    "scope_type": "global",
    "year": 2025,
    "metric_type": "distance",
    "target_value": 2000000,
    "sport_id": null
  }
  ```

  - `scope_type`: `global` (requires `sport_id: null`) or `per_sport` (requires valid `sport_id`)
  - `year`: 2000–2100
  - `metric_type`: `distance`, `time`, `elevation_gain`
  - `target_value`: positive number (stored in the minimal unit for the metric)

- **Response:** `201 Created` with the persisted `GoalDto`.
- **Errors:** `400` (validation), `401` (auth), `403` (RLS violation), `409` (duplicate combination), `500`

### `PATCH /api/goals?id=eq.<goal_id>`

- **Auth:** Required
- **Description:** Updates metric metadata for an existing goal; at least one field is required.
- **Body:**

  ```json
  {
    "metric_type": "distance",
    "target_value": 2200000
  }
  ```

- **Response:** `200 OK` with the updated `GoalDto`.
- **Errors:** `400` (missing id/body), `401`, `403`, `404`, `500`

### `DELETE /api/goals?id=eq.<goal_id>`

- **Auth:** Required
- **Description:** Deletes a goal owned by the current user.
- **Response:** `204 No Content`
- **Errors:** `400` (missing id), `401`, `403`, `404`, `500`

### `GET /api/goal_history?goal_id=eq.<goal_id>`

- **Auth:** Required
- **Description:** Returns an append-only audit trail of changes for a goal, ordered by `changed_at`.
- **Query params:** `page`, `limit`, `sort_by` (`changed_at`), `sort_dir`
- **Response:** `200 OK` with `Paginated<GoalHistoryDto>`
- **Errors:** `400`, `401`, `403`, `404`, `500`

## Project Status

- MVP features fully implemented and available for local testing.
- Environment variable configuration pending (placeholders provided above).
- CI/CD pipelines (GitHub Actions) and hosting configuration are planned but not yet set up.

For detailed product requirements, see the [PRD document](.ai/prd.md).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
