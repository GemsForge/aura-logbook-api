# Today dashboard browser checks

These Playwright checks exercise the real signed-in `/dashboard` route while stubbing only API responses. They verify the 1280×720 primary-content viewport, the 375px mobile width, sparse and populated entry states, nested scrolling, and that each of the seven interface themes applies to the shell at both widths. Each test writes a screenshot to `artifacts/dashboard-layout/`.

Install the browser once with `npx playwright install chromium`, then run `npm run test:e2e:dashboard` from `aura-ui/`.

`theme-screens.spec.ts` visits every routed screen in all seven themes at 1280px and 375px. It fails on page errors, horizontal overflow, and any visible text below WCAG contrast against its solid background, and writes screenshots plus a JSON report to `artifacts/theme-screens/`. Text over artwork or gradients is skipped by the scan and still needs a visual check. Run everything with `npx playwright test`.

`quick-check-in.spec.ts` saves a quick check-in on every pathway and fails if the content below moves, if focus does not land on the confirmation and return to the chips on "Done", or if "Add a note or photo" issues anything other than an update to the entry just created.

`profile-and-public.spec.ts` opens the profile editor in all seven themes at both widths (after its fade-in finishes) and scans it for contrast, checks that every theme can be chosen with arrow keys, previews immediately, and shows a visible focus ring, and checks Home, Login, Register, and Not found for a signed-out visitor. `contrast.ts` holds the shared contrast scan.
