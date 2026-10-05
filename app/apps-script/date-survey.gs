/**
 * 41교구 전시·박물관 동아리 — 10월 정기관람 날짜 고르기 (헐버트 사진전)
 *
 * 쓰는 법(자세한 것은 같은 폴더 README.md):
 *   1. script.google.com → 새 프로젝트 → 이 파일 전체를 붙여 넣는다.
 *   2. 고칠 것은 바로 아래 CONFIG 하나뿐이다.
 *   3. 위 함수 목록에서 하나를 골라 실행한다.
 *        setupBranchForm  — 버전 A 분기형(권장)
 *        setupSimpleForm  — 버전 B 간단형(한 페이지)
 *        setupSheetGrid   — 버전 C 시트 직접 입력형(폼 없음) — 비권장 · 운영진 내부용.
 *                           회원에게 돌리려면 이름이 든 시트 링크를 톡방에 올려야 해서 개인정보 원칙과 부딪힌다.
 *        refreshTally     — 취합 시트를 다시 계산한다(A·B)
 *        closeForm        — 응답 받기를 끈다(A·B)
 *   4. 실행 기록(로그)에 나온 응답 링크만 톡방에 올린다. 시트 링크는 올리지 않는다.
 *   5. 권한 화면에 체크칸이 보이면 「모두 선택」 을 누른다. 하나라도 빼면 스크립트가 멈추고 권한을 다시 묻는다.
 *   6. 날짜를 빼거나 바꾸려면 폼 편집기에서 격자 줄을 고치지 말고 CONFIG 를 고친 뒤 forceNew 로 새로 만든다.
 *
 * 받는 것은 이름(필수)과 구역(선택)뿐이다. 직업 · 연락처 · 이메일은 묻지 않는다.
 */

var CONFIG = {
  club: '41교구 전시·박물관 동아리',
  formTitle: '10월 정기관람 날짜 고르기 — 헐버트 사진전',

  exhibition: {
    title: '고종의 밀사 헐버트, 조선을 담다',
    shortTitle: '헐버트 사진전',
    organizer: '헐버트박사기념사업회',
    venue: '함께봄',
    address: '서울 종로구 효자로7길 10',
    access: '경복궁역에서 걸어서 5분',
    hours: '오전 10시~오후 6시',
    fee: '무료',
    // 운영 시간 · 관람료를 주최 측에 확인했으면 true 로 바꾼다(「확인 중」 문구가 빠진다).
    factsConfirmed: false,
    photosPerPhase: 50,
    phase2Start: '2026-10-16'
  },

  // 마감(한국 시각). 바꾸면 폼 · 안내문 · 자동 마감이 모두 따라간다.
  deadline: '2026-10-10T23:00:00+09:00',
  announceDate: '2026-10-11',
  keepUntil: '2026-10-31',
  targetMonth: '2026-10',
  timeZone: 'Asia/Seoul',

  // 본 모임 후보는 토요일만 넣는다(일요일은 뺀다 — 운영자 결정 2026-10-06). 토요일이 아닌 날을 넣으면 검사에서 멈춘다.
  // 10/10(토)은 마감 날이라 넣지 않는다. 이름은 weekendDates 로 두지만 회원 화면에는 「토요일」 로 보인다.
  weekendDates: ['2026-10-17', '2026-10-24', '2026-10-31'],
  weekdayDates: [
    '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16',
    '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23',
    '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'
  ],
  // 휴관일을 모르므로 월요일은 후보에 넣지 않는다. 확인되면 true.
  allowMonday: false,
  // 마감 전후라 뺀 날(넣으면 검사에서 멈춘다).
  excludedDates: ['2026-10-09', '2026-10-10', '2026-10-11'],
  // 따로 알릴 날 — 1차 · 2차 사진을 바꾸느라 쉴 수 있다(공식 확인 없음).
  noteDates: { '2026-10-15': '1차 마지막 날', '2026-10-16': '2차 첫날' },
  noteDatesReason: '사진을 바꾸느라 쉴 수도 있어요',
  weekdayWindow: '오전 10시~오후 6시',

  slots: [
    { id: 'am', label: '오전 10~12시' },
    { id: 'pm1', label: '오후 1~3시' },
    { id: 'pm2', label: '오후 3~6시' }
  ],
  districts: ['1구역', '2구역', '3구역', '4구역', '5구역', '6구역', '7구역', '8구역', '잘 모르겠어요'],
  districtUnknown: '잘 모르겠어요',

  // 마감 시각에 응답 받기를 저절로 끈다(closeForm 을 시간 트리거로 건다).
  autoCloseAtDeadline: true,
  // 이미 만든 것이 있어도 새로 만들려면 true. 다 만든 뒤 false 로 되돌린다.
  forceNew: false,

  // 버전 C(시트 직접 입력형)
  sheetRows: 30,
  sheetSpareRows: 10,
  sheetMarks: ['○', '△'],

  // 버전 D(카톡 투표) — 항목 수 상한은 공식 문서로 확인하지 못해 낮게 잡았다.
  kakao: { maxItemsPerPoll: 9, maxPollsPerPost: 3, weekdayChunk: 6 },

  headerColor: '#1e5631',
  headerFontColor: '#ffffff'
};

/* ───────────────────────── 이름표 ───────────────────────── */

var VARIANT_NAMES = { A: '분기형', B: '간단형', C: '시트 직접 입력형' }; // C 는 비권장 · 운영진 내부용
var PROP_FORM_ID = 'FORM_ID';
var PROP_SHEET_ID = 'SHEET_ID';
var PROP_VARIANT = 'VARIANT';
var PROP_META = 'META';
var PROP_SETUP_DONE = 'SETUP_DONE'; // setup 이 끝까지 돌았는지 — 없으면 다음 실행이 남은 설정을 마저 한다
var TALLY_HANDLER = 'onFormSubmitTally';
var CLOSE_HANDLER = 'closeForm';
var SHEET_RAW = '응답 원본';
var SHEET_TALLY = '취합';
var SHEET_GUIDE = '안내';
var SHEET_GRID = '날짜 고르기';
var DOW = ['일', '월', '화', '수', '목', '금', '토'];

/* ───────────────────────── 날짜 도우미 ───────────────────────── */

function parseIso_(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) throw new Error('날짜 형식이 틀렸어요: ' + iso + ' (YYYY-MM-DD 로 적어 주세요)');
  var y = +m[1], mo = +m[2], d = +m[3];
  var t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) throw new Error('없는 날짜예요: ' + iso);
  return { y: y, m: mo, d: d };
}

function dowOf_(iso) {
  var p = parseIso_(iso);
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
}

/** 10/17(토) */
function dateLabel_(iso) {
  var p = parseIso_(iso);
  return p.m + '/' + p.d + '(' + DOW[dowOf_(iso)] + ')';
}

/** 10/17 */
function shortDate_(iso) {
  var p = parseIso_(iso);
  return p.m + '/' + p.d;
}

function hourLabel_(hh, mm) {
  var ap = hh < 12 ? '오전' : '오후';
  var h = hh % 12 === 0 ? 12 : hh % 12;
  return ap + ' ' + h + '시' + (mm ? ' ' + mm + '분' : '');
}

function deadlineParts_() {
  var m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(CONFIG.deadline);
  if (!m) throw new Error('마감 형식이 틀렸어요: ' + CONFIG.deadline + ' (예: 2026-10-10T23:00:00+09:00)');
  return { iso: m[1], hh: +m[2], mm: +m[3] };
}

/** 10/10(토) 오후 11시 */
function deadlineLabel_() {
  var p = deadlineParts_();
  return dateLabel_(p.iso) + ' ' + hourLabel_(p.hh, p.mm);
}

function deadlineDate_() {
  var d = new Date(CONFIG.deadline);
  if (isNaN(d.getTime())) throw new Error('마감 시각을 읽지 못했어요: ' + CONFIG.deadline);
  return d;
}

/** 받침이 있으면 「은」, 없으면 「는」 — 10/15(목)은 · 10/16(금)은 · 10/14(수)는 */
function topicParticle_(word) {
  var s = String(word).replace(/[)\s]+$/, '');
  var c = s.charCodeAt(s.length - 1);
  if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 ? '은' : '는';
  return '은';
}

function formatTime_(ms) {
  if (!ms) return '';
  var tz = CONFIG.timeZone || Session.getScriptTimeZone();
  return Utilities.formatDate(new Date(ms), tz, 'M/d HH:mm');
}

function weekendSorted_() { return CONFIG.weekendDates.slice().sort(); }
function weekdaySorted_() { return CONFIG.weekdayDates.slice().sort(); }

/* ───────────────────────── 설정 검사 ───────────────────────── */

function validateConfig_() {
  var errors = [];
  var dl = deadlineParts_();
  deadlineDate_();
  var all = CONFIG.weekendDates.concat(CONFIG.weekdayDates);
  var seen = {};
  all.forEach(function (iso) {
    try { parseIso_(iso); } catch (e) { errors.push(e.message); return; }
    if (seen[iso]) errors.push('후보 날짜가 두 번 들어 있어요: ' + iso);
    seen[iso] = true;
    if (iso.slice(0, 7) !== CONFIG.targetMonth) errors.push(iso + ' 는 ' + CONFIG.targetMonth + ' 이 아니에요');
    if (iso <= dl.iso) errors.push(iso + ' 는 마감(' + dl.iso + ') 뒤가 아니에요');
    if (CONFIG.announceDate && iso <= CONFIG.announceDate) errors.push(iso + ' 는 결과 알림(' + CONFIG.announceDate + ') 뒤가 아니에요');
    if (CONFIG.excludedDates.indexOf(iso) >= 0) errors.push(iso + ' 는 뺀 날이에요');
  });
  CONFIG.weekendDates.forEach(function (iso) {
    var w = safeDow_(iso);
    if (w !== null && w !== 6) errors.push(iso + ' 는 토요일이 아니에요(' + DOW[w] + ') — 본 모임 후보는 토요일만 넣어요');
  });
  CONFIG.weekdayDates.forEach(function (iso) {
    var w = safeDow_(iso);
    if (w === 0 || w === 6) errors.push(iso + ' 는 평일이 아니에요(' + DOW[w] + ')');
    if (w === 1 && !CONFIG.allowMonday) errors.push(iso + ' 는 월요일이에요 — 휴관 여부를 몰라 뺐어요');
  });
  if (!CONFIG.slots.length) errors.push('시간대가 없어요');
  var labels = {};
  CONFIG.slots.forEach(function (s) {
    if (!s.id || !s.label) errors.push('시간대에 id 와 label 이 다 있어야 해요');
    if (labels[s.label]) errors.push('시간대 이름이 겹쳐요: ' + s.label);
    labels[s.label] = true;
  });
  if (CONFIG.districts.indexOf(CONFIG.districtUnknown) < 0) errors.push('구역 선택지에 「' + CONFIG.districtUnknown + '」 이 있어야 해요');
  if (!CONFIG.weekendDates.length) errors.push('토요일 후보가 없어요');
  if (errors.length) throw new Error('CONFIG 를 고쳐 주세요:\n- ' + errors.join('\n- '));
  return true;
}

