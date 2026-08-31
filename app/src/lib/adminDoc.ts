/**
 * adminDoc.ts — 운영진만 읽는 문서를 **블록 배열**로 다룬다.
 *
 * ── 왜 HTML 이 아닌가 ──────────────────────────────────────
 * 이 앱의 CSP 는 `style-src-attr 'none'` 이다. 서버가 준 HTML 을
 * dangerouslySetInnerHTML 로 심으면 `style="width:83%"` 가 **전부 막혀**
 * 막대가 0 폭이 된다. React 가 style prop 으로 그리면 CSSOM 이라 막히지 않는다.
 *
 * 그래서 서버는 **자료만** 주고 그리는 일은 화면이 한다.
 * 덤으로 얻는 것이 하나 더 있다 — 서버 글이 화면에서 **코드가 될 길이 없다.**
 *
 * ── 굵게는 어떻게 ──────────────────────────────────────────
 * 본문에 HTML 을 넣지 않는 대신 `**굵게**` 만 쓴다. 화면이 갈라서 <b> 로 그린다
 * (`splitBold`). 그 밖의 글자는 전부 그냥 글자다.
 *
 * 블록 종류는 supabase/migrations/202609010001a_admin_doc.sql 의 생성기와
 * 짝이 맞아야 한다. 한쪽만 바꾸면 화면이 그 블록을 **조용히 건너뛴다.**
 */

export type DocBlock =
  | { k: 'cover'; t: string; eyebrow: string; dek: string; tiles: [string, string, string][] }
  | { k: 'h'; n: string; t: string }
  | { k: 'lede'; t: string }
  | { k: 'p'; t: string }
  | { k: 'note'; t: string }
  | { k: 'card'; t?: string; ps: string[] }
  | { k: 'flag'; t: string; ps: string[] }
  | { k: 'person'; tone: 'a' | 'b' | 'c'; t: string; cnt: string; dek: string;
      pts: [string, string][]; careful: string }
  | { k: 'gap'; t: string; mult: string; side: 'a' | 'b';
      a: [number, number, number]; b: [number, number, number]; note?: string | null }
  | { k: 'rule'; kind: 'yes' | 'no'; n: string; t: string; chg?: string | null;
      ps: string[]; quote?: string | null; ev?: string | null }
  | { k: 'bars'; t: string; kind: string; rows: [string, number, number][] }
  | { k: 'table'; head: string[]; rows: string[][] }
  | { k: 'quotes'; t: string; kind: string; items: [string, string][]; note?: string | null }
  | { k: 'fold'; t: string; blocks: DocBlock[] }

export type AdminDoc = { title: string; updatedAt: string; body: DocBlock[] }
export type DocEntry = { slug: string; title: string; updatedAt: string }

/**
 * `**굵게**` 를 조각으로 가른다. 홀수 번째가 굵은 조각이다.
 *
 * **정규식으로 HTML 을 만들지 않는다.** 조각을 돌려주면 React 가 그것을
 * 문자열로 그리므로, 본문에 `<script>` 가 들어 있어도 글자로 나온다.
 */
export const splitBold = (s: string): { b: boolean; s: string }[] =>
  String(s ?? '').split('**').map((part, i) => ({ b: i % 2 === 1, s: part }))
