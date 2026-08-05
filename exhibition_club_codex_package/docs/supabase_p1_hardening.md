# Supabase P1 hardening

## Applied boundary

- Objects created by the application owner (`postgres`) in the exposed
  `public` schema receive no automatic privileges for `PUBLIC`, `anon`,
  `authenticated`, or `service_role`.
- PostgreSQL's global implicit `PUBLIC EXECUTE` default for newly created
  functions is revoked; a schema-only revoke is not sufficient for this grant.
- Every new table, sequence, or function must receive an explicit grant in the
  same migration that creates it.
- `public.set_updated_at()` keeps its default `SECURITY INVOKER` behavior, has
  an empty `search_path`, and is not executable by browser roles.
- `public.events` remains explicitly readable by `anon` and `authenticated` and
  remains non-writable by both roles.

## Platform-managed residual

Supabase also maintains default ACL entries owned by the internal
`supabase_admin` role. The project `postgres` role cannot assume or alter that
managed role. The application therefore follows these additional rules:

1. Create application objects through reviewed migrations as `postgres`.
2. Enable and force RLS on every exposed table before granting browser access.
3. Grant only the minimum required privileges explicitly.
4. Run the repository validators and inspect Security Advisor before release.
5. Do not expose a new schema through the Data API without a separate review.

## Apply and verify

1. Capture the current row count, grants, policies, default ACLs, and function
   configuration.
2. Run `202608060001_harden_default_privileges_and_function.sql` once in the
   Supabase SQL Editor as `postgres`.
3. Confirm that the migration commits without an exception.
4. Create table, sequence, and function probes inside a transaction; verify
   that browser and service roles receive no privileges; roll the probes back.
5. Confirm `public.events` still has 13 rows and anonymous SELECT only.
6. Verify the live GitHub Pages site still loads Supabase events.

The adjacent rollback file restores the previous broad defaults and should be
used only for diagnosis. Default privilege changes do not affect existing
objects, so normal service recovery should not require that rollback.
