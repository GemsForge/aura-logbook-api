# Configuration and Secrets

Aura Logbook uses configuration values and secrets differently. Keeping that distinction clear prevents credentials from being committed or exposed to the frontend.

## The difference

### Configuration values

Configuration values control how the application runs but are not inherently sensitive. They may be stored in `appsettings.json`, environment-specific settings, or environment variables.

Examples:

- API base URLs
- Local ports
- OAuth redirect URIs
- Feature flags

### Secrets

Secrets authenticate the application or grant access to protected services. They must not be committed to Git, placed in frontend code, or included in public configuration files.

Examples:

- Spotify Client Secret
- JWT signing key
- Third-party API keys
- Database passwords

## Spotify configuration

The Spotify Client ID and redirect URI are configuration values. The Spotify Client Secret is a secret and must remain server-side.

For local development, configure the API with ASP.NET user secrets from the `AuraLogbook.Api` directory:

```bash
dotnet user-secrets set "Spotify:ClientId" "your-client-id"
dotnet user-secrets set "Spotify:ClientSecret" "your-client-secret"
dotnet user-secrets set "Spotify:RedirectUri" "http://127.0.0.1:5082/api/spotify/callback"
```

User secrets are stored outside the repository and are not included in commits.

For deployment, use the hosting platform's secret and environment configuration:

```text
Spotify__ClientId=your-client-id
Spotify__ClientSecret=your-client-secret
Spotify__RedirectUri=https://your-domain.example/api/spotify/callback
```

The redirect URI configured in Spotify's Developer Dashboard must exactly match the URI used by the running API.

## Astrology providers

FreeAstroAPI keys are used only by the API for the daily sign reading and
date-specific moon phase lookups. For the combined local `npm run dev` launcher,
store `FREE_ASTRO_API_KEY=your-api-key` in the Git-ignored
`AuraLogbook.Api/.env.local`. The launcher reads only that credential from the
backend file and passes it only to the API child, excluding it from Vite's
environment. A nonempty exported `FREE_ASTRO_API_KEY` takes precedence over the
local file. Restart the local stack after changing it.

When starting the API directly, export `FREE_ASTRO_API_KEY` in its environment
or use an ASP.NET user secret. Never put the key in `aura-ui`, `VITE_` variables,
or committed configuration:

```bash
dotnet user-secrets --project AuraLogbook.Api set "FreeAstroApi:ApiKey" "your-api-key"
```

Set the backend environment variable `FREE_ASTRO_API_KEY` for deployment. The
ASP.NET configuration alias `FreeAstroApi__ApiKey` is also accepted, equivalent
to `FreeAstroApi:ApiKey`; `FREE_ASTRO_API_KEY` takes precedence if both are set.
The API caches daily
readings and date-level phase results and paces provider requests to fit the
documented free-tier request limit. Without a key, the astrology endpoints
return `503 Service Unavailable` and the UI can explain that the insight cannot
be loaded.

