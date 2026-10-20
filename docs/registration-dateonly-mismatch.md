# Registration birthday persistence mismatch

Recorded: 2026-10-19. Related work: story #252 / PR #253.

Status: fixed locally in the repository write mapping. Insert and update now bind birthdays as invariant `yyyy-MM-dd` strings; a default domain date is stored as SQL NULL and reads back as the default date. Zodiac parameters are also normalized to canonical lowercase keys. Regression coverage exercises SQLite insert, update, leap-day dates, missing dates, and a non-English culture.

## Observed failure

Registration reaches the API but fails with an unhandled exception when the SQLite user repository prepares its insert:

```text
System.NotSupportedException: The member Birthday of type System.DateOnly cannot be used as a parameter value
Dapper.SqlMapper.LookupDbType(...)
AuraLogbook.Api.Repositories.SqliteUserRepository.CreateAsync(User user)
AuraLogbook.Api.Services.UserService.RegisterAsync(RegisterUserRequest requestuser)
AuraLogbook.Api.Controllers.AuthController.RegisterUser(RegisterUserRequest newUser)
```

This produces a server error and prevents account creation. It occurs during parameter binding, before the INSERT executes; it is separate from the earlier SQLite foreign-key failures.

## Type boundary

| Layer | Birthday representation |
| --- | --- |
| Registration JSON | Date string, `YYYY-MM-DD` |
| C# User model | `System.DateOnly` |
| Current Dapper insert/update parameters | Entire `User` object, including raw `DateOnly` |
| SQLite Users.Birthday | Nullable `TEXT` |
| Repository read model | Nullable string parsed into `DateOnly` |

`SqliteUserRepository.CreateAsync` passes the domain object directly to Dapper. The configured Dapper path cannot bind its `DateOnly` property. `UpdateAsync` passes the same object and is exposed to the same failure. The existing string-to-date read mapping does not provide the reverse conversion for writes.

The JSON seeder explicitly converts birthdays to date strings, which explains why successful startup seeding does not demonstrate that registration works.

## Required correction

Convert birthdays at the repository boundary for both insert and update using `yyyy-MM-dd` with invariant culture, or register and test an equivalent Dapper type handler before any queries run. Preserve the date-only API contract and SQLite TEXT column; no timezone conversion is appropriate for a birthday.

Define how an absent birthday is handled consistently with the nullable database column and the non-nullable domain property. Do not silently convert a missing value into today's date.

## Verification criteria

- Register a user against SQLite and read back the exact birthday.
- Update the birthday and verify the round trip.
- Include a leap-day birthday and verify culture-independent storage.
- Exercise the HTTP registration endpoint, not only a mocked repository.
- Verify the documented missing-birthday behavior.

Existing build and test passes did not cover this binding failure; they are insufficient evidence that registration succeeds.