function safeDow_(iso) {
  try { return dowOf_(iso); } catch (e) { return null; }
}

/* ───────────────────────── 회원에게 보이는 문구 ───────────────────────── */

function texts_() {
  var E = CONFIG.exhibition;
  var dl = deadlineLabel_();
  var an = dateLabel_(CONFIG.announceDate);
  var keep = shortDate_(CONFIG.keepUntil);
  var unsure = E.factsConfirmed ? '' : '로 알려져 있어요(주최 측 확인 중)';
  var hoursNote = E.factsConfirmed ? '' : ' 운영 시간은 주최 측에 확인 중이에요. 바뀌면 톡방에서 알려 드릴게요.';
  var hoursShort = E.factsConfirmed ? '' : ' · 운영 시간 확인 중';
  var phaseNote = E.factsConfirmed ? '' : '(2차 시작일은 확인 중)';
  var p2 = E.phase2Start;
  var p2Prev = prevDay_(p2);
  var noteIsos = Object.keys(CONFIG.noteDates).sort();
  var noteLine = noteIsos.length
    ? noteIsos.map(function (iso) {
        var l = dateLabel_(iso);
        return l + topicParticle_(l) + ' ' + CONFIG.noteDates[iso];
      }).join(', ') + (E.factsConfirmed ? '' : '(날짜 확인 중)') + '이라 ' + CONFIG.noteDatesReason + '.'
    : '';

  var descLines = [
    E.shortTitle + '을 함께 볼 날을 골라 주세요.',
    '',
    '· 전시: ' + E.title + ' (' + E.organizer + ')',
    '· 장소: ' + E.venue + ', ' + E.address + ' (' + E.access + ')',
    '· 관람: ' + E.hours + ', ' + E.fee + unsure,
    '· 사진: ' + dateLabel_(p2Prev) + '까지 1차 ' + E.photosPerPhase + '점, ' + dateLabel_(p2) + '부터 2차 ' + E.photosPerPhase + '점으로 바뀌어요' + phaseNote,
    '· 마감: ' + dl + ' · 결과: ' + an + ' 톡방에서 알려 드려요'
  ];

  return {
    deadline: dl,
    announce: an,
    keepUntil: keep,
    noteLine: noteLine,
    hoursShort: hoursShort,
    formTitle: CONFIG.formTitle,
    sheetTitle: function (v) { return CONFIG.formTitle + ' — 응답(운영진만)' + (v === 'C' ? ' 표' : ''); },
    descriptionA: descLines.concat(['', '1~2분이면 끝나요. 로그인 없이 낼 수 있어요.']).join('\n'),
    descriptionB: descLines.concat(['', '한 화면이라 1분이면 끝나요. 로그인 없이 낼 수 있어요.']).join('\n'),
    name: { title: '이름', help: '톡방 이름도 괜찮아요.' },
    district: { title: '구역 (선택)', help: '같은 이름이 있을 때 구분하려고 여쭤봐요. 모르면 비워 두셔도 돼요.' },
    attend: { title: '10월 관람에 함께하실 수 있나요?', yes: '날짜가 맞으면 갈게요', no: '10월은 어려워요' },
    pageWeekend: { title: '토요일 가능한 시간', help: '오실 수 있는 칸을 모두 골라 주세요. 토요일이 어려우면 비워 두셔도 돼요.' },
    weekendGrid: { title: '토요일 가능한 날짜와 시간', help: '여러 칸 골라도 돼요.' + hoursNote },
    weekdayOk: {
      title: '평일 낮(' + CONFIG.weekdayWindow + ')에 시간이 되시나요?',
      help: (E.factsConfirmed
        ? '전시장이 오후 6시에 닫아 평일 저녁은 어려워요.'
        : '운영 시간이 오후 6시까지로 알려져 있어(확인 중) 평일 저녁은 후보에서 뺐어요.') +
        ' 평일 낮 모임을 하나 더 둘지 보려고 여쭤봐요.',
      yes: '예, 평일 낮도 돼요',
      no: '아니요'
    },
    pageWeekday: { title: '평일 낮 가능한 시간', help: '오실 수 있는 칸을 모두 골라 주세요.' },
    weekdayGrid: { title: '평일 낮 가능한 날짜와 시간', help: '여러 칸 골라도 돼요. ' + noteLine + hoursNote },
    pageEnd: { title: '마무리', help: '거의 다 됐어요.' },
    tea: { title: '관람 뒤 차 한잔도 함께하실래요? (선택)', help: '오시는 분만 골라 주세요.', choices: ['좋아요', '그날 정할게요', '관람만 할게요'] },
    message: { title: '하고 싶은 말 (선택)', help: '가고 싶은 시간이나 부탁하실 것을 편하게 적어 주세요. 이름 말고 다른 개인정보는 적지 말아 주세요.' },
    privacy: {
      title: '개인정보 확인',
      help: '이름과 구역(선택)만 받아요. 응답은 운영진만 보고, 모임이 끝나면(늦어도 ' + keep + ') 지워요.',
      choice: '확인했어요'
    },
    dates: {
      title: '가능한 날짜를 모두 골라 주세요',
      help: '토요일 다음에 평일 낮(' + CONFIG.weekdayWindow + ') 날짜가 이어져요. ' + noteLine,
      weekdaySuffix: ' 평일 낮',
      none: '10월은 어려워요'
    },
    slots: { title: '좋은 시간대 (선택)', help: '고르지 않으면 어느 시간이든 괜찮은 걸로 볼게요.' + hoursNote },
    confirmation: '고맙습니다. 날짜는 ' + an + ' 톡방에서 알려 드릴게요. 바꾸시려면 아래 「응답 수정」 을 누르시거나 톡방 링크로 다시 내 주세요. 마지막 응답으로 셀게요.',
    closed: '마감했어요. 날짜는 ' + an + ' 톡방에서 알려 드릴게요.',
    gridIntro: '빈 줄에 이름을 적고, 갈 수 있는 칸에 ○, 조정할 수 있으면 △ 를 골라 주세요. 남의 줄은 고치지 말아 주세요. ※ 표시한 날은 ' + CONFIG.noteDatesReason + '. 마감 ' + dl + '.'
  };
}

function prevDay_(iso) {
  var p = parseIso_(iso);
  var t = new Date(Date.UTC(p.y, p.m - 1, p.d - 1));
  var mm = ('0' + (t.getUTCMonth() + 1)).slice(-2), dd = ('0' + t.getUTCDate()).slice(-2);
  return t.getUTCFullYear() + '-' + mm + '-' + dd;
}

/** 톡방 안내문. link 자리에 실제 링크(또는 {{링크}}). */
function announceText_(variant, link) {
  var T = texts_();
  var E = CONFIG.exhibition;
  var place = E.shortTitle + '(' + E.venue + ' · 경복궁역 5분)';
  var tail = '마감 ' + T.deadline + ' · 결과 ' + T.announce + ' 이 방에서';
  var open = '링크가 안 열리면 오른쪽 위 ⋮ → 다른 브라우저로 열기를 눌러 주세요.';
  if (variant === 'A') {
    return ['[10월 정기관람 날짜 고르기]',
      place + ' 함께 볼 날을 골라 주세요.',
      '되는 토요일을 고르시고, 평일 낮에 시간 되시는 분은 평일 낮도 골라 주세요.',
      '토요일이 어려우면 평일 낮만 골라도 돼요.',
      '1~2분이면 끝나요. 로그인 없이 열려요.',
      tail, link, open].join('\n');
  }
  if (variant === 'B') {
    return ['[10월 정기관람 날짜 고르기]',
      place + ' 갈 수 있는 날을 모두 골라 주세요.',
      '한 화면이라 1분이면 끝나요. 토요일 다음에 평일 낮(' + CONFIG.weekdayWindow + T.hoursShort + ') 날짜가 이어져요.',
      tail, link, open].join('\n');
  }
  if (variant === 'C') {
    // C 는 회원에게 돌리지 않는다 — 이름이 든 시트 링크를 톡방에 올려야 하기 때문이다.
    throw new Error('버전 C 는 회원 안내문이 없어요(운영진 내부용). 회원에게는 A · B · D 중 하나를 쓰세요.');
  }
  throw new Error('모르는 버전: ' + variant);
}

