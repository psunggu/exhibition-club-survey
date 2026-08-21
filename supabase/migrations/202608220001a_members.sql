-- 202608220001a — 회원 명부와 설문 참여 확인
--
-- 202608210001a 를 먼저 실행한 뒤 이것을 실행한다. 여러 번 돌려도 결과가 같다.
-- **이 파일에는 사람 이름이 하나도 없다.** 명부는 운영자 화면에서 넣는다.
--
-- ── 왜 필요한가 ────────────────────────────────────────────
-- 지금은 아무 이름이나 적으면 설문에 응답할 수 있다. 구역번호와 이름을 함께 받는 것이
-- 남의 이름을 적는 실수를 줄여 주기는 하지만 막지는 못한다.
-- 명부에 있는 사람만 받게 하면 오타와 착각이 걸러진다 —
-- `4133 홍길동` 과 `4133 홍길둥` 이 다른 사람으로 세어지던 일이 없어진다.
-- (예시 이름은 지어낸 것이다. 이 저장소는 공개라 실제 회원 이름을 적지 않는다.)
--
-- ── 이 표는 잠근다 ─────────────────────────────────────────
-- **여기 담기는 것이 곧 회원 명부다.** anon 열쇠는 공개 저장소에 있으므로,
-- 이 표를 읽을 수 있게 두면 교인들의 이름과 구역번호가 통째로 새어 나간다.
-- 그래서 survey_responses 와 같은 방식을 쓴다 — RLS 를 켜고 **정책을 하나도 두지 않는다.**
-- 정책이 없으면 아무도 못 읽는다.
--
-- 대조는 아래 security definer 함수 안에서만 일어나고, 그 함수는 **명단을 돌려주지 않는다.**
-- 물어본 한 쌍이 맞는지 예/아니오만 답한다.
-- 명단 전체를 보는 길은 운영자 암호를 아는 사람에게만 열려 있다.

create table if not exists public.survey_members (
  id            uuid        primary key default gen_random_uuid(),
  zone          text        not null,
  name          text        not null,
  -- 언제 명부에 올랐는가. 운영자가 고칠 수 있다 — 옮겨 적는 명부는 날짜가 제각각이다.
  registered_at timestamptz not null default now(),
  unique (zone, name)
);

comment on table public.survey_members is
  '설문에 응답할 수 있는 회원. 이 표 자체가 명부라 anon 은 읽지 못한다.';

alter table public.survey_members enable row level security;

-- 정책을 만들지 않는다. 이것이 잠그는 방식이다 — 지우지 말 것.
revoke all on public.survey_members from anon, authenticated;

-- ── 두드리는 횟수를 센다 ───────────────────────────────────
/**
 * **명부 대조는 예/아니오를 답한다. 그래서 반복해서 물으면 명부가 나온다.**
 * 표를 잠가 둔 것으로는 이 길이 막히지 않는다 — 통째로 못 가져갈 뿐,
 * 흔한 이름 사전 × 구역 열 개를 훑으면 스물한 명이 다 드러난다.
 * 한 대에서 쉬지 않고 두드리면 몇 분이면 끝난다.
 *
 * 그래서 **부르는 횟수를 센다.** 정상 사용은 설문 한 번에 한두 번이라 걸릴 일이 없고,
 * 훑으려는 쪽은 IP 하나로 하루 한 줌밖에 못 물어보게 된다.
 *
 * IP 는 `cf-connecting-ip` 를 쓴다. Supabase 앞에 Cloudflare 가 있고(`cf-worker`),
 * 이 헤더는 **Cloudflare 가 직접 채우며 클라이언트가 보낸 같은 이름을 덮어쓴다.**
 * `x-forwarded-for` 는 값이 이어붙을 수 있어 앞에 가짜를 끼워 넣을 여지가 있으므로,
 * 없을 때만 그 **마지막** 값을 쓴다 — 마지막이 가장 바깥 프록시가 본 주소다.
 *
 * 한계는 분명하다. **IP 를 바꿔 가며 두드리면 여전히 뚫린다.**
 * 이건 막는 장치가 아니라 비용을 올리는 장치다 — 5분이 3주가 된다.
 */
create table if not exists public.survey_probe_log (
  ip text        not null,
  at timestamptz not null default now()
);
create index if not exists survey_probe_log_ip_at on public.survey_probe_log (ip, at desc);

alter table public.survey_probe_log enable row level security;
-- 정책을 만들지 않는다. 누가 언제 두드렸는지도 명부만큼 사적인 기록이다.
revoke all on public.survey_probe_log from anon, authenticated;

