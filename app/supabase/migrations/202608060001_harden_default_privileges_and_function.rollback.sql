-- Emergency rollback only. This restores the broad platform defaults that
-- existed before 202608060001 and therefore reintroduces the P1 exposure risk.
-- It does not change privileges on objects that already exist.
begin;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete, truncate, references, trigger, maintain
  on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant usage, select, update on sequences to anon, authenticated, service_role;
alter default privileges for role postgres
  grant execute on functions to public;
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated, service_role;

alter function public.set_updated_at() reset search_path;

commit;
