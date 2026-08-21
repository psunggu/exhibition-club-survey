import type { Event } from './events'
import type { Movie } from '../data/movies'
import type { DraftOption } from './survey'

/**
 * 보드에 있는 것을 설문 후보로 옮겨 온다.
 *
 * ── 왜 필요한가 ────────────────────────────────────────────
 * 설문 후보에 넣을 내용은 이미 보드에 다 있다 — 기간·장소·운영시간·관람료·예매 링크.
 * 그런데 지금은 운영자가 그것을 **손으로 다시 적는다.** 옮겨 적는 자리는 틀리는 자리다
 * (이 저장소에서만 상호 표기를 네 번 틀렸다). 있는 값을 그대로 가져오면 그 실수가 사라진다.
 *
 * ── 두 곳에서 온다 ─────────────────────────────────────────
 * **전시·공연**은 `public.events` (DB), **영화**는 `app/src/data/movies.ts` (파일) 다.
 * 모양이 아주 달라서 — 영화에는 기간·장소·관람료가 없고 상영시간·관람등급이 있다 —
 * 하나로 합치지 않고 각각 옮긴다.
 *
 * ── 옮긴 뒤에는 고칠 수 있다 ───────────────────────────────
 * 여기서 만드는 것은 **출발점**이지 최종본이 아니다.
 * 9월 설문의 서도호 후보를 보면 사람이 손봐서 훨씬 낫다 —
 * 얼리버드 기간을 따로 뽑아 적고, 휴관일을 줄여 적었다.
 * 그래서 옮긴 값도 후보 편집 칸에 그대로 들어가 고칠 수 있게 둔다.
 */

/** 보드에서 고를 수 있는 한 줄. 전시·공연·영화를 같은 모양으로 보여 주려고 쓴다. */
export type BoardPick = {
  key: string
  kind: '전시' | '공연' | '영화'
  title: string
  /** 목록에서 제목 아래 한 줄로 보여 줄 것 — 어느 것인지 가려내는 데 쓴다 */
  hint: string
  toOption: () => DraftOption
}

const clean = (s: string | null | undefined) => (s ?? '').trim()

/** `2026-08-27` → `2026. 8. 27.` — 보드 화면과 같은 말투 */
const koDate = (iso: string | null | undefined): string => {
  const s = clean(iso)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return ''
  const [y, m, d] = s.split('-')
  return `${y}. ${Number(m)}. ${Number(d)}.`
}

const period = (from: string | null | undefined, to: string | null | undefined): string => {
  const a = koDate(from); const b = koDate(to)
  if (a && b) return `${a} ~ ${b}`
  return a || b
}

/**
 * 링크는 **주소가 있는 것만** 넣는다.
 * 서버가 https 아닌 것을 거절하므로 빈 줄을 만들어 두면 저장할 때 걸린다.
 */
const link = (kind: DraftOption['links'][number]['kind'], label: string, url: string | null | undefined) => {
  const u = clean(url)
  return /^https:\/\//.test(u) ? [{ kind, label, url: u }] : []
}

/** 여러 줄짜리 설명을 합친다. 빈 것은 빼고, 줄바꿈으로 잇는다. */
const lines = (...xs: (string | null | undefined)[]) =>
  xs.map(clean).filter(Boolean).join('\n')

export function fromEvent(e: Event): DraftOption {
  return {
    title: clean(e.title),
    period: period(e.startDate, e.endDate),
    // 주소까지 붙이면 한 줄이 너무 길어진다. 지도 링크가 그 자리를 대신한다.
    venue: clean(e.venue),
    hours: clean(e.time),
    price: clean(e.priceType),
    /**
     * 할인은 관람료 칸이 아니라 여기 둔다 — 관람료 칸은 한 줄로 짧아야 읽힌다.
     * 안내(notes)가 먼저다. 실제로 예매할 때 걸리는 조건이 거기 적혀 있다.
     */
    note: lines(e.notes, e.discount && `할인 — ${clean(e.discount)}`),
    links: [
      ...link('official', '예매 페이지', e.infoUrl),
      ...link('official', '공식 상세', e.mainUrl),
      ...link('map', '지도', e.mapUrl),
    ],
  }
}

export function fromMovie(m: Movie): DraftOption {
  return {
    title: clean(m.title),
    // 영화는 기간이 없다. 개봉일과 상영 상태가 그 자리를 대신한다.
    period: lines([clean(m.releaseStatus), koDate(m.releaseDate) && `${koDate(m.releaseDate)} 개봉`]
      .filter(Boolean).join(' · ')),
    // **상영관은 비워 둔다.** 어디서 볼지는 모임을 잡을 때 정하는 것이지 영화에 딸린 값이 아니다.
    venue: '',
    hours: m.runtime ? `상영 ${m.runtime}분${clean(m.ageRating) ? ` · ${clean(m.ageRating)}` : ''}` : clean(m.ageRating),
    price: '',
    note: lines(m.summary, [clean(m.genre), clean(m.director) && `감독 ${clean(m.director)}`]
      .filter(Boolean).join(' · ')),
    links: link('official', 'KOBIS 영화정보', m.infoUrl),
  }
}

/**
 * 보드에 있는 것을 고를 수 있는 목록으로 만든다.
 *
 * **`기타` 는 뺀다.** 운영자가 고르는 화면은 전시·공연·영화 셋으로 나뉘는데,
 * 어디에도 안 맞는 것을 억지로 끼워 넣으면 그 칸이 잡동사니가 된다.
 * 보드에 없는 것은 지금처럼 손으로 넣으면 된다.
 */
export function boardPicks(events: Event[], movies: Movie[]): BoardPick[] {
  const fromEvents = events
    .filter((e) => e.type === '전시' || e.type === '공연')
    .map((e): BoardPick => ({
      key: `event:${e.id}`,
      kind: e.type === '공연' ? '공연' : '전시',
      title: clean(e.title),
      hint: [clean(e.venue), period(e.startDate, e.endDate)].filter(Boolean).join(' · '),
      toOption: () => fromEvent(e),
    }))

  const fromMovies = movies.map((m): BoardPick => ({
    key: `movie:${m.id}`,
    kind: '영화',
    title: clean(m.title),
    hint: [clean(m.releaseStatus), clean(m.genre)].filter(Boolean).join(' · '),
    toOption: () => fromMovie(m),
  }))

  return [...fromEvents, ...fromMovies].filter((p) => p.title)
}
