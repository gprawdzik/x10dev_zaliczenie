# StravaGoals

## Description

StravaGoals is a web application that enables users to define, track, and visualize annual training goals based on simulated Strava activity data. Users can create, edit, and delete goals, review their versioned history, and generate AI-driven suggestions for new or adjusted goals.

## Tech Stack

- **Frontend:** Vue 3, TypeScript 5, Tailwind CSS 4
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
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Running the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

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
- **AI Suggestions:** On-demand analysis of the last 3 months (5% sport threshold), with accept/reject controls to create or update goals

_Boundaries & Exclusions:_

- No real Strava API integration (activities are simulated)
- Only annual goals supported
- No advanced activity analysis or logistical planning
- Minimal security beyond basic password hashing

## Project Status

- MVP features fully implemented and available for local testing.
- Environment variable configuration pending (placeholders provided above).
- CI/CD pipelines (GitHub Actions) and hosting configuration are planned but not yet set up.

For detailed product requirements, see the [PRD document](.ai/prd.md).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