Integration references are the provider's current
[endpoint map](https://www.freeastroapi.com/llms.txt),
[daily-sign documentation](https://www.freeastroapi.com/docs/western/daily-sign),
and [moon-phase documentation](https://www.freeastroapi.com/docs/utilities/moon-phase).
The server uses `GET /api/v2/horoscope/daily/sign` and
`GET /api/v1/moon/phase` with the `x-api-key` header. Live requests for a sample
sign and date were verified on November 13, 2026; browser acceptance for the
signed-in profile is a separate check.

## Optional natal chart provider

FreeAstrologyAPI (`freeastrologyapi.com`) is the selected birth-chart provider,
replacing Astrology-API.io. This is a separate provider and account from
FreeAstroAPI (`freeastroapi.com`), which supplies the daily horoscope and moon data.
Set the birth-chart key locally:

```bash
dotnet user-secrets --project AuraLogbook.Api set "FreeAstrologyApi:ApiKey" "your-api-key"
```

Use `FreeAstrologyApi__ApiKey` in deployment secrets. Restart the API after changing
configuration. The previous `AstrologyApi:ApiKey` setting is no longer used; keys
from the old provider cannot authenticate to the selected provider.

The authenticated `GET /api/astrology/birth-chart` route requires Astrology & Energy,
the Daily Astrology module, a birthday, and birth time and birthplace retained only
after the explicit “Save birth details” choice. Switching pathways preserves those
consented details in the user profile, including when the profile update resubmits
them. Retention does not enable charts or provider calls outside Astrology & Energy.
Unchecking the save choice and saving the profile clears the details. No profile
migration is required.
The server searches the saved city name with `POST /geo-details`, filters the
results against the saved region/country, and requires an unambiguous
city/region/country match, and resolves the returned IANA time zone against the
birth date using the host's time-zone rules. Missing or ambiguous locations and
invalid or repeated local times at DST transitions return unavailable rather than
guessing a location or UTC offset. Use a city and country (for example,
`New York, US`), or include a state/region to narrow the result (`New York, NY, US`).
US state abbreviations are matched only to US regions using the
[USPS state abbreviation list](https://pe.usps.com/text/pub28/28apb.htm).
A code such as `CA` can mean California or Canada: when both match the city,
include the country rather than relying on an assumed first result. Full state
names remain supported. Other regions should be spelled out.

The server then sends the birth date, local time, coordinates, and historical UTC
offset to `POST /western/planets`, explicitly requesting tropical, geocentric,
English placements. It normalizes planet/sign/degree fields into Aura's existing
chart response. This supplies calculations; written natal reports and house
assignments are not included. No live provider calls happen without the selected
provider's key. Provider credentials never go to the browser.

Both calls share a server-wide one-request-per-second pacer. Successful normalized
charts are cached in process memory for up to 30 days using hashed input keys;
they are not persisted to the database or disk. An uncached calculation uses two
requests, and repeating a cached chart uses none. The free plan currently lists
500 requests per day, including Western planets and geocoding, as checked on
November 13, 2026; verify current terms before production use. See the official
[pricing](https://freeastrologyapi.com/pricing),
[authentication](https://freeastrologyapi.com/api-reference),
[geocoding](https://freeastrologyapi.com/api-reference/geo-location/geo-location-api),
and [planet response](https://freeastrologyapi.com/api-reference/western-astrology/planets).
A live request with synthetic birth details was verified on November 13, 2026:
`/geo-details` and `/western/planets` both returned HTTP 200 and the adapter
normalized 22 placements. This verifies the selected provider and response mapping;
the signed-in browser flow for a particular saved profile still needs its own check.

The pathway plan and consent flow are maintained in
[Core user journeys](ux/core-user-journeys.md).

The Spotify authorization request asks for these read permissions:

- `user-read-currently-playing` for playback metadata
- `playlist-read-private` and `playlist-read-collaborative` for playlists

When requested permissions change, reconnect Spotify in Aura Logbook to review and grant the updated access. The integration uses the currently-playing endpoint matching `user-read-currently-playing`. See [Spotify integration](spotify-integration.md) for setup, storage, routes and recovery.

## JWT signing key

`Jwt:Key` signs and validates sign-in tokens. It is a secret and is not in
`appsettings.json`; the API refuses to start when it is missing or shorter than
32 bytes. Set it locally with user secrets:

```bash
dotnet user-secrets --project AuraLogbook.Api set "Jwt:Key" "$(openssl rand -base64 48)"
```

Each deployed environment needs its own random `Jwt__Key` from the hosting
platform's secret store. Changing the key signs everyone out once; they sign in
again normally. A key that was ever committed must be treated as exposed and
replaced.

## Email (SMTP) configuration

Account recovery sends mail through any SMTP relay (provider decision for #335:
standard SMTP, so the relay can be Postmark, Amazon SES, SendGrid or another
provider without code changes). `Email:Smtp:Host`, `Port`, `UseImplicitTls`,
`FromAddress` and `FromName` are configuration. `Email:Smtp:Username` and
`Email:Smtp:Password` are secrets.

```bash
dotnet user-secrets set "Email:Smtp:Username" "your-smtp-username"
dotnet user-secrets set "Email:Smtp:Password" "your-smtp-password"
```

In deployments, use `Email__Smtp__Username` and `Email__Smtp__Password` from the
hosting platform's secret store. Development ignores SMTP settings and logs
mail instead. See [Runtime environments](runtime-environments.md#password-recovery)
for how recovery is enabled per environment.

## Sacred-text providers (#392)

The Faith & Religion pathway shows a neutral Word of the Day with no provider or key. A sacred-text
passage is returned only for the one framework the client requests (`GET /api/faith/passage?framework=christian|muslim|jewish`);
any other value returns `204 No Content`.

| Framework | Default source | Translation and license | Key needed |
|---|---|---|---|
| `christian` | bible-api.com | World English Bible, public domain | No |
| `muslim` | Quran Foundation Content API, with legacy Quran.com fallback | Saheeh International | Optional |
| `jewish` | Sefaria | JPS 1917 (*The Holy Scriptures: A New Translation*), public domain | No |

Christian and Jewish passages default to public-domain translations, so no non-commercial or
display license applies. Quran Foundation credentials use the OAuth client-credentials flow
and stay on the server. Configure both values to use the authenticated content API:

```bash
SacredText__QuranClientId=your-quran-foundation-client-id
SacredText__QuranClientSecret=your-quran-foundation-client-secret
```

`SacredText__QuranScope` defaults to `content`; set it to a narrower approved scope if the
Quran Foundation client is provisioned that way. Without credentials, the adapter retains its
legacy public Quran.com endpoint fallback. Quran Foundation's current developer terms limit
regular API-response content caching to one week ([Quran Foundation terms](https://api-docs.quran.foundation/legal/developer-terms/)); API.Bible requires refresh within 30 days
and recommends 14 days or less ([API.Bible caching requirements](https://care.api.bible/article/401-caching-content)). Sefaria's [developer client documentation](https://sefaria.github.io/sefaria-frontend-toolkit/reference/client.html)
documents bounded client caching but publishes no maximum retention duration. Aura uses the existing six-hour cache duration for
successful sections and daily passages, below the stated API.Bible and Quran Foundation limits
and conservatively short for Sefaria. Section entries are isolated by framework, normalized
reference, and configured source version; provider failures are never cached. The reader
displays Quran Foundation attribution and does not export the
provider's source text. Follow the current [Quran Foundation developer terms](https://api-docs.quran.foundation/legal/developer-terms/)
and [content API authentication guidance](https://api-docs.quran.foundation/docs/quickstart/).

To use a different licensed Bible translation instead, set both:

```bash
SacredText__ApiBibleKey=your-api-bible-key
SacredText__ApiBibleBibleId=id-of-a-translation-licensed-for-display
SacredText__ApiBibleTranslationName=Human-readable licensed edition title
```

API.Bible remains disabled by default. Do not configure its key until client-side
FUMS tracking records each displayed reading, as required by the
[core user journey](ux/core-user-journeys.md). The translation name is optional
and falls back to the Bible ID when omitted.

The Sefaria version is pinned with `SacredText__SefariaVersion`. Daily references are Tanakh
verses because JPS 1917 covers the Tanakh. The in-app reader's authenticated
`GET /api/faith/section` endpoint returns one requested chapter/section from only
that framework's provider. Reusable Hebrew source text is shown only when Sefaria
returns an exact, trimmed, case-insensitive `Public Domain`, `CC0`, `CC-BY`, or
`CC-BY-SA` license. The Sefaria Genesis 1 Hebrew edition metadata reports
`CC-BY-SA`; the response attribution includes its edition title and license and
links the CC-BY-SA 4.0 deed unless Sefaria supplies a license URL. `NC`, `ND`,
unknown, and missing licenses remain excluded. This allowance was approved by the
product owner on 2026-11-14. Hebrew text is displayed after provider markup
cleaning and is not stored or exported. See [Sefaria's reuse guidance](https://help.sefaria.org/hc/en-us/articles/18490043237148-How-to-Find-and-Understand-Licensing-or-Copyright-Information).
`GET/POST/PUT/DELETE /api/faith/annotations` stores
owner-private notes, highlights, and bookmarks; anchors include the provider
version, segment-relative offsets, and an anchor digest, while quoted source text is not stored. The reader requires
Migration 035. Keys stay server-side. Each day's passage is cached
(`SacredText__CacheDuration`, default 6 hours) to respect provider rate limits. The attribution
returned by the API must be shown with the text. Review the Saheeh International translation's
terms before production use.

## What not to commit

Do not commit:

- `.env` files containing credentials
- `appsettings.*.json` files containing real secrets
- Spotify Client Secrets
- JWT signing keys
- Access or refresh tokens

If a secret is accidentally committed, revoke or rotate it immediately and remove it from the repository history through the project's approved remediation process.

### Preset birthplace selections

Profile → My Pathway → Astrology & Energy uses country, state/region, and city
choices instead of a free-text birthplace. The UI stores `City, Full state/region
name, Country code` in the existing profile field after the explicit save action.
Changing country clears the downstream region/city; changing region clears city.
Older saved birthplace strings remain supported and are preserved until the user
chooses a replacement. The preset catalog does not replace the chart provider's
unique-location validation. See [dependency provenance](../DEPENDENCIES.md#preset-birth-locations).
