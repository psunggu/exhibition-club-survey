# Supabase events backup

The Supabase Free plan does not provide a project-restorable backup for this
application. The current production data surface is limited to 13 public rows
in `public.events`; Auth has no users and Storage has no buckets. The repository
contains the schema and migrations, while this procedure stores the event rows
outside Git.

## Backup contract

- The backup job downloads `public.events` through the same anonymous,
  read-only API used by the live site.
- An empty response, invalid row, or duplicate event ID fails the job.
- Each timestamped JSON file has an adjacent SHA-256 checksum file.
- The output directory must be outside the Git repository.
- The anonymous key is read from the public site configuration and is never
  printed by the script.

Manual backup:

```powershell
node scripts/backup-supabase-events.mjs
```

Verify a backup:

```powershell
node scripts/verify-supabase-backup.mjs --file "C:\path\events-YYYYMMDDTHHMMSSZ.json"
```

## Windows scheduled task

The installer creates the user-level task `ExhibitionClub-Supabase-Backup` at
02:30 each day. `StartWhenAvailable` runs a missed backup after the PC wakes.
It uses the public GitHub Pages `config.js` URL, so the task does not depend on
a Git checkout or a stored database password.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-supabase-backup-task.ps1
```

The recommended local output is:

```text
%LOCALAPPDATA%\ExhibitionClub\backups
```

## Restore test

Before relying on a new backup format, verify its checksum locally and load its
`events` array into a temporary PostgreSQL table with
`jsonb_populate_recordset`. Compare row count and unique IDs, then roll the
transaction back. Never test a restore by deleting or replacing
`public.events`.

This backup is deliberately scoped to the application's current public data.
If Auth users, Storage objects, private tables, or additional schemas are added,
replace this job with an encrypted `pg_dump`/managed backup process and test a
full restore in a separate project.
