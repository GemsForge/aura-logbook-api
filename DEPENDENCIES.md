# External Dependencies

This document lists external services the application calls at runtime. Package dependencies remain declared in the project files (`*.csproj` and `package.json`).

## Open-Meteo weather API

- **Purpose:** Retrieve current weather conditions for the dashboard.
- **Provider:** [Open-Meteo](https://open-meteo.com/)
- **Forecast endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Geocoding endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
- **Credentials:** No API key is required for the free/open-access endpoint.
- **Use in this app:** The backend resolves a supplied city when needed, then requests current temperature, WMO weather code, and day/night status. Temperatures are requested in Fahrenheit and converted to the existing API response shape and icon codes.
- **Attribution:** Weather data is provided under CC BY 4.0. Give appropriate credit to Open-Meteo and indicate modifications when redistributing the data. See [Open-Meteo's terms](https://open-meteo.com/en/terms).
- **Free-use limits:** Non-commercial use only; fewer than 10,000 requests per day, 5,000 per hour, and 600 per minute. The free service has no uptime guarantee. See [terms](https://open-meteo.com/en/terms) and [pricing](https://open-meteo.com/en/pricing) for current conditions.
- **Commercial use:** Apps with advertisements, subscriptions, or other commercial use need an appropriate paid Open-Meteo plan or another provider whose licence permits that use.

The application currently uses this service for personal project development. Recheck provider terms and display attribution in the user-facing dashboard before public deployment or any change in use.
