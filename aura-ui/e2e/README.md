# Today dashboard browser checks

These Playwright checks exercise the real signed-in `/dashboard` route while stubbing only API responses. They verify the 1280×720 primary-content viewport, the 375px mobile width, sparse and populated entry states, nested scrolling, and that each of the seven interface themes applies to the shell at both widths. Each test writes a screenshot to `artifacts/dashboard-layout/`.

Install the browser once with `npx playwright install chromium`, then run `npm run test:e2e:dashboard` from `aura-ui/`.

`theme-screens.spec.ts` visits every routed screen in all seven themes at 1280px and 375px. It fails on page errors, horizontal overflow, and any visible text below WCAG contrast against its solid background, and writes screenshots plus a JSON report to `artifacts/theme-screens/`. Text over artwork or gradients is skipped by the scan and still needs a visual check. Run everything with `npx playwright test`.