/** 버전 D — 카톡 투표에 붙여 넣을 글과 항목 */
function buildKakaoPolls_() {
  var T = texts_();
  var E = CONFIG.exhibition;
  var K = CONFIG.kakao;
  var slotItems = CONFIG.slots.map(function (s) { return s.label; });
  var saturdays = weekendSorted_();
  // 토요일 × 시간대가 투표 하나에 들어가면(지금은 3 × 3 = 9칸) 「10/17(토) 오후 3~6시」 처럼 짝을 바로 센다.
  var satCells = [];
  saturdays.forEach(function (iso) { slotItems.forEach(function (l) { satCells.push(dateLabel_(iso) + ' ' + l); }); });
  var satGrid = satCells.length <= K.maxItemsPerPoll;
  // 「어려워요」 는 어느 쪽이든 따로 하나만 고르는 투표로 받는다 — 칸이 넘쳐 나눠도 뜻이 같다.
  var hardPoll = { title: '토요일이 모두 어려우시면', items: ['토요일은 어려워요', '10월은 어려워요'], multiple: false };
  var satPolls = satGrid
    ? [{ title: '토요일 가능한 날짜와 시간', items: satCells }, hardPoll]
    : [
        { title: '토요일 가능한 날짜', items: saturdays.map(dateLabel_) },
        { title: '토요일 좋은 시간대', items: slotItems.slice() },
        hardPoll
      ];
  var weekday = weekdaySorted_();
  var chunks = [];
  for (var i = 0; i < weekday.length; i += K.weekdayChunk) chunks.push(weekday.slice(i, i + K.weekdayChunk));
  var weekdayPolls = chunks.map(function (c, n) {
    var range = shortDate_(c[0]) + '~' + shortDate_(c[c.length - 1]);
    return { title: '평일 낮 날짜 ' + (chunks.length > 1 ? (n + 1) + ' (' + range + ')' : '(' + range + ')'), items: c.map(dateLabel_) };
  });
  weekdayPolls.push({ title: '평일 낮 좋은 시간대', items: slotItems.slice() });
  var posts = [
    {
      key: 'weekend',
      body: ['[10월 정기관람 — 토요일 날짜 투표]',
        E.shortTitle + '(' + E.venue + ' · 경복궁역 5분) 갈 수 있는 토요일과 시간을 모두 골라 주세요.']
        .concat(['토요일이 하나도 안 되시면 「' + hardPoll.title + '」 투표에서 하나만 골라 주세요.'])
        .concat(E.factsConfirmed ? [] : ['운영 시간(' + E.hours + '로 알려짐)은 주최 측에 확인 중이에요.'])
        .concat(['마감 ' + T.deadline + ' · 결과 ' + T.announce + ' 이 방에서']).join('\n'),
      polls: satPolls
    },
    {
      key: 'weekday',
      body: ['[평일 낮에 시간 되시는 분만]',
        '평일 낮(' + CONFIG.weekdayWindow + T.hoursShort + ') 모임을 하나 더 둘지 보려고 해요. 되는 날을 모두 골라 주세요.',
        T.noteLine,
        '마감 ' + T.deadline].join('\n'),
      polls: weekdayPolls
    }
  ];
  posts.forEach(function (p) {
    p.polls.forEach(function (poll) { if (poll.multiple !== false) poll.multiple = true; poll.anonymous = false; });
  });
  return { posts: posts, deadline: T.deadline, limits: K, saturdayGrid: satGrid };
}

/* ───────────────────────── 공개 함수 ───────────────────────── */

function setupBranchForm() { requireScopes_(); return setupForm_('A'); }
function setupSimpleForm() { requireScopes_(); return setupForm_('B'); }

/**
 * 권한 화면에서 체크칸을 하나라도 빼면(세분화 동의) 트리거 만들기 같은 데서 중간에 멈춘다.
 * 그 전에 여기서 모든 권한을 확인한다 — 빠진 것이 있으면 실행을 끝내고 권한을 다시 묻는다.
 */
function requireScopes_() {
  if (typeof ScriptApp.requireAllScopes === 'function') ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
}

function setupSheetGrid() {
  requireScopes_();
  validateConfig_();
  var props = PropertiesService.getScriptProperties();
  var gate = checkExisting_(props, 'C');
  if (gate) return gate;

  var T = texts_();
  var ss = SpreadsheetApp.create(T.sheetTitle('C'));
  var sheet = ss.getSheets()[0];
  sheet.setName(SHEET_GRID);
  var cands = sheetCandidates_();
  var nCols = 2 + cands.length;
  var nEntry = CONFIG.sheetRows + CONFIG.sheetSpareRows;
  var firstEntry = 3, lastEntry = firstEntry + nEntry - 1;
  var countRow = lastEntry + 1;
  ensureSize_(sheet, countRow + 2, nCols);

  var intro = [T.gridIntro];
  for (var i = 1; i < nCols; i++) intro.push('');
  var header = ['이름', '구역'].concat(cands.map(function (c) { return c.header; }));
  sheet.getRange(1, 1, 1, nCols).setValues([intro]);
  sheet.getRange(2, 1, 1, nCols).setValues([header]);

  var marks = CONFIG.sheetMarks;
  var labels = [[marks[0] + ' 가능'], [marks[1] + ' 조정 가능'], [marks[0] + '+' + marks[1]]];
  sheet.getRange(countRow, 1, 3, 1).setValues(labels);
  var f1 = [], f2 = [], f3 = [];
  for (var c = 3; c <= nCols; c++) {
    var L = colLetter_(c);
    var rng = L + firstEntry + ':' + L + lastEntry;
    f1.push('=COUNTIF(' + rng + ',"' + marks[0] + '")');
    f2.push('=COUNTIF(' + rng + ',"' + marks[1] + '")');
    f3.push('=' + L + countRow + '+' + L + (countRow + 1));
  }
  sheet.getRange(countRow, 3, 3, nCols - 2).setFormulas([f1, f2, f3]);

  var markRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(marks, true)
    .setAllowInvalid(false)
    .setHelpText('○ 가능 · △ 조정 가능 · 안 되면 비워 두세요')
    .build();
  sheet.getRange(firstEntry, 3, nEntry, nCols - 2).setDataValidation(markRule);
  var districtRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.districts, true)
    .setAllowInvalid(false)
    .setHelpText('선택이에요. 같은 이름이 있을 때 구분해요.')
    .build();
  sheet.getRange(firstEntry, 2, nEntry, 1).setDataValidation(districtRule);

  styleHeader_(sheet.getRange(2, 1, 1, nCols));
  sheet.getRange(2, 1, 1, nCols).setWrap(true).setHorizontalAlignment('center');
  sheet.getRange(1, 1).setFontWeight('bold');
  sheet.getRange(countRow, 1, 3, nCols).setFontWeight('bold');
  sheet.getRange(firstEntry, 3, nEntry + 3, nCols - 2).setHorizontalAlignment('center');
  sheet.setFrozenRows(2);
  sheet.setFrozenColumns(2);
  sheet.setColumnWidth(1, 90);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidths(3, nCols - 2, 72);

  var guide = ss.insertSheet(SHEET_GUIDE);
  writeGuide_(guide, 'C', { sheet: ss.getUrl() });

  props.setProperties({ VARIANT: 'C', SHEET_ID: ss.getId(), SETUP_DONE: String(Date.now()), META: JSON.stringify({ variant: 'C', candidates: cands.map(function (c) { return c.key; }) }) });
  props.deleteProperty(PROP_FORM_ID);

  Logger.log('버전 C(시트 직접 입력형 — 비권장 · 운영진 내부용)을 만들었어요.');
  Logger.log('시트 링크(운영진만 — 톡방 · 저장소에 올리지 마세요): ' + ss.getUrl());
  Logger.log('회원에게 돌리려면 이름이 든 시트 링크를 톡방에 올려야 해서 개인정보 원칙과 부딪혀요. 회원 투표는 A · B · D 중 하나로 받아 주세요.');
  Logger.log('공유 설정은 바꾸지 않았어요. 운영진끼리만 공유해 주세요(「안내」 시트를 먼저 읽어 주세요).');
  return { status: 'created', variant: 'C', sheetId: ss.getId(), links: { sheet: ss.getUrl() } };
}

function onFormSubmitTally(e) {
  refreshTally();
}

function refreshTally() {
  var lock = null;
  try {
    lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) Logger.log('다른 계산이 끝나지 않아 기다리지 않고 계산해요.');
  } catch (err) {
    lock = null;
  }
  try {
    var props = PropertiesService.getScriptProperties();
    var variant = props.getProperty(PROP_VARIANT);
    if (variant === 'C') {
      Logger.log('버전 C 는 시트의 수식이 바로 세어요. 따로 계산할 것이 없어요.');
      return null;
    }
    var formId = props.getProperty(PROP_FORM_ID);
    var sheetId = props.getProperty(PROP_SHEET_ID);
    if (!formId || !sheetId) {
      Logger.log('아직 만든 폼이 없어요. setupBranchForm 이나 setupSimpleForm 을 먼저 실행해 주세요.');
      return null;
    }
    var form = FormApp.openById(formId);
    var ss = SpreadsheetApp.openById(sheetId);
    var meta = null;
    try { meta = JSON.parse(props.getProperty(PROP_META) || 'null'); } catch (err2) { meta = null; }
    if (!meta || meta.variant !== variant) meta = metaFromConfig_(variant);
    var layout = formLayout_(form, meta);
    var sheet = ss.getSheetByName(SHEET_TALLY) || ss.insertSheet(SHEET_TALLY);
    if (layout.missingEssential.length) {
      // 이름 · 참여 문항을 못 찾으면 조용히 틀리게 세느니 멈춘다(중복 정리가 꺼져 인원이 부풀려진다).
      var msg = '「' + layout.missingEssential.join('」 · 「') + '」 문항을 찾지 못해 취합을 멈췄어요 — 폼 편집기에서 문항 제목을 이 이름으로 되돌린 뒤 refreshTally 를 실행해 주세요(문항을 지웠다면 운영진에게 알려 주세요).';
      Logger.log(msg);
      writeTallyStop_(sheet, variant, msg);
      return { variant: variant, error: msg };
    }
    var records = readRecords_(form, meta, layout);
    var tally = computeTally_(variant, meta, records, layout);
    writeTally_(sheet, tally);
    return tally;
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (err3) {} }
  }
}

