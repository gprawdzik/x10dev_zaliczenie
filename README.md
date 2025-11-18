# StravaGoals

## Description

StravaGoals is a web application that enables users to define, track, and visualize annual training goals based on simulated Strava activity data. Users can create, edit, and delete goals, review their versioned history, and generate AI-driven suggestions for new or adjusted goals.

## Tech Stack

- **Frontend:** Astro 5.15 with Vue 3.5, TypeScript 5, Tailwind CSS 4.1
- **Backend:** Supabase
- **AI Module:** Openrouter.ai
- **Testing:** Vitest (unit & component tests), Vue Test Utils, Playwright (E2E tests)
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
```

> **Note:** In Astro, environment variables prefixed with `PUBLIC_` are accessible on the client-side. Variables without this prefix are only available on the server-side.

### Running the App

```bash
npm run dev
```

The app will be available at `http://localhost:4321` by default (Astro development server).

## Available Scripts

### Development

- `npm run dev` : Start development server
- `npm run build` : Build for production
- `npm run preview` : Preview production build locally

### Testing

- `npm run test:unit` : Run unit tests (Vitest)
- `npm run test:unit:watch` : Run unit tests in watch mode
- `npm run test:unit:ui` : Open Vitest UI
- `npm run test:unit:coverage` : Generate test coverage report
- `npm run test:e2e` : Run end-to-end tests (Playwright)
- `npm run test:e2e:ui` : Open Playwright UI
- `npm run test:e2e:headed` : Run E2E tests with visible browser
- `npm run test:e2e:debug` : Debug E2E tests
- `npm run test:e2e:codegen` : Generate E2E tests with Playwright codegen

### Code Quality

- `npm run lint` : Run ESLint and auto-fix issues
- `npm run format` : Run Prettier formatter on source files

> **Note:** Before running E2E tests for the first time, install Playwright browsers with `npx playwright install chromium`. See [TESTING_SETUP.md](TESTING_SETUP.md) for complete setup instructions.

## Testing

This project uses a comprehensive testing strategy:

- **Unit Tests (Vitest)**: Test individual functions, utilities, and Vue components in isolation
- **E2E Tests (Playwright)**: Test complete user flows and interactions in a real browser environment

### Running Tests

```bash
# Unit tests
npm run test:unit              # Run once
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage report

# E2E tests (requires browsers installed: npx playwright install chromium)
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Interactive UI mode
```

For detailed testing documentation, see:

- [TESTING_SETUP.md](TESTING_SETUP.md) - Complete setup and installation guide
- [tests/README.md](tests/README.md) - Comprehensive testing guide with examples

### Test Teardown

End-to-end runs automatically trigger `tests/global.teardown.ts`, which wipes every activity, AI suggestion, and goal created by the dedicated E2E user. Configure the following variables (see `.env.dist` as a template):

- `PUBLIC_SUPABASE_URL` – Supabase project used by tests
- `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `PUBLIC_SUPABASE_KEY` – credentials for cleanup
- `E2E_USERNAME_ID` – Supabase UUID of the E2E account

Optional flags:

- Set `SKIP_TEARDOWN=true` to keep test data during local debugging
- Set `DEBUG=true` to log detailed teardown context

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

All API routes live under `src/pages/api`. Each endpoint expects a valid Supabase JWT (send `Authorization: Bearer <access_token>` or the standard `sb-access-token` cookie). Responses follow the shared `ErrorDto` shape on failure.

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

- **Auth:** Required (uses the authenticated Supabase user as the target)
- **Description:** Generates and stores 100 simulated activities for the authenticated user (last 12 months). Sports are retrieved from the database via `/api/sports` endpoint.
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
