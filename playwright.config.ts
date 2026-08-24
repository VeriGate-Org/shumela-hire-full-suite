import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /*
   * Stop the CI run once it is unambiguously broken.
   *
   * A failing test on CI costs `retries + 1` attempts, and the slowest suites run under
   * `test.slow()` — a tripled 30s budget, so 90s per attempt. With one worker those add up end to
   * end rather than overlapping. Six broken tests in `offer-esignature.spec.ts` on 24 Aug turned a
   * three-minute suite into **30.6 minutes**: 103 passed, 6 failed, and roughly 27 of those minutes
   * were nothing but timeouts being re-run.
   *
   * That pattern repeated four times in one evening, every time on a branch whose redesign had
   * moved a selector its spec still asserted on. Waiting half an hour to be told what the first
   * ninety seconds already knew is not information, it is delay.
   *
   * Five is deliberately not one. Stopping at the first failure hides whether a change broke one
   * thing or a whole surface, which is the difference between a typo and a bad assumption. Five is
   * enough to see the shape and still caps the worst case at roughly a quarter of an hour.
   *
   * Local runs are unaffected: `retries` is 0 there and a developer can watch the whole suite.
   */
  maxFailures: process.env.CI ? 5 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`.
       Deliberately not 3000. With reuseExistingServer below, any `next dev` already on the
       default port is adopted — including one from a different worktree — and the suite then
       silently tests another checkout's code while reporting on this one. */
    baseURL: 'http://localhost:3210',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failures */
    screenshot: 'only-on-failure',
    
    /* Record video on failures */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  /* Port 3210 deliberately: 3000/3100 are commonly occupied by other checkouts, and
     `reuseExistingServer` would otherwise happily test somebody else's application. */
  webServer: {
    command: 'npm run dev -- --port 3210',
    url: 'http://localhost:3210',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes — a cold Turbopack build of this app exceeds two
  },
});
