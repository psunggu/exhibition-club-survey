/**
 * a11y-probe.mjs — **보이는 화면의 대비와 누르는 크기를 재는 한 벌.**
 *
 * ── 왜 따로 두나 ───────────────────────────────────────────
 * 같은 식이 두 벌 있으면 한쪽만 고쳐진다. 실제로 그럴 뻔했다 —
 * 회원 설문 화면(validate-survey-ui.mjs)에는 대비를 재는 대목이 있는데
 * 운영자 화면(validate-survey-admin-ui.mjs)에는 **한 줄도 없었다.**
 * 0표 글자색을 바꿨을 때 운영자 화면 색도 같이 바뀌었는데 그대로 통과했다.
 *
 * validate-accessibility.mjs 는 일정·보드만 본다 — 설문 화면은 자료가 있어야
 * 내용이 그려져서 그쪽에서는 빈 화면밖에 못 잰다. 가짜 자료가 있는
 * 두 설문 검사가 잴 수 있는 유일한 자리다.
 *
 * ── 재는 규칙 ──────────────────────────────────────────────
 * WCAG 2.1 AA — 작은 글자 4.5:1, 큰 글자 3:1, 누르는 것 24px (2.5.8).
 * 「큰 글자」 는 18.66px 이상, 또는 굵고(700+) 14px 이상으로 본다
 * (validate-accessibility.mjs 와 같은 잣대를 쓴다).
 *
 * **접힌 것은 열고 잰다.** 닫힌 <details> 안은 offsetParent 가 null 이라
 * 그냥 두면 아예 안 본다 — 접기를 넣을수록 검사가 눈을 감는 꼴이 된다.
 */

const lum = (c) => {
  const v = c.map((x) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};

/** 두 색의 대비비. 색은 [r,g,b] 다. */
export const contrast = (a, b) => {
  const x = lum(a); const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/**
 * 지금 화면에서 보이는 글자와 누르는 것을 모아 온다.
 * `openFolds` 를 켜면 <details> 를 모두 펼친 뒤 잰다.
 */
export async function measureA11y(page, { openFolds = true } = {}) {
  if (openFolds) {
    await page.$$eval('details', (ds) => ds.forEach((d) => { d.open = true; }));
    await page.waitForTimeout(700);
  }

  const small = await page.$$eval('a,button,input,select,textarea,summary',
    (es) => es.filter((e) => e.offsetParent !== null)
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { c: e.className.toString().split(' ')[0] || e.tagName,
          w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((t) => t.h > 0 && (t.h < 24 || t.w < 24)));

  const texts = await page.evaluate(() => {
    const rgb = (s) => { const m = s.match(/[0-9]+/g); return m ? m.slice(0, 3).map(Number) : null; };
    const bgOf = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const c = getComputedStyle(e).backgroundColor;
        const m = c.match(/[0-9.]+/g);
        if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) return rgb(c);
      }
      return [255, 255, 255];
    };
    // 이 태그만 든 요소는 「글 한 덩어리」 로 본다. div 안에 div 가 있으면 두 번 센다.
    const INLINE = new Set(['BR', 'B', 'STRONG', 'EM', 'I', 'SPAN', 'A', 'SMALL', 'SVG']);
    /**
     * **못 누르는 것은 빼고 잰다.** WCAG 1.4.3 은 비활성 컨트롤을 대비 기준에서
     * 빼 준다 — 회색으로 눌러 둔 것이 「못 쓴다」 는 뜻이기 때문이다.
     * 이걸 안 빼면 `.survey-submit:disabled`(#b6b2a6 에 흰 글자, 2.12:1)가
     * 늘 걸려서, 진짜 결함이 그 소음에 묻힌다.
     */
    const off = (e) => e.closest(':disabled, [aria-disabled=\"true\"]') !== null;
    const SEL = '.wrap p, .wrap span, .wrap h1, .wrap h2, .wrap h3, .wrap a,'
      + ' .wrap button, .wrap summary, .wrap label, .wrap div';
    return [...document.querySelectorAll(SEL)]
      .filter((e) => e.offsetParent !== null && !off(e)
        && [...e.children].every((c) => INLINE.has(c.tagName.toUpperCase()))
        && (e.textContent || '').trim())
      .map((e) => {
        const c = getComputedStyle(e);
        return { sel: e.className.toString().split(' ')[0] || e.tagName.toLowerCase(),
          size: parseFloat(c.fontSize) || 0, weight: Number(c.fontWeight) || 400,
          fg: rgb(c.color), bg: bgOf(e), txt: (e.textContent || '').trim().slice(0, 20) };
      });
  });

  return { small, texts };
}

/** 모아 온 글자 가운데 기준에 못 미치는 것. 같은 선택자는 한 번만 알린다. */
export function dimTexts(texts) {
  const out = [];
  const seen = new Set();
  for (const t of texts) {
    if (!t.fg || !t.bg) continue;
    const large = t.size >= 18.66 || (t.size >= 14 && t.weight >= 700);
    const need = large ? 3 : 4.5;
    const r = contrast(t.fg, t.bg);
    if (Math.round(r * 100) / 100 >= need) continue;
    if (seen.has(t.sel)) continue;
    seen.add(t.sel);
    out.push(`.${t.sel} ${r.toFixed(2)}:1 (필요 ${need}) "${t.txt}"`);
  }
  return out;
}
