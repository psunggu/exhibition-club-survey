begin;

-- Emergency P0 hardening: the public GitHub Pages client may read events, but
-- anonymous or ordinary authenticated clients must never mutate the table.
lock table public.events in access exclusive mode;

alter table public.events enable row level security;
alter table public.events force row level security;

do $drop_events_policies$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
  loop
    execute format('drop policy %I on public.events', existing_policy.policyname);
  end loop;
end
$drop_events_policies$;

revoke all on table public.events from public, anon, authenticated;
grant select on table public.events to anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

create policy "events_select_public"
on public.events
for select
to anon, authenticated
using (true);

comment on table public.events is
  'Public culture events. Browser clients are read-only; writes require a trusted operator path.';

do $security_check$
begin
  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'events'
      and grantee in ('PUBLIC', 'anon', 'authenticated')
      and privilege_type <> 'SELECT'
  ) then
    raise exception 'public.events still grants non-SELECT table privileges to an untrusted role';
  end if;

  if exists (
    select 1
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'events'
      and grantee in ('PUBLIC', 'anon', 'authenticated')
      and privilege_type in ('INSERT', 'UPDATE')
  ) then
    raise exception 'public.events still grants column write privileges to an untrusted role';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and roles && array['public', 'anon', 'authenticated']::name[]
  ) then
    raise exception 'public.events still has a write policy for an untrusted role';
  end if;
end
$security_check$;

commit;
