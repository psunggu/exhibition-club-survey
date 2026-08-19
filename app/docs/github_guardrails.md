# GitHub repository guardrails

## Pull request validation

`.github/workflows/validate.yml` runs on every pull request targeting `main`.
It uses read-only repository permissions and does not receive application
secrets. The `Security and content checks` job verifies:

- tracked files do not contain common private-key or service-token patterns;
- local backup, output, credential, and key files are not tracked;
- the public weekly digest and notice page agree;
- the public Supabase client remains read-only;
- the P1 Supabase migration guards remain present; and
- public JavaScript parses successfully.

Run the same checks locally before opening a pull request:

```powershell
node scripts/validate-repository-hygiene.mjs
node scripts/validate-weekly-digest.mjs
node scripts/validate-supabase-readonly.mjs
node scripts/validate-supabase-p1.mjs
```

The public Supabase `anon` JWT is allowed only in
`app/public/config.js`. It is a browser credential,
not an authorization boundary. Database grants, forced RLS, and the public
SELECT policy remain the authorization boundary. A `service_role` JWT is never
allowed in tracked files.

## Main branch ruleset

The active `main` ruleset should:

- require a pull request before merging, with zero required approvals for the
  single-owner repository;
- require the `Security and content checks` status check;
- block force pushes and branch deletion; and
- leave an administrator emergency bypass so the owner is not locked out.

Do not bypass a failed validation or secret-scanning warning merely to finish a
deployment. Remove or rotate the exposed credential first, then rerun the
checks.
