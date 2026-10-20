# Database migration recovery

Aura Logbook applies SQLite migrations forward at API startup. Each migration
runs in its own transaction, and its filename is recorded in
`__SchemaMigrations` in that same transaction. The migrator does not implement
automatic `Down` scripts or rollback of already-applied migrations.

## Before applying migrations to important data

1. Confirm the active environment and `Database:ConnectionString`; do not assume
   the development database is the one in use.
2. Take a consistent SQLite backup and verify that it can be opened. If using
   the `sqlite3` command-line tool, the backup command is:

   ```sh
   sqlite3 "$DB_PATH" ".backup '$BACKUP_PATH'"
   ```

   Replace both variables with the configured database and a separate backup
   path. Do not copy only the database file while the API is writing to it;
   SQLite may also have active WAL state. Use SQLite's backup facility or an
   equivalent deployment-managed backup procedure.
3. Apply changes to a disposable copy first when the database contains data
   that must be preserved. Review the API startup logs for the migration names
   applied and confirm the database health endpoint reports healthy.

## If a migration fails during startup

1. Stop repeated restart attempts and read the API log to identify the failed
   migration and underlying SQLite error.
2. The failed migration and its history-row insert are in one transaction. If
   execution fails, that transaction is rolled back; previously successful
   migrations remain applied and recorded.
3. Correct the cause before restarting. If the failed migration was never
   recorded as applied to that database, it can be corrected and retried. If a
   migration was successfully applied anywhere, do not edit it; add a new
   forward migration that repairs the schema or data.
4. Start the API again and verify the startup log, migration history, and
   application behavior before directing users back to it.

Inspect applied migration filenames and timestamps with:

```sql
SELECT MigrationName, AppliedAt
FROM __SchemaMigrations
ORDER BY MigrationName;
```

The diagnostic `GET /health/database` reports whether migration status is
available, the resolved environment, and the applied migration count. It does
not replace checking which migration failed in the logs.

## If an applied migration needs to be undone

There is no automatic rollback command. Prefer a reviewed, forward-only
corrective migration when the data can be repaired safely. If the change cannot
be safely corrected forward, use the verified pre-migration backup and the
environment's approved restore procedure:

1. Stop the API and any other process writing to the database.
2. Preserve a separate copy of the current database for diagnosis.
3. Restore the verified backup to the configured database location without
   overwriting the only copy of either file.
4. Start the API, verify the expected migration history and application data,
   and confirm the health endpoint before reopening access.

Do not delete migration-history rows or remove an already-applied migration
file to simulate rollback. Coordinate production restores with the database
owner and retain the failed database and logs until recovery is confirmed.
