create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  status text not null default '검토중',
  region text not null default '서울 전체',
  type text not null default '전시',
  title text not null,
  genre text,
  start_date date,
  end_date date,
  visit_date date,
  time text,
  venue text,
  address text,
  price integer not null default 0,
  price_type text not null default '유료',
  parking text not null default '확인 필요',
  difficulty text not null default '가볍게',
  rating numeric(2, 1),
  owner text,
  info_url text,
  map_url text,
  summary text,
  recommendation text,
  notes text,
  rating_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.events force row level security;

-- 공개 웹은 읽기 전용이다. anon 키는 공개 식별자이므로 보안 경계는
-- 테이블 권한과 RLS가 함께 강제해야 한다.
revoke all on table public.events from public, anon, authenticated;
grant select on table public.events to anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

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

create policy "events_select_public"
on public.events
for select
to anon, authenticated
using (true);
