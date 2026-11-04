# Aura Logbook mobile shell

Aura Logbook's native mobile client uses React Native with Expo and Expo Router. The app lives in `aura-mobile/` alongside the React web client in `aura-ui/`; both use the shared ASP.NET API. Native screens use platform components and the same product language, while adapting layouts to mobile conventions.

## Current shell

The Expo Router tabs are **Today**, **Log**, **Journal**, and **Profile**. Today introduces the app's reflective tone; the other tabs reserve clear native destinations for journaling, history, and profile preferences. Shared semantic neutral colors and the aura accent live in `aura-mobile/constants/Colors.ts`.

The shell is a visual and navigation foundation. Sign-in, session persistence, API-backed Today data, mood submission, journal history, and saved profile preferences are not connected yet. Placeholder copy says so directly. Keep API secrets out of the app bundle.

## Run locally

```bash
cd aura-mobile
npm install
npm run start
```

Use Expo Go or a local simulator. The root `npm run dev` still starts the web UI and API; Expo runs separately.

## Connection readiness before feature work

Before wiring account or journal features, make a reachable HTTPS API available to physical devices and agree on the mobile auth lifecycle, token refresh/re-authentication, logout, password recovery, canonical dates/enums, and stable response/error contracts. The local API address `127.0.0.1` on the development Mac is not reachable from a phone. Store mobile session credentials using platform-secure storage and send only user-scoped requests to the API.

## Implementation direction

- Use Expo Router native tabs and stacks, native controls, and safe-area-aware screen layouts.
- Preserve the shared product journeys and optional, user-led pathway language documented in [experience principles](experience-principles.md).
- Support system appearance, accessible labels, readable contrast, and text scaling as screen flows are implemented.
- Keep dashboard summaries grounded in recorded data; make optional weather or interpretation content independently recoverable.
- Build sign-in and secure session handling, API client/contracts, Today, mood entry, Journal, and editable Profile as bounded slices.

This shell is not yet an end-to-end mobile app. There is no deployed API endpoint configured, auth or secure token storage, or device QA recorded yet.