function closeForm() {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty(PROP_FORM_ID);
  if (!formId) {
    Logger.log(props.getProperty(PROP_VARIANT) === 'C'
      ? '버전 C 는 폼이 없어요. 시트 공유를 「보기 전용」 으로 바꾸면 입력이 닫혀요.'
      : '닫을 폼이 없어요.');
    return false;
  }
  var T = texts_();
  var form = FormApp.openById(formId);
  form.setCustomClosedFormMessage(T.closed);
  form.setAcceptingResponses(false);
  removeTriggers_(CLOSE_HANDLER, null);
  Logger.log('응답 받기를 껐어요. 다시 켜려면 폼 편집기 「응답」 탭에서 「응답 받기」 를 켜 주세요.');
  refreshTally();
  return true;
}

/* ───────────────────────── 폼 만들기 ───────────────────────── */

function setupForm_(variant) {
  validateConfig_();
  var props = PropertiesService.getScriptProperties();
  var gate = checkExisting_(props, variant);
  if (gate) return gate;
  props.deleteProperty(PROP_SETUP_DONE);

  var T = texts_();
  var form = createForm_(T.formTitle);
  applyFormSettings_(form, T, variant);
  var meta = variant === 'A' ? buildBranchItems_(form, T) : buildSimpleItems_(form, T);
  var publish = publishForm_(form);

  var ss = SpreadsheetApp.create(T.sheetTitle(variant));
  ss.getSheets()[0].setName(SHEET_GUIDE);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  props.setProperties({ VARIANT: variant, FORM_ID: form.getId(), SHEET_ID: ss.getId(), META: JSON.stringify(meta) });
  return finishFormSetup_(props, form, ss, variant, publish, 'created');
}

/**
 * setup 의 뒷부분 — 트리거 · 안내 시트 · 첫 취합 · 로그. 중간에 멈췄으면(SETUP_DONE 없음) 다음 실행이 여기부터 다시 한다.
 * 여러 번 돌려도 트리거가 늘지 않는다.
 */
function finishFormSetup_(props, form, ss, variant, publish, status) {
  var T = texts_();
  if (!ss.getSheetByName(SHEET_RAW)) {
    var raw = findResponseSheet_(ss, form.getId());
    if (raw) raw.setName(SHEET_RAW);
    else Logger.log('응답 시트를 아직 찾지 못했어요. 첫 응답이 들어온 뒤 이름을 「' + SHEET_RAW + '」 로 바꿔 주세요(바꾸지 않아도 취합은 돌아가요).');
  }
  var guide = ss.getSheetByName(SHEET_GUIDE) || ss.insertSheet(SHEET_GUIDE);
  var tallySheet = ss.getSheetByName(SHEET_TALLY) || ss.insertSheet(SHEET_TALLY);

  ensureSubmitTrigger_(form);
  var closeAt = CONFIG.autoCloseAtDeadline ? ensureCloseTrigger_() : null;

  var links = formLinks_(form, ss);
  writeGuide_(guide, variant, links);
  refreshTally();
  ss.setActiveSheet(tallySheet);
  ss.moveActiveSheet(1);
  props.setProperty(PROP_SETUP_DONE, String(Date.now()));

  Logger.log(status === 'resumed'
    ? '버전 ' + variant + '(' + VARIANT_NAMES[variant] + ')의 남은 설정을 마쳤어요.'
    : '버전 ' + variant + '(' + VARIANT_NAMES[variant] + ')을 만들었어요.');
  Logger.log('응답 링크(톡방에 올릴 것): ' + links.respond);
  if (links.short) Logger.log('짧은 링크(휴대폰에서 열리는지 확인한 뒤에만 쓰세요): ' + links.short);
  Logger.log('폼 편집 링크(운영진만): ' + links.edit);
  Logger.log('응답 시트 링크(운영진만 — 톡방 · 저장소에 올리지 마세요): ' + links.sheet);
  Logger.log('게시 상태: ' + (publish.published === null ? '확인 못 함 — 폼 편집기에서 「게시됨」 인지 봐 주세요' : (publish.published ? '게시됨' : '게시 안 됨 — 폼 편집기에서 「게시」 를 눌러 주세요')));
  Logger.log('응답 권한: ' + publish.access);
  if (closeAt) Logger.log('마감 ' + T.deadline + '에 저절로 닫혀요.');
  if (CONFIG.forceNew) Logger.log('CONFIG.forceNew 를 false 로 되돌려 두세요. 그대로 두면 실행할 때마다 새로 만들어요.');
  Logger.log('톡방에 올리기 전에 휴대폰 카톡에서 응답 링크를 한 번 열어 시험 응답을 내 보세요.');
  Logger.log('톡방 안내문:\n' + announceText_(variant, links.respond));
  return { status: status, variant: variant, formId: form.getId(), sheetId: ss.getId(), links: links, publish: publish };
}

function createForm_(title) {
  try {
    return FormApp.create(title, true);
  } catch (e) {
    return FormApp.create(title);
  }
}

function applyFormSettings_(form, T, variant) {
  form.setDescription(variant === 'A' ? T.descriptionA : T.descriptionB);
  form.setCollectEmail(false);
  try {
    if (typeof form.setRequireLogin === 'function') form.setRequireLogin(false);
  } catch (e) {
    // 개인 계정은 로그인 요구 설정 자체가 없다 — 꺼진 것과 같다.
  }
  form.setLimitOneResponsePerUser(false); // 켜면 구글 로그인을 요구한다 — 카톡 인앱에서 막힌다.
  form.setAllowResponseEdits(true);
  form.setShowLinkToRespondAgain(false);
  form.setPublishingSummary(false); // 켜면 다른 사람 이름이 보인다.
  form.setProgressBar(true);
  form.setConfirmationMessage(T.confirmation);
  form.setCustomClosedFormMessage(T.closed);
}

function publishForm_(form) {
  var supports = true;
  try {
    if (typeof form.supportsAdvancedResponderPermissions === 'function') supports = form.supportsAdvancedResponderPermissions();
  } catch (e) { supports = true; }
  if (supports && typeof form.setPublished === 'function') {
    try { form.setPublished(true); } catch (e2) { Logger.log('게시 설정에서 오류: ' + e2.message); }
  }
  if (typeof form.setPublished !== 'function') form.setAcceptingResponses(true);
  var published = null;
  try { if (typeof form.isPublished === 'function') published = form.isPublished(); } catch (e3) { published = null; }
  return { published: published, access: ensureAnyoneCanRespond_(form) };
}

/** Drive 고급 서비스를 켰을 때만 「링크가 있는 모든 사용자」 응답 권한을 확인하고 없으면 만든다. */
function ensureAnyoneCanRespond_(form) {
  var manual = '폼 편집기 오른쪽 위 「게시됨」 → 응답자 관리에서 「링크가 있는 모든 사용자」 인지 봐 주세요.';
  if (typeof Drive === 'undefined' || !Drive || !Drive.Permissions) return '직접 확인 — ' + manual;
  try {
    var res = Drive.Permissions.list(form.getId(), { includePermissionsForView: 'published', fields: 'permissions(id,type,role,view)' });
    var has = (res && res.permissions || []).some(function (p) {
      return p.type === 'anyone' && p.view === 'published' && p.role === 'reader';
    });
    if (has) return '링크가 있는 모든 사용자(확인함)';
    Drive.Permissions.create({ type: 'anyone', view: 'published', role: 'reader' }, form.getId());
    return '링크가 있는 모든 사용자(새로 설정함)';
  } catch (e) {
    return '확인하다 오류(' + e.message + ') — ' + manual;
  }
}

function formLinks_(form, ss) {
  var url = form.getPublishedUrl();
  var shortUrl = '';
  try { if (typeof form.shortenFormUrl === 'function') shortUrl = form.shortenFormUrl(url); } catch (e) { shortUrl = ''; }
  // 짧은 링크는 열리는지 먼저 확인해야 해서 톡방에는 긴 게시 링크를 기본으로 쓴다.
  return { respond: url, short: shortUrl, edit: form.getEditUrl(), sheet: ss.getUrl() };
}

function buildBranchItems_(form, T) {
  var slots = CONFIG.slots;
  var weekend = weekendSorted_(), weekday = weekdaySorted_();
  var name = form.addTextItem().setTitle(T.name.title).setHelpText(T.name.help).setRequired(true);
  var district = form.addListItem().setTitle(T.district.title).setHelpText(T.district.help)
    .setChoiceValues(CONFIG.districts).setRequired(false);
  var attend = form.addMultipleChoiceItem().setTitle(T.attend.title).setRequired(true);

  var pWeekend = form.addPageBreakItem().setTitle(T.pageWeekend.title).setHelpText(T.pageWeekend.help);
  var weekendGrid = form.addCheckboxGridItem().setTitle(T.weekendGrid.title).setHelpText(T.weekendGrid.help)
    .setRows(weekend.map(dateLabel_)).setColumns(slots.map(function (s) { return s.label; }));
  var weekdayOk = form.addMultipleChoiceItem().setTitle(T.weekdayOk.title).setHelpText(T.weekdayOk.help).setRequired(true);

  var pWeekday = form.addPageBreakItem().setTitle(T.pageWeekday.title).setHelpText(T.pageWeekday.help);
  var weekdayGrid = form.addCheckboxGridItem().setTitle(T.weekdayGrid.title).setHelpText(T.weekdayGrid.help)
    .setRows(weekday.map(dateLabel_)).setColumns(slots.map(function (s) { return s.label; }));

  var pEnd = form.addPageBreakItem().setTitle(T.pageEnd.title).setHelpText(T.pageEnd.help);
  var tea = form.addMultipleChoiceItem().setTitle(T.tea.title).setHelpText(T.tea.help)
    .setChoiceValues(T.tea.choices).setRequired(false);
  var message = form.addParagraphTextItem().setTitle(T.message.title).setHelpText(T.message.help).setRequired(false);
  var privacy = form.addCheckboxItem().setTitle(T.privacy.title).setHelpText(T.privacy.help)
    .setChoiceValues([T.privacy.choice]).setRequired(true);

  // 분기: 한 문항 안의 선택지는 모두 갈 곳을 가진다(섞으면 안 된다). 한 페이지에 분기 문항은 하나.
  attend.setChoices([attend.createChoice(T.attend.yes, pWeekend), attend.createChoice(T.attend.no, pEnd)]);
  weekdayOk.setChoices([weekdayOk.createChoice(T.weekdayOk.yes, pWeekday), weekdayOk.createChoice(T.weekdayOk.no, pEnd)]);

  return {
    variant: 'A',
    items: {
      name: name.getId(), district: district.getId(), attend: attend.getId(),
      weekendGrid: weekendGrid.getId(), weekdayOk: weekdayOk.getId(), weekdayGrid: weekdayGrid.getId(),
      tea: tea.getId(), message: message.getId(), privacy: privacy.getId()
    },
    weekendRows: weekend, weekdayRows: weekday,
    slots: slots.map(function (s) { return { id: s.id, label: s.label }; })
  };
}

