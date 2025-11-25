# Testing Environment Setup - Installation Guide

## ✅ Completed Tasks

The testing environment has been successfully prepared with the following changes:

### 1. Removed Cypress

- ✅ Removed Cypress dependencies from `package.json`
- ✅ Removed `eslint-plugin-cypress` from ESLint configuration
- ✅ Deleted `cypress/` directory
- ✅ Deleted `cypress.config.ts`
- ✅ Removed Cypress scripts from `package.json`

### 2. Added Vitest & Playwright

- ✅ Added `@playwright/test` for E2E testing
- ✅ Added `@vitest/ui` for interactive test UI
- ✅ Added `@vitest/coverage-v8` for code coverage
- ✅ Added `@vitejs/plugin-vue` for Vue component testing

### 3. Configuration Files

- ✅ Created `playwright.config.ts` with Chromium browser configuration
- ✅ Updated `vitest.config.ts` with proper Vue support and coverage settings
- ✅ Updated ESLint configuration to remove Cypress plugin

### 4. Test Structure

- ✅ Created `tests/e2e/` directory for E2E tests
- ✅ Created `tests/page-objects/` for Page Object Model
- ✅ Created `tests/fixtures/` for test data
- ✅ Added example E2E tests (home, auth, example)
- ✅ Added example unit tests with mocking

### 5. Scripts

- ✅ Added comprehensive npm scripts for both test types
- ✅ Updated `.gitignore` with test-related directories

## 🚀 Next Steps - Required Actions

### Step 1: Install Dependencies

Run the following command to install all new dependencies:

```bash
npm install
```

### Step 2: Configure Environment Variables

For E2E tests, you need to set up environment variables. The configuration differs between local development and CI:

#### Local Development (using .env.test file)

1. Edit `.env.test` and fill in your values:

```bash
PUBLIC_SUPABASE_URL=your_supabase_url_here
PUBLIC_SUPABASE_KEY=your_supabase_anon_key_here
E2E_USERNAME=test@example.com
E2E_PASSWORD=your_test_password_here
E2E_USERNAME_ID=your_test_user_uuid_here
```

#### CI Environment (GitHub Actions)

In CI, the configuration uses GitHub Secrets instead of the `.env.test` file:

- `ENV=test` (set automatically)
- `PUBLIC_SUPABASE_URL` (from secrets)
- `PUBLIC_SUPABASE_KEY` (from secrets)
- `E2E_USERNAME` (from secrets)
- `E2E_PASSWORD` (from secrets)
- `E2E_USERNAME_ID` (from secrets)

The `playwright.config.ts` automatically detects the CI environment and uses the appropriate configuration source. **Important:** These environment variables are explicitly passed to the Astro dev server via the `webServer.env` configuration in `playwright.config.ts`, ensuring they are available during E2E test execution.

### Step 3: Install Playwright Browsers

Playwright requires browser binaries to be installed:

```bash
npx playwright install chromium
```

Or install all browsers (optional):

```bash
npx playwright install
```

### Step 4: Build the Application

Before running E2E tests, build the application:

```bash
npm run build
```

### Step 5: Verify Installation

#### Test Unit Tests:

```bash
npm run test:unit
```

#### Test E2E Setup:

```bash
npm run test:e2e
```

## 📋 Available Test Scripts

### Unit Tests (Vitest)

```bash
npm run test:unit              # Run all unit tests
npm run test:unit:watch        # Run in watch mode
npm run test:unit:ui           # Open Vitest UI
npm run test:unit:coverage     # Generate coverage report
```

### E2E Tests (Playwright)

```bash
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Open Playwright UI
npm run test:e2e:headed        # Run with visible browser
npm run test:e2e:debug         # Run in debug mode
npm run test:e2e:codegen       # Generate tests with codegen tool
```

## 📁 Project Structure

```
x10dev_zaliczenie/
├── tests/
│   ├── e2e/                    # E2E test files
│   │   ├── home.spec.ts
│   │   ├── auth.spec.ts
│   │   └── example.spec.ts
│   ├── page-objects/           # Page Object Model
│   │   ├── BasePage.ts
│   │   ├── HomePage.ts
│   │   └── LoginPage.ts
│   ├── fixtures/               # Test data
│   │   └── test-users.ts
│   └── README.md               # Detailed testing guide
├── src/
│   ├── components/__tests__/   # Component tests
│   └── lib/__tests__/          # Unit tests
├── playwright.config.ts        # Playwright configuration
├── vitest.config.ts           # Vitest configuration
└── package.json               # Updated dependencies
```

## 🔧 Configuration Details

### Vitest

- Environment: jsdom (for DOM testing)
- Coverage: v8 provider
- Globals: enabled
- Path alias: `@` points to `./src`

### Playwright

- Browser: Chromium (Desktop Chrome)
- Base URL: http://localhost:4321
- Trace: on-first-retry
- Screenshots: on failure
- Video: on failure
- Web Server: auto-starts with `npm run preview`

## 📚 Documentation

For detailed information about writing and running tests, see:

- `tests/README.md` - Comprehensive testing guide
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

## ⚠️ Important Notes

1. **Port Configuration**: E2E tests expect the app to run on port 4321 (Astro default for preview). If you use a different port, update `playwright.config.ts`.

2. **Database Setup**: Some E2E tests (marked as `test.skip`) require a test database with user accounts. You'll need to:
   - Set up a test Supabase instance or use test data
   - Create test users in the database
   - Update `tests/fixtures/test-users.ts` with valid credentials

3. **CI/CD**: The configuration is CI-ready:
   - E2E tests retry 2 times in CI
   - Sequential execution in CI
   - HTML reports generated automatically

4. **Coverage**: Unit test coverage reports are saved to `coverage/` directory (ignored by git).

## 🔧 Environment Variables in CI/CD

### How Environment Variables Work

The application requires certain environment variables (like `PUBLIC_SUPABASE_URL`) to function properly. Here's how they are handled in different environments:

#### Local Development

- Variables are loaded from `.env.test` file
- Playwright's `dotenv` configuration loads these before tests run
- The dev server automatically picks them up

#### GitHub Actions (CI)

- Variables are stored as GitHub Secrets and set as environment variables in the workflow
- Playwright config reads them from `process.env`
- **Critical:** These variables must be explicitly passed to the webServer via `webServer.env` in `playwright.config.ts`
- Without this configuration, the Astro dev server won't have access to them, resulting in "Missing env" errors

The `playwright.config.ts` file includes a `webServer.env` configuration that passes all required environment variables to the Astro dev server process. This ensures consistency between local and CI environments.

## 🐛 Troubleshooting

### If you see "Missing env: PUBLIC_SUPABASE_URL" in CI:

This means the environment variables are not being passed to the Astro dev server. Verify:

1. GitHub Secrets are set correctly in your repository settings
2. The workflow file (`.github/workflows/test.yml`) includes all required env variables
3. The `playwright.config.ts` webServer configuration includes the `env` property with all variables

### If `npm install` fails:

Try clearing npm cache:

```bash
npm cache clean --force
npm install
```

### If Playwright installation fails:

Try installing with sudo (macOS/Linux):

```bash
sudo npx playwright install chromium
```

### If tests can't find the application:

Make sure to build first:

```bash
npm run build
npm run preview
```

## ✨ Example Test Execution

Once everything is installed:

```bash
# Terminal 1: Start the application
npm run preview

# Terminal 2: Run tests
npm run test:e2e:headed
```

Or let Playwright handle the server automatically:

```bash
npm run test:e2e
```

---

**Status**: Environment prepared ✅  
**Next Action**: Run `npm install` to complete setup
