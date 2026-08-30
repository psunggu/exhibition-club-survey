-- 202608300004a — 운영자가 보드 소식을 올리고·고치고·지운다
--
-- 202608200001d(운영자 암호)와 202608200002a(survey_admin_ok)를 먼저 실행한 뒤 돌린다.
--
-- ── 왜 함수여야 하나 ────────────────────────────────────────
-- `public.events` 는 anon 에게 **select 만** 열려 있다. 쓰기 정책도, 쓰기 권한도
-- 만들면 안 된다 — scripts/validate-supabase-readonly.mjs 가 그 둘을 금지로 검사한다.
-- 그래서 화면에서 표에 바로 쓰지 못하고, security definer 함수를 거친다.
-- 브라우저가 들고 있는 것은 anon 키뿐이고, 진짜 자물쇠는 이 함수 안의 암호 확인이다.
--
-- ── 소식만 건드린다 ────────────────────────────────────────
-- 두 함수 모두 `type = '소식'` 인 행에만 닿는다. 운영자가 실수로 전시 id 를
-- 넣어도 전시는 지워지지 않는다. **이 조건을 빼지 말 것** — 이 함수는 anon 이
-- 부를 수 있고, 암호만 통과하면 보드 전체가 사정권에 든다.
--
-- ── 왜 진짜로 지우나 ───────────────────────────────────────
-- 설문은 deleted_at 만 찍는다. 응답이 딸려 있어 되돌릴 수 있어야 하기 때문이다.
-- 소식은 딸린 것이 없다. 지우면 그만이고, 되돌릴 것이 없으니 표시만 남기면
-- 오히려 「지웠는데 왜 목록에 있나」 가 된다.
--
-- ── 왜 날짜가 아니라 「며칠」 인가 ──────────────────────────
-- end_date 를 손으로 받으면 비워 두거나 먼 미래를 적을 수 있고, 그러면 낡은 소식이
-- 상단에 박힌다. 며칠만 받아 서버가 end_date 를 계산하면 **잊어도 사라진다.**
-- isCurrent() 가 end_date < 오늘 인 행을 이미 내린다.

-- ── 올리기 · 고치기 ────────────────────────────────────────
create or replace function public.news_admin_save(
  p_password text,
  p_payload  jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_id      uuid;
  v_title   text;
  v_url     text;
  v_genre   text;
  v_venue   text;
  v_summary text;
  v_days    integer;
  v_exists  uuid;
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;

  v_title   := btrim(coalesce(p_payload ->> 'title', ''));
  v_url     := btrim(coalesce(p_payload ->> 'url', ''));
  v_genre   := nullif(btrim(coalesce(p_payload ->> 'genre',   '')), '');
  v_venue   := nullif(btrim(coalesce(p_payload ->> 'venue',   '')), '');
  v_summary := nullif(btrim(coalesce(p_payload ->> 'summary', '')), '');
  v_days    := coalesce((p_payload ->> 'days')::integer, 0);

  if v_title = '' then
    raise exception '소식 제목을 적어 주세요.' using errcode = '22023';
  end if;
  if length(v_title) > 120 then
    raise exception '소식 제목이 너무 깁니다 (120자까지).' using errcode = '22023';
  end if;
  -- https 만 받는다. javascript: 같은 것이 링크로 나가면 안 된다
  -- (survey_admin_save 의 후보 링크와 같은 규칙이다).
  if v_url !~ '^https://' then
    raise exception '주소는 https:// 로 시작해야 합니다.' using errcode = '22023';
  end if;
  if length(v_url) > 500 then
    raise exception '주소가 너무 깁니다 (500자까지).' using errcode = '22023';
  end if;
  if length(coalesce(v_genre, '')) > 40 then
    raise exception '갈래가 너무 깁니다 (40자까지).' using errcode = '22023';
  end if;
  if length(coalesce(v_venue, '')) > 60 then
    raise exception '출처가 너무 깁니다 (60자까지).' using errcode = '22023';
  end if;
  if length(coalesce(v_summary, '')) > 120 then
    raise exception '덧붙이는 말이 너무 깁니다 (120자까지).' using errcode = '22023';
  end if;
  if v_days < 1 or v_days > 180 then
    raise exception '보일 기간은 1일에서 180일 사이로 정해 주세요.' using errcode = '22023';
  end if;

  v_id := nullif(p_payload ->> 'id', '')::uuid;

  if v_id is null then
    insert into public.events
      (status, region, type, title, genre, venue, summary,
       start_date, end_date, price, price_type, parking, main_url, updated_at)
    values (
      '공유완료', '서울 전체', '소식', v_title, v_genre, v_venue, v_summary,
      current_date, current_date + v_days,
      0, '무료', '해당 없음', v_url, now()
    )
    returning id into v_id;
  else
    -- **소식이 아닌 행은 고치지 못한다.** 전시 id 를 넣어도 여기서 걸린다.
    select id into v_exists from public.events
     where id = v_id and type = '소식';
    if not found then
      raise exception '없는 소식입니다.' using errcode = 'P0002';
    end if;

    update public.events set
      title      = v_title,
      genre      = v_genre,
      venue      = v_venue,
      summary    = v_summary,
      main_url   = v_url,
      -- 기한은 **고친 날부터 다시 센다.** 올린 날 기준으로 두면 이미 지난 날이 나온다
      -- (survey_admin_save 의 closes_at 과 같은 판단이다).
      end_date   = current_date + v_days,
      updated_at = now()
     where id = v_id;
  end if;

  return v_id;
end;
$$;

-- ── 지우기 ──────────────────────────────────────────────────
create or replace function public.news_admin_delete(
  p_password text,
  p_news     uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  -- type 조건이 이 함수의 울타리다. 빼면 보드의 어떤 행이든 지울 수 있게 된다.
  delete from public.events where id = p_news and type = '소식';
  if not found then
    raise exception '없는 소식입니다.' using errcode = 'P0002';
  end if;
end;
$$;

-- 기본 권한이 revoke 되어 있다(202608060001). grant 를 빠뜨리면 함수가 있어도
-- 앱에서 부를 수 없다 — 조용히 안 되는 쪽이다.
grant execute on function public.news_admin_save(text, jsonb)  to anon, authenticated;
grant execute on function public.news_admin_delete(text, uuid) to anon, authenticated;

-- 목록은 함수가 없다. events 는 anon 에게 select 가 열려 있어서 운영자 화면도
-- 보드와 **같은 길로** 읽는다. 읽기에 암호를 씌우면 자물쇠가 하나 더 있는 것처럼
-- 보이지만 실제로는 아무것도 못 막는다 — 같은 행을 누구나 REST 로 읽을 수 있다.

-- 확인 (기대: 2)
select count(*) as 소식_함수
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('news_admin_save', 'news_admin_delete');
