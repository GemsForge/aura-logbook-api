# Today dashboard browser checks

These Playwright checks exercise the real signed-in `/dashboard` route while stubbing only API responses. They verify the 1280×720 primary-content viewport, the 375px mobile width, sparse and populated entry states, and nested scrolling. Each test writes a screenshot to `artifacts/dashboard-layout/`.

Install the browser once with `npx playwright install chromium`, then run `npm run test:e2e:dashboard` from `aura-ui/`.