function buildSimpleItems_(form, T) {
  var weekend = weekendSorted_(), weekday = weekdaySorted_();
  var dateChoices = {};
  var values = [];
  weekend.forEach(function (iso) { var l = dateLabel_(iso); dateChoices[l] = iso; values.push(l); });
  weekday.forEach(function (iso) { var l = dateLabel_(iso) + T.dates.weekdaySuffix; dateChoices[l] = iso; values.push(l); });
  values.push(T.dates.none);

  var name = form.addTextItem().setTitle(T.name.title).setHelpText(T.name.help).setRequired(true);
  var district = form.addListItem().setTitle(T.district.title).setHelpText(T.district.help)
    .setChoiceValues(CONFIG.districts).setRequired(false);
  var dates = form.addCheckboxItem().setTitle(T.dates.title).setHelpText(T.dates.help)
    .setChoiceValues(values).setRequired(true);
  var slots = form.addCheckboxItem().setTitle(T.slots.title).setHelpText(T.slots.help)
    .setChoiceValues(CONFIG.slots.map(function (s) { return s.label; })).setRequired(false);
  var message = form.addParagraphTextItem().setTitle(T.message.title).setHelpText(T.message.help).setRequired(false);
  var privacy = form.addCheckboxItem().setTitle(T.privacy.title).setHelpText(T.privacy.help)
    .setChoiceValues([T.privacy.choice]).setRequired(true);

  return {
    variant: 'B',
    items: { name: name.getId(), district: district.getId(), dates: dates.getId(), slots: slots.getId(), message: message.getId(), privacy: privacy.getId() },
    weekendRows: weekend, weekdayRows: weekday,
    dateChoices: dateChoices, noneChoice: T.dates.none,
    slots: CONFIG.slots.map(function (s) { return { id: s.id, label: s.label }; })
  };
}

/** META 를 잃었을 때 CONFIG 로 다시 만든다(문항은 제목으로 찾는다). */
function metaFromConfig_(variant) {
  var T = texts_();
  var weekend = weekendSorted_(), weekday = weekdaySorted_();
  var meta = { variant: variant, items: {}, weekendRows: weekend, weekdayRows: weekday, slots: CONFIG.slots.slice() };
  if (variant === 'B') {
    meta.dateChoices = {};
    weekend.forEach(function (iso) { meta.dateChoices[dateLabel_(iso)] = iso; });
    weekday.forEach(function (iso) { meta.dateChoices[dateLabel_(iso) + T.dates.weekdaySuffix] = iso; });
    meta.noneChoice = T.dates.none;
  }
  return meta;
}

function titlesByKey_(variant) {
  var T = texts_();
  var base = { name: T.name.title, district: T.district.title, message: T.message.title, privacy: T.privacy.title };
  if (variant === 'A') {
    base.attend = T.attend.title; base.weekendGrid = T.weekendGrid.title; base.weekdayOk = T.weekdayOk.title;
    base.weekdayGrid = T.weekdayGrid.title; base.tea = T.tea.title;
  } else {
    base.dates = T.dates.title; base.slots = T.slots.title;
  }
  return base;
}

/* ───────────────────────── 이미 만든 것 · 트리거 ───────────────────────── */

function checkExisting_(props, variant) {
  var oldVariant = props.getProperty(PROP_VARIANT);
  if (!oldVariant) return null;
  var formId = props.getProperty(PROP_FORM_ID);
  var sheetId = props.getProperty(PROP_SHEET_ID);
  var form = null, ss = null;
  try { if (formId) form = FormApp.openById(formId); } catch (e) { form = null; }
  try { if (sheetId) ss = SpreadsheetApp.openById(sheetId); } catch (e2) { ss = null; }
  var alive = oldVariant === 'C' ? !!ss : !!(form && ss);

  if (!alive) {
    Logger.log('전에 만든 버전 ' + oldVariant + ' 을 열 수 없어요(지웠거나 권한이 없어요). 새로 만들어요.');
    removeTriggers_(TALLY_HANDLER, null);
    removeTriggers_(CLOSE_HANDLER, null);
    props.deleteProperty(PROP_SETUP_DONE);
    return null;
  }
  if (!CONFIG.forceNew) {
    if (oldVariant !== 'C' && form && !props.getProperty(PROP_SETUP_DONE)) {
      // 전 실행이 중간에 멈췄다(예: 권한 화면에서 체크칸을 뺐다). 새로 만들지 않고 남은 설정을 마저 한다.
      Logger.log('전에 버전 ' + oldVariant + ' 을 만들다 멈췄어요. 새로 만들지 않고 남은 설정(트리거 · 자동 마감 · 안내 시트 · 취합)을 마저 해요.');
      if (oldVariant !== variant) Logger.log('요청한 버전 ' + variant + ' 이 아니라 전에 만들던 버전 ' + oldVariant + ' 을 마저 만들어요. 바꾸려면 forceNew 를 쓰세요.');
      return finishFormSetup_(props, form, ss, oldVariant, publishForm_(form), 'resumed');
    }
    if (form) ensureSubmitTrigger_(form);
    Logger.log('이미 만들어 둔 버전 ' + oldVariant + '(' + VARIANT_NAMES[oldVariant] + ')이 있어요. 새로 만들지 않았어요.');
    if (form) Logger.log('응답 링크: ' + form.getPublishedUrl());
    if (ss) Logger.log('시트 링크(운영진만): ' + ss.getUrl());
    Logger.log('버전 ' + variant + ' 을 새로 만들려면 CONFIG.forceNew 를 true 로 바꾸고 다시 실행해 주세요. 전에 만든 폼과 시트는 드라이브에 남아요.');
    return { status: 'exists', variant: oldVariant, requested: variant, formId: formId || null, sheetId: sheetId || null };
  }
  // 새로 만든다 — 전에 만든 폼은 응답 받기를 꺼서 두 곳으로 갈리지 않게 한다.
  if (form) {
    try {
      form.setCustomClosedFormMessage('이 설문은 새 설문으로 바뀌었어요. 톡방의 새 링크로 답해 주세요.');
      form.setAcceptingResponses(false);
      Logger.log('전에 만든 폼의 응답 받기를 껐어요.');
    } catch (e3) {}
  }
  removeTriggers_(TALLY_HANDLER, null);
  removeTriggers_(CLOSE_HANDLER, null);
  props.deleteProperty(PROP_FORM_ID);
  props.deleteProperty(PROP_SHEET_ID);
  props.deleteProperty(PROP_META);
  props.deleteProperty(PROP_VARIANT);
  props.deleteProperty(PROP_SETUP_DONE);
  return null;
}

function ensureSubmitTrigger_(form) {
  var id = form.getId();
  var mine = [];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() !== TALLY_HANDLER) return;
    if (t.getTriggerSourceId() === id) mine.push(t);
    else ScriptApp.deleteTrigger(t);
  });
  for (var i = 1; i < mine.length; i++) ScriptApp.deleteTrigger(mine[i]);
  if (!mine.length) ScriptApp.newTrigger(TALLY_HANDLER).forForm(form).onFormSubmit().create();
}

function ensureCloseTrigger_() {
  removeTriggers_(CLOSE_HANDLER, null);
  var at = deadlineDate_();
  if (at.getTime() <= Date.now()) {
    Logger.log('마감 시각이 이미 지나 자동 마감을 걸지 않았어요.');
    return null;
  }
  ScriptApp.newTrigger(CLOSE_HANDLER).timeBased().at(at).create();
  return at;
}

function removeTriggers_(handler, sourceId) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === handler && (sourceId === null || t.getTriggerSourceId() === sourceId)) ScriptApp.deleteTrigger(t);
  });
}

function findResponseSheet_(ss, formId) {
  for (var round = 0; round < 2; round++) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      var url = null;
      try { url = sheets[i].getFormUrl(); } catch (e) { url = null; }
      if (url && url.indexOf(formId) >= 0) return sheets[i];
    }
    SpreadsheetApp.flush();
  }
  return null;
}

/* ───────────────────────── 취합 ───────────────────────── */

// 이 문항을 못 찾으면 취합을 멈춘다 — 이름이 없으면 중복 정리가 꺼지고, 참여 답이 없으면 아무도 세지 않는다.
var ESSENTIAL_KEYS = { A: ['name', 'attend'], B: ['name', 'dates'] };
// 이 문항을 못 찾으면 위에 경고를 붙이고 센다.
var EXPECTED_KEYS = { A: ['weekendGrid', 'weekdayOk', 'weekdayGrid'], B: ['slots'] };

/**
 * 지금 폼의 문항을 META 의 item id 로, 없으면 제목으로 찾는다.
 * 격자는 지금 폼의 줄 이름(「10/17(토)」)으로 날짜를 맞춘다 — 운영자가 줄을 지우거나 끼워도 날짜가 밀리지 않는다.
 */
