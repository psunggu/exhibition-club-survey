# 다음 작업 후보 — 자세히

`AGENTS.md` 「다음 작업 후보」 의 자세한 내용이다. `AGENTS.md` 는 세션을 열 때마다 통째로 읽혀서 거기에는 한 줄씩만 두고, 확인 방법 · 진행 기록은 여기에 둔다(2026-10-06). 그 일을 할 때만 연다.

- 후보를 더하거나 바꾸면 `AGENTS.md` 의 한 줄과 여기를 함께 고친다. 끝난 항목은 지우고 근거는 `docs/HISTORY.md` 로 보낸다.
- 공개 저장소다 — 실명 · 방 이름 · 응답 시트 · 폼 편집 링크를 적지 않는다.

## 10월 정기관람 날짜 — 10/8 확정

구글 폼(`date-survey.gs` 분기형, 구역 필수)이 10/7(수) 23시 무렵 저절로 닫힌다(10/6 에 마감을 10/10 에서 당기고 구역을 필수로 바꿨다 — 링크 · 응답은 그대로). 달력 「조율 중」 에 `october-visit` 가 있다. 10/8 「취합」(이름 없이 숫자만 보려면 Apps Script 의 `logSummary`)으로 토요일 본 모임(+ 평일 낮 모임을 둘지)을 정해 톡방에 알리고 `/meetup` — `TENTATIVE` 의 `october-visit` 를 빼고 `MEETUPS` 에 `october-regular`, `meetingBrief.ts` `BRIEFS` 맨 앞에 요약. 보드에는 10/6 에 넣었다(서울 「추천 전시」 1번, `recommended_rank` 0 — 이 표는 순서 값 순 10건만 보이니 순서 값 없이 넣으면 안 보인다). 운영 시간 10~18시 · 무료는 운영자가 함께봄에 확인했다. 휴관일(같은 곳 봄 전시는 월요일 휴관) · 30명 단체 입장(같은 한옥 대관 정원 20명)은 아직이다. 날짜가 정해지면 그 줄의 `recommendation` 을 「10월 정기관람으로 확정된 전시입니다 — … 집결」 꼴로 바꾼다(`docs/OPERATIONS.md` 3번). 폼은 고치지 않는다 — 운영 시간이 달라도 결과를 볼 때 감안한다(`forceNew` 는 링크를 바꾸고 응답을 가른다). 모임 뒤(늦어도 10/31) 폼 · 응답 시트를 지우고 휴지통 비우기 · 트리거 삭제.

## 새벽 배치 잠자기 — caffeinate 로는 안 됨

- 문제: 맥이 배터리로 잠든 채 launchd 배치가 DarkWake 몇 초씩만 나아가 몇 시간씩 늘어진다(9/28 재확인 6시간 41분).
- 10/4 에 모든 작업을 `caffeinate -i -s` 로 감쌌다(`scripts/install-launchd.sh` 두 저장소). **효과가 없었다** — 10/5 재확인이 06:05 에 시작해 13:56 에 끝났다(7시간 51분). 전원 기록: 배터리, 깰 때마다 20초 안팎 뒤 `Entering Sleep state due to 'Maintenance Sleep'`. DarkWake 에서 다시 드는 유지 보수 잠은 `-i` 가 막지 못하고, `-s` 는 전원 연결 때만 듣는다.
- 남은 길: ① 새벽에 맥을 완전히 깨우기 — `sudo pmset repeat wakeorpoweron MTWRFSU 02:25:00`(관리자 암호 — 사람이 실행. 덮개를 닫은 채로도 완전히 깨는지는 시험해 봐야 한다) ② 밤에 전원 연결(그때는 `-s` 가 시스템 잠을 막는다) ③ 배치 시각을 맥을 쓰는 시간대로 옮기기. 10/7(수) 05:00 영화 배치 시간도 함께 본다.

## 정리봇 갈래 첫 실측

다음 카톡 저장 때 요약에 `kind`(모임 · 정보)가 붙는지, 회원이 나눈 전시 안내가 사이트에 「전시 정보」 로, 공지문에 `[전시 정보]` 로 나오고 ICS 에서 빠지는지 본다(kakao-digest#22 · #221). 기간 전시는 종료일 칸이 없어 이미 끝난 전시도 실릴 수 있다 — 실측에서 보이면 요약 스키마에 종료일을 더할지 정한다.

## 운영자 암호 재설정 확인

(10/4 운영자: 나중에) SQL Editor 에서 `select left(password_hash, 7), count(*) from public.survey_admins group by 1` 이 모두 `$2a$10$` 인지 본다. 아니면 `supabase/migrations/202608200001d_admin_password.template.sql` 을 채워 다시 정한다. 채운 파일은 저장하지 않는다.

## 옛 PC 작업 스케줄러 해제

옛 Windows PC 를 켜서 `ExhibitionClub-*` · `KakaoWeeklyDigest` · `KakaoDigest-StoreBackup` 을 한 줄 명령으로 지운다(`docs/OPERATIONS.md` 「자동화 구성」). 등록된 채 켜면 맥과 겹쳐 PR 이 두 번 열린다. 저장소의 `*.ps1` 은 10/4 에 지웠다.

## 잠긴 표 백업

매일 백업이 `events` · `surveys` · `survey_options` 를 받는다(2026-10-04). Supabase 는 무료 요금제라 자체 백업이 없다. 잠긴 표 `admin_guides` · `survey_notes` 는 익명 키로 못 읽어 빠져 있다 — 운영자가 원문을 따로 보관할지, 운영자 암호를 쓰는 손 백업 절차를 둘지 정한다(명부 · 응답 표는 제외).

## 꺼 둔 설문 코드 존폐

`selfSurvey: false` 로 꺼 둔 응답 · 설문 관리 코드(`Survey.tsx` · `SurveyAdmin.tsx` · `lib/survey.ts` · `scripts/self-survey-config.mjs`, 3,288줄)와 명부 보관을 지울지 둘지 정한다. `Survey.tsx` · `lib/survey.ts` 는 결과 화면도 그려 응답 · 만들기 부분만 걷어내는 일이다. 한 번도 가동하지 않은 `app/apps-script/Code.gs` 는 따로 먼저 지울 수 있다(`date-survey.gs` 는 쓴다).

## 넓은 화면의 보드 폭

창 700px 이상에서 보드 본문은 넓게 퍼지고 띠 칸은 가운데 552px 라 왼쪽 끝이 안 맞는다. 휴대폰에서는 드러나지 않아 보류(2026-09-27 운영자 확인).
