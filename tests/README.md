# Testing Guide

This project uses **Vitest** for unit testing and **Playwright** for E2E testing.

## Directory Structure

```
tests/
├── e2e/                 # E2E tests using Playwright
│   ├── home.spec.ts     # Home page tests
│   ├── auth.spec.ts     # Authentication flow tests
│   └── example.spec.ts  # Example test demonstrating Playwright features
├── fixtures/            # Test data and fixtures
│   └── test-users.ts    # Test user credentials
└── page-objects/        # Page Object Model for E2E tests
    ├── BasePage.ts      # Base page with common methods
    ├── HomePage.ts      # Home page object
    └── LoginPage.ts     # Login page object

src/
├── components/__tests__/  # Vue component tests
└── lib/__tests__/         # Utility function tests
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with UI
npm run test:unit:ui

# Run tests with coverage
npm run test:unit:coverage
```

### E2E Tests (Playwright)

**Important:** Before running E2E tests, you need to install Playwright browsers:

```bash
npx playwright install
```

Then run the tests:

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Generate tests with codegen
npm run test:e2e:codegen
```

## Writing Tests

### Unit Tests with Vitest

Unit tests are located in `__tests__` directories next to the code they test.

Example:
```typescript
import { describe, it, expect } from 'vitest';

describe('My Function', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

#### Mocking with Vitest

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();

// Spy on a method
const spy = vi.spyOn(object, 'method');

// Mock a module
vi.mock('./module', () => ({
  default: vi.fn(),
}));
```

### E2E Tests with Playwright

E2E tests use the Page Object Model pattern for maintainability.

#### Creating a Page Object

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: 'Click me' });
  }

  async clickButton() {
    await this.myButton.click();
  }
}
```

#### Writing a Test

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from '../page-objects/MyPage';

test('should click button', async ({ page }) => {
  const myPage = new MyPage(page);
  await myPage.navigate();
  await myPage.clickButton();
  
  await expect(page).toHaveURL(/success/);
});
```

## Best Practices

### Unit Testing

1. **Use descriptive test names** - Make it clear what is being tested
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Mock external dependencies** - Keep tests isolated
4. **Test edge cases** - Don't just test the happy path
5. **Keep tests simple** - One assertion per test when possible

### E2E Testing

1. **Use Page Objects** - Encapsulate page interactions
2. **Use semantic locators** - Prefer `getByRole`, `getByLabel`, `getByText`
3. **Wait for elements** - Use Playwright's auto-waiting features
4. **Isolate tests** - Each test should be independent
5. **Use browser contexts** - Isolate test environments
6. **Take screenshots on failure** - Already configured in playwright.config.ts
7. **Use trace viewer** - Debug failing tests with `npx playwright show-trace`

## Configuration

### Vitest Configuration

See `vitest.config.ts` for configuration options including:
- Test environment (jsdom)
- Coverage settings
- Path aliases

### Playwright Configuration

See `playwright.config.ts` for configuration options including:
- Browser settings (Chromium only as per guidelines)
- Base URL
- Retry settings
- Reporter options
- Web server settings

## Continuous Integration

Tests are designed to run in CI environments:
- E2E tests will automatically retry failed tests in CI
- Coverage reports are generated for unit tests
- HTML reports are generated for E2E tests

## Troubleshooting

### Unit Tests

**Problem:** Tests fail with import errors
- **Solution:** Check that path aliases are correctly configured in `vitest.config.ts`

**Problem:** Coverage not working
- **Solution:** Make sure `@vitest/coverage-v8` is installed

### E2E Tests

**Problem:** Tests fail to connect to server
- **Solution:** Make sure the application builds successfully with `npm run build`

**Problem:** Timeout errors
- **Solution:** Increase timeout in `playwright.config.ts` or use `test.setTimeout()`

**Problem:** Screenshot/visual comparison failures
- **Solution:** Update screenshots with `npm run test:e2e -- --update-snapshots`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