function formLayout_(form, meta) {
  var titles = titlesByKey_(meta.variant);
  var all = null;
  var found = {};
  Object.keys(titles).forEach(function (k) {
    var item = null;
    var id = meta.items ? meta.items[k] : null;
    if (id !== undefined && id !== null) {
      try { item = form.getItemById(id); } catch (e) { item = null; }
    }
    if (!item) {
      if (!all) all = form.getItems();
      item = find_(all, function (it) { return it.getTitle() === titles[k]; });
    }
    if (item) found[k] = item;
  });
  var byId = {};
  Object.keys(found).forEach(function (k) { byId[String(found[k].getId())] = k; });

  var notices = [];
  var rows = {}, rowLabels = {};
  if (meta.variant === 'A') {
    [['weekendGrid', meta.weekendRows || []], ['weekdayGrid', meta.weekdayRows || []]].forEach(function (pair) {
      var k = pair[0], isos = pair[1];
      if (!found[k]) return;
      var labels;
      try { labels = found[k].asCheckboxGridItem().getRows(); } catch (e) { return; }
      var isoByLabel = {};
      isos.forEach(function (iso) { isoByLabel[dateLabel_(iso)] = iso; });
      rowLabels[k] = labels;
      rows[k] = labels.map(function (l) { return isoByLabel[String(l).trim()] || null; });
      var same = labels.length === isos.length && rows[k].every(function (iso, i) { return iso === isos[i]; });
      if (!same) {
        var unknown = labels.filter(function (l, i) { return !rows[k][i]; });
        notices.push('폼 편집기에서 「' + titles[k] + '」 의 날짜 줄이 바뀌었어요. 줄 이름으로 날짜를 맞춰 셌어요' +
          (unknown.length ? '(모르는 줄 「' + unknown.join('」 · 「') + '」 은 세지 않았어요)' : '') +
          '. 줄을 바꾸기 전에 낸 응답은 「응답자별 정리」 로 확인해 주세요. 날짜를 빼거나 바꾸려면 폼 편집기에서 줄을 고치지 말고 CONFIG 를 고친 뒤 forceNew 로 새로 만들어 주세요.');
      }
    });
  }
  var missingEssential = (ESSENTIAL_KEYS[meta.variant] || []).filter(function (k) { return !found[k]; }).map(function (k) { return titles[k]; });
  var missingExpected = (EXPECTED_KEYS[meta.variant] || []).filter(function (k) { return !found[k]; }).map(function (k) { return titles[k]; });
  if (missingExpected.length) {
    notices.push('「' + missingExpected.join('」 · 「') + '」 문항을 찾지 못해 그 답은 세지 않았어요. 폼 편집기에서 문항 제목을 이 이름으로 되돌린 뒤 refreshTally 를 실행해 주세요(문항을 지웠다면 운영진에게 알려 주세요).');
  }
  return { byId: byId, rows: rows, rowLabels: rowLabels, notices: notices, missingEssential: missingEssential };
}

function readRecords_(form, meta, layout) {
  var L = layout || formLayout_(form, meta);
  return form.getResponses().map(function (r, idx) {
    var ts = r.getTimestamp();
    var rec = { id: r.getId(), order: idx, ts: ts ? ts.getTime() : 0, answers: {} };
    r.getItemResponses().forEach(function (ir) {
      var key = L.byId[String(ir.getItem().getId())];
      if (key) rec.answers[key] = ir.getResponse();
    });
    return rec;
  });
}

function nfc_(s) {
  return typeof s.normalize === 'function' ? s.normalize('NFC') : s;
}

function normalizeName_(s) {
  var t = String(s == null ? '' : s);
  if (typeof t.normalize === 'function') t = t.normalize('NFC');
  return t.replace(/[\s\u3000\u00a0\u200b\u200c\u200d\ufeff]+/g, '').toLowerCase();
}

function asList_(v) {
  if (v === null || v === undefined || v === '') return [];
  if (Array.isArray(v)) return v.filter(function (x) { return x !== null && x !== undefined && x !== ''; });
  return [v];
}

function candidatesFor_(variant, meta) {
  var out = [];
  var noteDates = CONFIG.noteDates || {};
  function push(iso, kind) {
    if (variant === 'A') {
      meta.slots.forEach(function (s, si) {
        out.push({ key: iso + '|' + s.id, iso: iso, kind: kind, slotId: s.id, slotIndex: si, slotLabel: s.label, note: noteDates[iso] || '' });
      });
    } else {
      out.push({ key: iso, iso: iso, kind: kind, slotId: '', slotIndex: 0, slotLabel: '', note: noteDates[iso] || '' });
    }
  }
  meta.weekendRows.forEach(function (iso) { push(iso, '토요일'); });
  meta.weekdayRows.forEach(function (iso) { push(iso, '평일 낮'); });
  out.sort(function (a, b) { return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : a.slotIndex - b.slotIndex; });
  return out;
}

function entryFromRecord_(variant, meta, rec, T, layout) {
  var a = rec.answers;
  var e = {
    id: rec.id, ts: rec.ts, order: rec.order,
    name: nfc_(String(a.name == null ? '' : a.name)).replace(/^[\s\u3000]+|[\s\u3000]+$/g, '').replace(/[\s\u3000]+/g, ' '),
    districtRaw: typeof a.district === 'string' ? a.district : '',
    status: 'unknown', cells: [], slots: [], tea: '', message: '', warnings: []
  };
  e.normName = normalizeName_(e.name);
  e.district = e.districtRaw && e.districtRaw !== CONFIG.districtUnknown ? e.districtRaw : '';
  e.message = typeof a.message === 'string' ? a.message : '';
  if (!e.normName) e.warnings.push('이름이 비어 있어요');

  if (variant === 'A') {
    var slotByLabel = {};
    meta.slots.forEach(function (s) { slotByLabel[s.label] = s; });
    var LR = (layout && layout.rows) || {}, LL = (layout && layout.rowLabels) || {};
    var weekendCells = gridCells_(a.weekendGrid, LR.weekendGrid || meta.weekendRows, slotByLabel, e.warnings, LL.weekendGrid);
    var weekdayCells = gridCells_(a.weekdayGrid, LR.weekdayGrid || meta.weekdayRows, slotByLabel, e.warnings, LL.weekdayGrid);
    var weekdayOk = a.weekdayOk === T.weekdayOk.yes;
    if (a.attend === T.attend.no) {
      e.status = 'decline';
      if (weekendCells.length || weekdayCells.length) e.warnings.push('「' + T.attend.no + '」 를 골라 고른 칸은 세지 않았어요');
    } else {
      e.status = a.attend === T.attend.yes ? 'attend' : 'unknown';
      if (a.attend !== T.attend.yes) e.warnings.push('참여 문항 답이 없어요');
      e.cells = weekendCells.slice();
      if (weekdayOk) e.cells = e.cells.concat(weekdayCells);
      else if (weekdayCells.length) e.warnings.push('평일 낮 「아니요」 라 평일 칸은 세지 않았어요');
      if (weekdayOk && !weekdayCells.length) e.warnings.push('평일 낮 「예」 인데 평일 칸을 고르지 않았어요');
      if (!e.cells.length) e.warnings.push('고른 칸이 없어요');
    }
    e.weekdayAnswer = typeof a.weekdayOk === 'string' ? a.weekdayOk : '';
    e.tea = typeof a.tea === 'string' ? a.tea : '';
  } else {
    var picked = asList_(a.dates);
    var none = picked.indexOf(meta.noneChoice) >= 0;
    var isos = [];
    picked.forEach(function (label) {
      if (label === meta.noneChoice) return;
      var iso = meta.dateChoices[label];
      if (iso) isos.push(iso);
      else e.warnings.push('모르는 날짜 「' + label + '」 는 세지 않았어요');
    });
    if (none) {
      e.status = 'decline';
      if (isos.length) e.warnings.push('「' + meta.noneChoice + '」 와 날짜를 함께 골라 어려움으로 셌어요');
    } else {
      e.status = isos.length ? 'attend' : 'unknown';
      e.cells = isos;
      if (!isos.length) e.warnings.push('고른 날짜가 없어요');
    }
    var slotByLabel2 = {};
    meta.slots.forEach(function (s) { slotByLabel2[s.label] = s; });
    asList_(a.slots).forEach(function (label) {
      if (slotByLabel2[label]) e.slots.push(slotByLabel2[label].id);
      else e.warnings.push('모르는 시간대 「' + label + '」 는 세지 않았어요');
    });
  }
  var uniq = {};
  e.cells = e.cells.filter(function (k) { if (uniq[k]) return false; uniq[k] = true; return true; });
  return e;
}

/** rowsIso[i] 는 격자 i 번째 줄의 날짜(모르는 줄이면 null). rowLabels 가 있으면 경고에 줄 이름을 적는다. */
function gridCells_(resp, rowsIso, slotByLabel, warnings, rowLabels) {
  var out = [];
  if (!resp || !Array.isArray(resp)) return out;
  for (var i = 0; i < resp.length; i++) {
    var vals = asList_(resp[i]);
    if (!vals.length) continue;
    if (i >= rowsIso.length) { warnings.push('격자에 모르는 줄이 있어 세지 않았어요'); continue; }
    if (!rowsIso[i]) { warnings.push('모르는 날짜 줄 「' + (rowLabels && rowLabels[i] ? rowLabels[i] : (i + 1) + '번째') + '」 는 세지 않았어요'); continue; }
    vals.forEach(function (label) {
      var s = slotByLabel[label];
      if (s) out.push(rowsIso[i] + '|' + s.id);
      else warnings.push('모르는 시간대 「' + label + '」 는 세지 않았어요');
    });
  }
  return out;
}