create or replace function public.survey_caller_ip()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    nullif(btrim(current_setting('request.headers', true)::jsonb ->> 'cf-connecting-ip'), ''),
    -- x-forwarded-for 는 `가짜, 진짜` 로 올 수 있다. 마지막 것만 믿는다.
    nullif(btrim(split_part(
      current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', -1)), ''),
    'unknown'
  );
$$;
revoke execute on function public.survey_caller_ip() from public, anon, authenticated;

/**
 * **빗나간 조회만 센다.** 명부에 있는 사람이 제대로 부른 것은 세지 않는다.
 *
 * 처음엔 부른 횟수를 다 셌는데, 그러면 **모임 현장이 걸린다** —
 * 스물한 명이 같은 교회 와이파이에서 한꺼번에 참여하면 IP 하나로 예순 번이 넘게 오고,
 * 정작 회원들이 문턱에 막힌다. 밖에서 보면 그게 공격과 구분이 안 된다.
 *
 * 빗나간 것만 세면 그 문제가 사라진다. 훑으려는 쪽은 거의 다 빗나가므로 금방 걸리고,
 * 회원은 이름을 잘못 적었을 때만 한두 번 세어진다.
 *
 * 분당 10회 · 시간당 40회로 잡았다. 오타로 열 번 연속 틀리는 회원은 없고,
 * 사전으로 3만 번을 훑으려면 IP 하나로 **한 달 가까이** 걸린다.
 */
create or replace function public.survey_probe_blocked()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_ip   text := public.survey_caller_ip();
  v_min  integer;
  v_hour integer;
begin
  -- 오래된 기록은 여기서 함께 지운다. 따로 청소하는 일감을 만들면 그것부터 잊는다.
  delete from public.survey_probe_log where at < now() - interval '2 hours';

  select count(*) filter (where at > now() - interval '1 minute'),
         count(*) filter (where at > now() - interval '1 hour')
    into v_min, v_hour
    from public.survey_probe_log where ip = v_ip;

  return v_min >= 10 or v_hour >= 40;
end;
$$;
revoke execute on function public.survey_probe_blocked() from public, anon, authenticated;

/** 빗나간 조회 한 번을 적어 둔다 */
create or replace function public.survey_probe_miss()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  insert into public.survey_probe_log (ip) values (public.survey_caller_ip());
$$;
revoke execute on function public.survey_probe_miss() from public, anon, authenticated;

-- ── 회원이 부르는 것 : 예/아니오만 ─────────────────────────
-- 앞뒤 공백을 떼고 견준다. 사람은 `4133 ` 처럼 공백을 흘려 넣는다.
-- 구역번호는 숫자만 남긴다 — `4133번`, `4133 구역` 을 같은 것으로 본다.
--
-- **너무 잦으면 false 를 준다.** 거절한다고 따로 알리지 않는다 —
-- "지금 막혔다" 를 알려 주면 그것도 신호가 되고, 회원에게는 어차피 같은 화면이다.
-- 회원은 제출까지 갈 수 있고, 거기서 서버가 다시(그리고 제대로) 대조한다.
-- 빗나간 것을 적어 두느라 쓰기를 하므로 stable 이 아니다.
-- stable 로 두면 안에서 부르는 survey_probe_miss 가 쓰기를 해서 거절당한다.
create or replace function public.survey_member_ok(p_zone text, p_name text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_ok boolean;
begin
  if public.survey_probe_blocked() then
    return false;
  end if;
  select exists (
    select 1 from public.survey_members m
     where m.zone = regexp_replace(btrim(coalesce(p_zone, '')), '[^0-9]', '', 'g')
       and m.name = btrim(coalesce(p_name, ''))
  ) into v_ok;
  -- 맞힌 것은 세지 않는다. 회원이 정상적으로 쓰는 길에는 문턱이 없다.
  if not v_ok then perform public.survey_probe_miss(); end if;
  return v_ok;
end;
$$;

comment on function public.survey_member_ok(text, text) is
  '이 구역번호와 이름이 명부에 있는가. 명단은 돌려주지 않는다.';

/**
 * 명부가 **있는지 없는지만** 답한다. 인원수를 주지 않는다.
 *
 * 화면이 알아야 하는 것은 "지금 명부로 거르고 있나" 하나뿐이다.
 * 처음엔 인원수를 그대로 돌려줬는데, 그러면 한 명씩 물어 명부를 캐내는 사람에게
 * **언제 멈출지를 알려 주는 셈**이 된다 — 스물한 명을 찾으면 끝이라는 걸 알게 된다.
 * 정확한 인원은 운영자 화면(암호가 필요하다)에서 본다.
 */
create or replace function public.survey_roster_on()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (select 1 from public.survey_members);
$$;

-- ── 운영자가 부르는 것 : 암호를 확인한 뒤에만 ──────────────

create or replace function public.survey_admin_members(p_password text)
returns table (member_id uuid, member_zone text, member_name text, member_at timestamptz)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  return query
    select m.id, m.zone, m.name, m.registered_at
      from public.survey_members m
     order by m.zone, m.name;
end;
$$;

create or replace function public.survey_admin_member_save(
  p_password text,
  p_id       uuid,
  p_zone     text,
  p_name     text,
  p_at       timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_zone text := regexp_replace(btrim(coalesce(p_zone, '')), '[^0-9]', '', 'g');
  v_name text := btrim(coalesce(p_name, ''));
  v_at   timestamptz := coalesce(p_at, now());
  v_id   uuid;
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  if v_zone = '' then
    raise exception '구역번호를 숫자로 적어 주세요.' using errcode = '22023';
  end if;
  if v_name = '' then
    raise exception '이름을 적어 주세요.' using errcode = '22023';
  end if;
  if length(v_zone) > 12 or length(v_name) > 30 then
    raise exception '구역번호나 이름이 너무 깁니다.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.survey_members (zone, name, registered_at)
    values (v_zone, v_name, v_at)
    -- 같은 사람을 두 번 넣어도 한 줄이다. 등록일자는 처음 것을 지킨다 —
    -- 다시 넣었다고 해서 그 사람이 오늘 새로 들어온 것은 아니다.
    on conflict (zone, name) do update set zone = excluded.zone
    returning id into v_id;
  else
    update public.survey_members
       set zone = v_zone, name = v_name, registered_at = v_at
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception '없는 회원입니다.' using errcode = 'P0002';
    end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.survey_admin_member_delete(p_password text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  delete from public.survey_members where id = p_id;
end;
$$;

-- ── 응답을 받을 때 막는다 ──────────────────────────────────
-- 화면 검사만으로는 부족하다. 화면을 건너뛰고 함수를 바로 부를 수 있기 때문이다.
--
-- **명부가 비어 있으면 아무도 막지 않는다.** 표를 만들고 명부를 아직 안 넣은 사이에
-- 설문이 통째로 멈추면 안 된다. 한 줄이라도 있으면 그때부터 건다.
--
-- ── 이 함수를 쓸 때 조심한 것 세 가지 ──────────────────────
--
-- **하나. 구역번호를 한 번만 접는다.**
-- 명부 대조는 숫자만 남겨서 견주는데(`4133번` → `4133`), 저장과 열쇠는 원문을 쓰면
-- 같은 사람이 `4133` · `4133번` · `04133` 으로 **매번 다른 열쇠**를 만든다.
-- 명부는 매번 통과하고 `unique(survey_id, respondent_key)` 는 매번 빠져나가서,
-- 명부에 있는 한 사람이 한 설문에 응답을 무한히 쌓을 수 있다.
-- 그래서 맨 앞에서 한 번 접고, 그 값으로 **대조·저장·열쇠를 모두** 만든다.
--
-- **둘. 명부 검사를 설문 검사 뒤에 둔다.**
-- 앞에 두면 없는 설문 uuid 로 불러도 명부 판정이 먼저 나와,
-- 오류 문구만으로 "이 사람이 회원인가" 를 물어보는 창구가 된다.
-- 뒤에 두면 적어도 열린 설문 하나를 알아야 물어볼 수 있다.
--
-- **셋. 실패 문구를 하나로 맞춘다.**
-- 명부에 없을 때와 설문이 닫혔을 때가 다른 말을 하면 그 차이가 곧 답이 된다.
-- 회원에게는 어느 쪽이든 같은 문장을 보여 준다.
-- (완전히 막으려면 호출 횟수를 제한해야 하는데 그건 이 층에서 할 수 없다 — 아래 주석 참고.)
create or replace function public.survey_submit(
  p_survey  uuid,
  p_zone    text,
  p_name    text,
  p_options uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_survey  public.surveys%rowtype;
  v_key     text;
  -- **여기서 한 번만 접는다.** 아래 모든 곳이 이 값을 쓴다.
  v_zone    text := regexp_replace(btrim(coalesce(p_zone, '')), '[^0-9]', '', 'g');
  v_name    text := btrim(coalesce(p_name, ''));
  v_opts    uuid[];
  v_bad     integer;
  v_roster  integer;
begin
  if v_zone = '' or v_name = '' then
    raise exception '구역번호와 이름을 모두 적어 주세요.' using errcode = '22023';
  end if;
  if length(v_zone) > 12 or length(v_name) > 30 then
    raise exception '구역번호나 이름이 너무 깁니다.' using errcode = '22023';
  end if;

  select * into v_survey from public.surveys
   where id = p_survey and deleted_at is null;
  if not found then
    raise exception '없는 설문입니다.' using errcode = 'P0002';
  end if;

  -- 밖에서 진행된 투표를 옮겨 온 설문이다. 여기서 받으면 표가 사라진다.
  if v_survey.imported_respondents is not null then
    raise exception '이 투표는 톡방에서 진행합니다. 이 화면은 결과만 보여 드립니다.'
      using errcode = '22023';
  end if;

  if now() < v_survey.opens_at then
    raise exception '아직 시작되지 않은 설문입니다.' using errcode = '22023';
  end if;
  if now() > v_survey.closes_at then
    raise exception '마감된 설문입니다.' using errcode = '22023';
  end if;

  /**
   * 명부는 여기서 본다. 설문이 열려 있는 것을 확인한 뒤다.
   *
   * 너무 많이 빗나간 곳에서 온 요청은 **맞는 이름이어도 잠시 물린다.**
   * 회원이 여기 걸릴 일은 없다 — 걸리려면 방금 열 번을 연달아 틀려야 한다.
   */
  select count(*) into v_roster from public.survey_members;

  if v_roster > 0 and public.survey_probe_blocked() then
    raise exception '잠시 뒤에 다시 시도해 주세요.' using errcode = '22023';
  end if;

  /**
   * **여기서 빗나간 것은 셀 수 없다.** 아래 `raise` 가 거래를 통째로 되돌려서
   * 방금 적은 기록까지 함께 지워지기 때문이다. 세는 척하는 코드를 두느니 안 둔다.
   * (거래를 따로 떼어 적으려면 dblink 같은 것이 있어야 하는데 여기에는 없다.)
   *
   * 그래도 이 길로 명부를 캐내는 것은 survey_member_ok 로 캐내는 것보다 비싸다.
   *   · 열려 있는 설문 하나와 그 설문의 후보 uuid 를 알아야 한다
   *   · **맞히면 응답이 실제로 저장된다** — 지어낸 응답이 쌓여 운영자 화면에 그대로 보인다.
   *     조용히 훑을 수가 없다. 이름을 맞힌 만큼 흔적이 남는다.
   * 완전히 막으려면 요청 수를 세는 층(Edge Function)이 앞에 있어야 한다.
   */
  if v_roster > 0 and not exists (
      select 1 from public.survey_members m
       where m.zone = v_zone and m.name = v_name
    ) then
    raise exception '이 설문에 응답할 수 없습니다. 구역번호와 이름을 단톡방 프로필과 같게 적어 주세요.'
      using errcode = '22023';
  end if;

  v_opts := (select coalesce(array_agg(distinct o), '{}'::uuid[])
               from unnest(coalesce(p_options, '{}'::uuid[])) o);

  if array_length(v_opts, 1) is null then
    raise exception '적어도 하나는 골라 주세요.' using errcode = '22023';
  end if;
  if not v_survey.multi_choice and array_length(v_opts, 1) > 1 then
    raise exception '이 설문은 하나만 고를 수 있습니다.' using errcode = '22023';
  end if;

  select count(*) into v_bad
    from unnest(v_opts) o
   where not exists (
     select 1 from public.survey_options so
      where so.id = o and so.survey_id = p_survey
   );
  if v_bad > 0 then
    raise exception '이 설문의 후보가 아닌 항목이 섞여 있습니다.' using errcode = '22023';
  end if;

  v_key := public.survey_respondent_key(v_zone, v_name);

  insert into public.survey_responses (survey_id, respondent_key, zone, display_name)
  values (p_survey, v_key, v_zone, v_name)
  on conflict (survey_id, respondent_key)
  do update set display_name = excluded.display_name,
                zone         = excluded.zone,
                updated_at   = now();

  delete from public.survey_choices
   where response_id = (select id from public.survey_responses
                         where survey_id = p_survey and respondent_key = v_key);

  insert into public.survey_choices (response_id, option_id)
  select r.id, o
    from public.survey_responses r, unnest(v_opts) o
   where r.survey_id = p_survey and r.respondent_key = v_key;
end;
$$;

-- ── 부를 수 있게 열어 준다 ─────────────────────────────────
-- 기본 권한이 회수돼 있어(202608060001) 함수마다 명시해야 한다.
grant execute on function public.survey_member_ok(text, text) to anon, authenticated;
grant execute on function public.survey_roster_on()           to anon, authenticated;
grant execute on function public.survey_submit(uuid, text, text, uuid[])              to anon, authenticated;
grant execute on function public.survey_admin_members(text)                           to anon, authenticated;
grant execute on function public.survey_admin_member_save(text, uuid, text, text, timestamptz) to anon, authenticated;
grant execute on function public.survey_admin_member_delete(text, uuid)               to anon, authenticated;

-- ── 확인 ───────────────────────────────────────────────────
-- 기대: 정책 0개 · 명부 0명 · 없는 사람은 false
select
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'survey_members') as 정책_수_0이어야_함,
  (select count(*) from public.survey_members)                    as 명부_인원,
  public.survey_member_ok('0000', '없는사람')                     as 없는사람_false여야_함;
