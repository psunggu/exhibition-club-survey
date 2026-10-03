# Supabase events backup

The Supabase Free plan does not provide a project-restorable backup for this
application (daily backups start at the Pro plan). The repository contains the
schema and migrations, while this procedure stores the public rows outside Git.

## Backup contract

- The backup job downloads `public.events`, `public.surveys` and
  `public.survey_options` through the same anonymous, read-only API used by the
  live site (format `v2` since 2026-10-04; older files are `v1`, events only).
- Row-level security limits the survey tables to what members see: surveys
  with no `deleted_at` and `audience = 'members'`, and their options.
  Admin-only or deleted surveys are not in the backup.
- `survey_options.imported_voters` (voter names) is dropped before writing —
  member lists and responses are never copied to this computer.
- Locked tables (`admin_guides`, `survey_notes`, members, responses) and Auth
  are not covered. The anonymous key cannot read them, and the job does not
  store the operator password.
- An empty events response, an invalid row, a duplicate ID, or a survey option
  whose survey is missing fails the job.
- Each timestamped JSON file has an adjacent SHA-256 checksum file.
- The output directory must be outside the Git repository.
- The anonymous key is read from the public site configuration and is never
  printed by the script.

Manual backup:

```bash
node scripts/backup-supabase-events.mjs --output-dir "$HOME/Library/Application Support/ExhibitionClub/backups"
```

Verify a backup:

```bash
node scripts/verify-supabase-backup.mjs --file "$HOME/Library/Application Support/ExhibitionClub/backups/events-YYYYMMDDTHHMMSSZ.json"
```

## macOS LaunchAgent (since 2026-09-24)

`scripts/install-launchd.sh supabase-backup` installs the user LaunchAgent
`com.psunggu.exhibition-supabase-backup` at 02:30 each day. launchd runs a
missed slot once after the Mac wakes. It uses the public GitHub Pages
`config.js` URL, so the job does not depend on a stored database password.
Output (also the script's default without `--output-dir`):
`~/Library/Application Support/ExhibitionClub/backups`.

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