/** 같은 이름: 구역이 둘 다 있고 다르면 다른 사람, 아니면 가장 늦은 응답 하나만 남긴다. */
function dedupe_(entries) {
  // 같은 시각이면 응답 id 로 가른다 — getResponses() 의 순서는 보장되지 않아 order 로 가르면 실행마다 달라질 수 있다.
  var sorted = entries.slice().sort(function (a, b) {
    var ia = String(a.id), ib = String(b.id);
    return (a.ts - b.ts) || (ia < ib ? -1 : ia > ib ? 1 : 0);
  });
  var groups = {};
  var persons = [];
  sorted.forEach(function (e) {
    var key = e.normName || ('#' + e.id);
    var list = groups[key] || (groups[key] = []);
    var target = null;
    if (e.district) {
      target = find_(list, function (p) { return p.district === e.district; }) ||
        find_(list, function (p) { return !p.district; });
    } else if (list.length) {
      target = list.reduce(function (best, p) { return p.lastTs >= best.lastTs ? p : best; }, list[0]);
      if (list.length > 1) e.warnings.push('구역 없이 낸 응답이라 가장 최근 응답한 같은 이름에 합쳤어요');
    }
    if (target) {
      if (e.ts && e.ts === target.lastTs) e.warnings.push('같은 시각에 낸 응답이 둘이에요 — 어느 쪽이 맞는지 확인해 주세요');
      var district = e.district || target.district;
      var districtRaw = e.district ? e.districtRaw : (target.district ? target.districtRaw : (e.districtRaw || target.districtRaw));
      var dup = target.dupCount + 1;
      var prevWarn = target.mergeWarnings;
      for (var k in e) target[k] = e[k];
      target.district = district;
      target.districtRaw = districtRaw;
      target.dupCount = dup;
      target.mergeWarnings = prevWarn;
      target.lastTs = e.ts;
    } else {
      var p = {};
      for (var k2 in e) p[k2] = e[k2];
      p.dupCount = 0;
      p.mergeWarnings = [];
      p.lastTs = e.ts;
      list.push(p);
      persons.push(p);
    }
  });
  Object.keys(groups).forEach(function (key) {
    var list = groups[key];
    list.forEach(function (p) {
      p.displayName = list.length > 1 ? p.name + '(' + (p.districtRaw || '구역 없음') + ')' : p.name;
      if (!p.normName) p.displayName = '(이름 없음)';
    });
  });
  return persons;
}

function find_(arr, fn) {
  for (var i = 0; i < arr.length; i++) if (fn(arr[i])) return arr[i];
  return null;
}

function koSort_(a, b) { return String(a).localeCompare(String(b), 'ko'); }

function computeTally_(variant, meta, records, layout) {
  var T = texts_();
  var entries = records.map(function (r) { return entryFromRecord_(variant, meta, r, T, layout); });
  var persons = dedupe_(entries);
  var cands = candidatesFor_(variant, meta);
  var byKey = {};
  cands.forEach(function (c) { c.people = []; byKey[c.key] = c; });
  var weekdaySet = {};
  meta.weekdayRows.forEach(function (iso) { weekdaySet[iso] = true; });

  persons.forEach(function (p) {
    if (p.status !== 'attend') return;
    p.cells.forEach(function (k) { if (byKey[k]) byKey[k].people.push(p); });
  });
  cands.forEach(function (c) {
    c.count = c.people.length;
    c.names = c.people.map(function (p) { return p.displayName; }).sort(koSort_);
  });

  var attending = persons.filter(function (p) { return p.status === 'attend' && p.cells.length; });
  var declined = persons.filter(function (p) { return p.status === 'decline'; });
  var noCell = persons.filter(function (p) { return p.status !== 'decline' && !p.cells.length; });
  var weekdayPeople = attending.filter(function (p) {
    return p.cells.some(function (k) { return weekdaySet[k.split('|')[0]]; });
  });
  var lastTs = records.reduce(function (m, r) { return Math.max(m, r.ts || 0); }, 0);

  var ranked = cands.filter(function (c) { return c.count > 0; }).sort(rankCand_);
  var top = ranked.slice(0, 5);

  var weekendC = cands.filter(function (c) { return c.kind === '토요일' && c.count > 0; });
  var weekdayC = cands.filter(function (c) { return c.kind === '평일 낮' && c.count > 0; });
  var pairs = [];
  weekendC.forEach(function (w) {
    weekdayC.forEach(function (d) {
      var both = d.people.filter(function (p) { return w.people.indexOf(p) >= 0; }).length;
      pairs.push({ weekend: w, weekday: d, union: w.count + d.count - both, both: both });
    });
  });
  pairs.sort(function (a, b) {
    return (b.union - a.union) || (b.weekend.count - a.weekend.count) || (b.weekday.count - a.weekday.count) ||
      rankTie_(a.weekend, b.weekend) || rankTie_(a.weekday, b.weekday);
  });

  var slotCounts = null;
  if (variant === 'B') {
    var attendB = attending;
    slotCounts = meta.slots.map(function (s) {
      var ppl = attendB.filter(function (p) { return p.slots.indexOf(s.id) >= 0; });
      return { id: s.id, label: s.label, count: ppl.length, names: ppl.map(function (p) { return p.displayName; }).sort(koSort_) };
    });
    var anyPpl = attendB.filter(function (p) { return !p.slots.length; });
    slotCounts.push({ id: '', label: '고르지 않음(어느 시간이든)', count: anyPpl.length, names: anyPpl.map(function (p) { return p.displayName; }).sort(koSort_) });
  }

  var duplicatesRemoved = persons.reduce(function (s, p) { return s + p.dupCount; }, 0);
  persons.sort(function (a, b) { return koSort_(a.displayName, b.displayName); });

  return {
    variant: variant,
    notices: layout && layout.notices ? layout.notices.slice() : [],
    summary: {
      responses: records.length,
      people: persons.length,
      duplicatesRemoved: duplicatesRemoved,
      attending: attending.length,
      declined: declined.length,
      noCell: noCell.length,
      weekday: weekdayPeople.length,
      lastResponseAt: lastTs ? formatTime_(lastTs) : ''
    },
    candidates: cands,
    top: top,
    pairs: pairs.slice(0, 3),
    slotCounts: slotCounts,
    persons: persons
  };
}

function rankCand_(a, b) { return (b.count - a.count) || rankTie_(a, b); }
function rankTie_(a, b) { return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : a.slotIndex - b.slotIndex; }

function candDate_(c) { return shortDate_(c.iso); }
function candLabel_(c) { return dateLabel_(c.iso) + (c.slotLabel ? ' ' + c.slotLabel : ''); }

function personCells_(p, variant) {
  if (!p.cells.length) return '';
  var byDate = {};
  var order = [];
  p.cells.slice().sort().forEach(function (k) {
    var parts = k.split('|');
    if (!byDate[parts[0]]) { byDate[parts[0]] = []; order.push(parts[0]); }
    if (parts[1]) byDate[parts[0]].push(parts[1]);
  });
  var slotLabel = {};
  CONFIG.slots.forEach(function (s) { slotLabel[s.id] = s.label; });
  return order.map(function (iso) {
    var s = byDate[iso].map(function (id) { return slotLabel[id] || id; });
    return dateLabel_(iso) + (s.length ? ' ' + s.join('·') : '');
  }).join(', ');
}

/* ───────────────────────── 시트 쓰기 ───────────────────────── */

