begin;

-- P1 hardening: objects created by the application owner in the exposed
-- public schema start with no Data API privileges. Required access must be
-- granted explicitly in the same migration that creates the object.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated, service_role;
-- PostgreSQL's implicit PUBLIC execute grant is global. A schema-specific
-- revoke cannot remove it, so revoke it at the role-wide default level first.
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

-- This trigger function does not resolve any application relation. An empty
-- search_path prevents later schemas from changing how names are resolved.
alter function public.set_updated_at() set search_path = '';
revoke execute on function public.set_updated_at()
  from public, anon, authenticated;

do $security_check$
begin
  if exists (
    select 1
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) x
    where d.defaclrole = 'postgres'::regrole
      and d.defaclnamespace = 'public'::regnamespace
      and (
        x.grantee = 0
        or x.grantee in (
          'anon'::regrole,
          'authenticated'::regrole,
          'service_role'::regrole
        )
      )
      and d.defaclobjtype in ('r', 'S', 'f')
  ) then
    raise exception 'postgres still grants public Data API default privileges in schema public';
  end if;

  if not exists (
    select 1
    from pg_default_acl d
    where d.defaclrole = 'postgres'::regrole
      and d.defaclnamespace = 0
      and d.defaclobjtype = 'f'
  ) or exists (
    select 1
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) x
    where d.defaclrole = 'postgres'::regrole
      and d.defaclnamespace = 0
      and d.defaclobjtype = 'f'
      and x.grantee = 0
      and x.privilege_type = 'EXECUTE'
  ) then
    raise exception 'new postgres functions still inherit PUBLIC execute';
  end if;

  if not exists (
    select 1
    from pg_proc p
    cross join lateral unnest(coalesce(p.proconfig, array[]::text[])) setting
    where p.oid = 'public.set_updated_at()'::regprocedure
      and setting like 'search_path=%'
  ) then
    raise exception 'public.set_updated_at() still has a mutable search_path';
  end if;

  if has_function_privilege('anon', 'public.set_updated_at()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.set_updated_at()', 'EXECUTE') then
    raise exception 'untrusted roles can still execute public.set_updated_at()';
  end if;

  if not has_table_privilege('anon', 'public.events', 'SELECT')
     or has_table_privilege('anon', 'public.events', 'INSERT')
     or has_table_privilege('anon', 'public.events', 'UPDATE')
     or has_table_privilege('anon', 'public.events', 'DELETE') then
    raise exception 'public.events no longer has the required anonymous read-only grants';
  end if;
end
$security_check$;

commit;