function safeCell_(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function writeTally_(sheet, t) {
  var T = texts_();
  var rows = [];
  var headers = [];
  var sections = [];
  function add(r) { rows.push(r.map(safeCell_)); }
  function header(r) { headers.push(rows.length + 1); add(r); }
  function section(title) { sections.push(rows.length + 1); add([title]); }
  function blank() { add(['']); }
  var empty = t.summary.responses === 0;

  add(['10월 정기관람 취합 — 버전 ' + t.variant + '(' + VARIANT_NAMES[t.variant] + ')']);
  add(['계산한 시각', formatTime_(Date.now()), '응답이 들어올 때마다 다시 계산해요. 이 시트를 직접 고치면 다음 계산 때 지워져요.']);
  if (empty) add(['아직 응답이 없어요. 응답이 들어오면 저절로 채워져요.']);
  (t.notices || []).forEach(function (n) { add(['확인 필요: ' + n]); });
  blank();

  section('요약');
  header(['항목', '값', '설명']);
  var s = t.summary;
  add(['정리된 응답', s.people, '명 · 받은 응답 ' + s.responses + '건 중 중복 ' + s.duplicatesRemoved + '건 정리']);
  add(['참석 가능', s.attending, '명 · 한 칸 이상 고른 분']);
  add(['이번 달 어려움', s.declined, '명']);
  add(['고른 칸 없음', s.noCell, '명 · 참석한다고 했지만 칸을 고르지 않은 분']);
  add(['평일 낮 가능', s.weekday, '명 · 평일 낮 칸을 하나 이상 고른 분']);
  add(['마지막 응답', s.lastResponseAt || '—', '']);
  blank();

  var candHeader = ['날짜', '요일', '갈래', '시간대', '가능 인원', '가능한 사람', '참고'];
  function candRow(c) {
    return [candDate_(c), DOW[dowOf_(c.iso)], c.kind, c.slotLabel || '(시간대 따로)', c.count, c.names.join(', '), c.note ? c.note + ' — 쉴 수 있어요' : ''];
  }

  section('인원 많은 후보 (위 5개)');
  header(['순위'].concat(candHeader));
  if (!t.top.length) add(['', '아직 고른 칸이 없어요.']);
  t.top.forEach(function (c, i) { add([i + 1].concat(candRow(c))); });
  blank();

  section('두 번 나눠 간다면 (토요일 하나 + 평일 낮 하나)');
  header(['순위', '토요일 후보', '평일 낮 후보', '둘 중 하나라도', '토요일 후보 인원', '평일 낮 후보 인원', '둘 다 가능', '설명']);
  if (!t.pairs.length) add(['', '평일 낮 후보를 고른 분이 없어 조합이 없어요.']);
  t.pairs.forEach(function (p, i) {
    add([i + 1, candLabel_(p.weekend), candLabel_(p.weekday), p.union, p.weekend.count, p.weekday.count, p.both,
      '두 모임 중 하나라도 올 수 있는 분 ' + p.union + '명']);
  });
  blank();

  section('전체 후보 (날짜순)');
  header(candHeader);
  t.candidates.forEach(function (c) { add(candRow(c)); });
  blank();

  if (t.slotCounts) {
    section('시간대별 (참석 가능한 분 기준)');
    header(['시간대', '고른 사람', '이름']);
    t.slotCounts.forEach(function (sc) { add([sc.label, sc.count, sc.names.join(', ')]); });
    blank();
  }

  section('응답자별 정리');
  header(['이름', '구역', '참여', '평일 낮', '고른 칸 수', '고른 칸', '차 한잔', '하고 싶은 말', '중복 정리', '확인 필요', '마지막 응답']);
  if (!t.persons.length) add(['아직 응답이 없어요.']);
  t.persons.forEach(function (p) {
    var weekdayCol = t.variant === 'A' ? (p.weekdayAnswer === T.weekdayOk.yes ? '가능' : (p.weekdayAnswer ? '아니요' : '')) :
      (p.cells.some(function (k) { return meta_isWeekday_(k); }) ? '가능' : '');
    var status = p.status === 'attend' ? '갈게요' : p.status === 'decline' ? '어려워요' : '확인 필요';
    var slotsText = t.variant === 'B' && p.slots.length ? ' / 시간대 ' + p.slots.map(function (id) { return slotLabelOf_(id); }).join('·') : '';
    add([p.displayName, p.districtRaw, status, weekdayCol, p.cells.length, personCells_(p, t.variant) + slotsText, p.tea, p.message,
      p.dupCount ? '중복 ' + p.dupCount + '건 정리' : '', p.warnings.concat(p.mergeWarnings || []).join(' / '), formatTime_(p.ts)]);
  });

  var width = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 1);
  rows = rows.map(function (r) { while (r.length < width) r.push(''); return r; });

  sheet.clear();
  ensureSize_(sheet, rows.length + 1, width);
  sheet.getRange(1, 1, rows.length, width).setValues(rows);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold');
  sections.forEach(function (r) { sheet.getRange(r, 1, 1, width).setFontWeight('bold'); });
  headers.forEach(function (r) { styleHeader_(sheet.getRange(r, 1, 1, width)); });
  sheet.setFrozenRows(1);
  var widths = [110, 90, 80, 90, 80, 260, 90, 200, 90, 220, 90];
  for (var c = 1; c <= width; c++) sheet.setColumnWidth(c, widths[c - 1] || 100);
  sheet.getRange(1, 1, rows.length, width).setWrap(true).setVerticalAlignment('top');
}

/** 취합을 멈출 때 — 틀린 숫자 대신 무엇을 고쳐야 하는지만 남긴다. */
function writeTallyStop_(sheet, variant, msg) {
  var rows = [
    ['10월 정기관람 취합 — 버전 ' + variant + '(' + VARIANT_NAMES[variant] + ')'],
    ['계산한 시각: ' + formatTime_(Date.now())],
    [msg],
    ['그전까지 받은 응답은 폼에 그대로 남아 있어요. 고친 뒤 refreshTally 를 실행하면 다시 채워져요.']
  ];
  sheet.clear();
  ensureSize_(sheet, rows.length + 1, 1);
  sheet.getRange(1, 1, rows.length, 1).setValues(rows.map(function (r) { return [safeCell_(r[0])]; }));
  sheet.getRange(1, 1, 3, 1).setFontWeight('bold');
  sheet.setColumnWidth(1, 720);
  sheet.getRange(1, 1, rows.length, 1).setWrap(true);
}

function meta_isWeekday_(key) {
  return CONFIG.weekdayDates.indexOf(key.split('|')[0]) >= 0;
}

function slotLabelOf_(id) {
  var s = find_(CONFIG.slots, function (x) { return x.id === id; });
  return s ? s.label : id;
}

function styleHeader_(range) {
  range.setFontWeight('bold').setBackground(CONFIG.headerColor).setFontColor(CONFIG.headerFontColor);
}

function ensureSize_(sheet, rows, cols) {
  var maxR = sheet.getMaxRows(), maxC = sheet.getMaxColumns();
  if (rows > maxR) sheet.insertRowsAfter(maxR, rows - maxR);
  if (cols > maxC) sheet.insertColumnsAfter(maxC, cols - maxC);
}

function colLetter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function sheetCandidates_() {
  var out = [];
  function push(iso, kind) {
    CONFIG.slots.forEach(function (s) {
      var mark = CONFIG.noteDates[iso] ? ' ※' : '';
      out.push({ key: iso + '|' + s.id, iso: iso, kind: kind, header: dateLabel_(iso) + mark + '\n' + s.label });
    });
  }
  weekendSorted_().forEach(function (iso) { push(iso, '토요일'); });
  weekdaySorted_().forEach(function (iso) { push(iso, '평일 낮'); });
  return out;
}

function writeGuide_(sheet, variant, links) {
  var T = texts_();
  var E = CONFIG.exhibition;
  var lines = [
    ['안내 — 버전 ' + variant + '(' + VARIANT_NAMES[variant] + (variant === 'C' ? ' — 비권장 · 운영진 내부용' : '') + ')'],
    [variant === 'C'
      ? '이 표는 운영진만 써요. 회원에게 돌리려면 이름이 든 시트 링크를 톡방에 올려야 해서 「응답 시트는 운영진만 보고 링크를 톡방에 올리지 않는다」 는 원칙과 부딪혀요. 회원 투표는 A · B · D 중 하나로 받아 주세요.'
      : '이 스프레드시트는 운영진만 봐요. 시트 링크를 톡방 · 저장소 · 다른 곳에 올리지 마세요.'],
    ['받는 것은 이름과 구역(선택)뿐이에요. 직업 · 연락처 · 이메일은 받지 않아요.'],
    ['보관: 모임이 끝나면, 늦어도 ' + T.keepUntil + ' 까지 이 스프레드시트' + (variant === 'C' ? '를' : '와 폼을') + ' 지우고 휴지통도 비워 주세요.'],
    ['마감 ' + T.deadline + ' · 결과 ' + T.announce + ' 톡방']
  ];
  if (variant === 'C') {
    lines.push(['「' + SHEET_GRID + '」: 운영진이 직접 ○ · △ 를 고르는 표예요. 아래 세 줄이 칸별 인원을 세요.']);
    lines.push(['단점 1: 휴대폰 웹 브라우저(카톡 인앱 포함)에서는 고칠 수 없어요. 구글 시트 앱과 구글 로그인이 필요해요.']);
    lines.push(['단점 2: 「링크가 있는 사용자 — 편집자」 로 열면 누구나 남의 줄을 지우거나 바꿀 수 있어요. 버전 기록(파일 → 버전 기록)으로 되돌릴 수 있어요.']);
    lines.push(['단점 3: 편집하는 사람의 구글 계정 이름이 다른 편집자에게 보일 수 있어요.']);
    lines.push(['공유 설정은 스크립트가 바꾸지 않았어요. 오른쪽 위 「공유」 에서 운영진만 넣어 주세요(「링크가 있는 사용자」 로 열지 마세요). 다 쓴 뒤에는 「보기 전용」 으로 바꿔 주세요.']);
  } else {
    lines.push(['「' + SHEET_RAW + '」: 구글 폼이 채워요. 직접 고치지 마세요.']);
    lines.push(['「' + SHEET_TALLY + '」: 응답이 들어올 때마다 다시 계산해요. 직접 고친 내용은 지워져요. 바로 다시 계산하려면 스크립트에서 refreshTally 를 실행해 주세요.']);
    lines.push(['같은 이름이 여러 번이면 가장 늦은 응답 하나만 세요. 구역이 서로 다르게 적혀 있으면 다른 사람으로 봐요.']);
    lines.push(['같은 이름 · 같은 구역의 동명이인은 구분하지 못해요. 「응답자별 정리」 의 「중복 정리」 를 보고 확인해 주세요.']);
    lines.push(['날짜를 빼거나 바꾸려면 폼 편집기에서 격자 줄 · 선택지를 고치지 말고 스크립트의 CONFIG 를 고친 뒤 forceNew 로 새로 만들어 주세요.']);
    lines.push(['마감하려면 closeForm 을 실행해 주세요.' + (CONFIG.autoCloseAtDeadline ? ' 마감 시각에 저절로도 닫혀요.' : '')]);
    if (links && links.respond) lines.push(['응답 링크: ' + links.respond]);
    if (links && links.edit) lines.push(['폼 편집: ' + links.edit]);
  }
  lines.push(['확인 필요(공식 출처 없음): 운영 시간(' + E.hours + '), 월요일 · 사진 교체일(' + Object.keys(CONFIG.noteDates).sort().map(shortDate_).join(' · ') + ') 휴관, 관람료(' + E.fee + ').']);
  lines.push(['단체 입장: 30명이 한꺼번에 들어갈 수 있는지 몰라요. 같은 건물 대관 정원이 20명이라 두 조로 나누거나 미리 물어봐 주세요.']);
  lines.push(['가는 길: 기사마다 경복궁역 3번 · 4번 출구로 달라요. 공지에는 「' + E.access + '」 만 적고, 출구는 걸어 보고 정해 주세요.']);
  lines.push(['함께봄 카카오톡 채널에 운영 시간 · 휴관일 · 단체 관람을 물어보면 대부분 풀려요.']);
  sheet.clear();
  sheet.getRange(1, 1, lines.length, 1).setValues(lines.map(function (r) { return [safeCell_(r[0])]; }));
  sheet.getRange(1, 1).setFontWeight('bold');
  sheet.setColumnWidth(1, 720);
  sheet.getRange(1, 1, lines.length, 1).setWrap(true);
}
