# 전시 및 공연 동호회 모바일 설문 시스템

전시 및 공연 동호회의 7월 정기 관람 안내, 참석 설문, 전시·공연 추천 설문을 빠르게 배포하기 위한 패키지입니다.

## 구성

```text
public/
  index.html       # 모바일 안내 페이지
  styles.css       # 모바일 우선 스타일
  config.js        # Google Form 응답 URL 설정
apps-script/
  Code.gs          # Google Form 2개 + Google Sheet 1개 생성 스크립트
docs/
  CODEX_TASK.md
  kakao_notice.md
  privacy_notice.md
  google_form_questions.md
  google_sheet_schema.md
sheets/
  attendance_sample.csv
  recommendation_sample.csv
```

## 1. Google Form과 Sheet 만들기

1. [Google Apps Script](https://script.google.com/)에 접속합니다.
2. 새 프로젝트를 만듭니다.
3. `apps-script/Code.gs` 전체 내용을 붙여넣습니다.
4. 상단 함수 선택에서 `setupClubSurveySystem`을 선택합니다.
5. 실행 버튼을 누르고 Google 권한을 승인합니다.
6. 실행이 끝나면 Google Sheet 1개와 Google Form 2개가 생성됩니다.
7. 생성된 Sheet의 `설정` 시트에서 아래 두 값을 확인합니다.
   - `7월 참석 설문 응답 URL`
   - `전시·공연 추천 설문 응답 URL`

응답자는 "응답 URL"로 들어가야 합니다. "편집 URL"은 운영진만 사용하는 관리 링크입니다.

## 2. Form 링크 넣기

`public/config.js`에서 아래 두 줄만 바꿉니다.

```js
window.CLUB_CONFIG = {
  attendanceFormUrl: "7월 참석 설문 응답 URL",
  recommendFormUrl: "전시·공연 추천 설문 응답 URL",
  kakaoContactText: "문의는 카카오톡 단톡방에서 운영진에게 남겨 주세요.",
  lastUpdated: "2026-07-05"
};
```

`public/index.html`에는 Form URL을 직접 넣지 않습니다. 이후 Form 링크가 바뀌어도 `config.js`만 수정하면 버튼 링크가 함께 바뀝니다.

## 3. 로컬 확인

`public/index.html` 파일을 브라우저로 열어 모바일 안내 페이지가 보이는지 확인합니다.

확인할 항목:

- 상단에 참석 투표 버튼과 추천 버튼이 보이는지
- 주말 관람과 평일 관람 정보가 명확한지
- 참고 링크 카드가 열리는지
- 개인정보 안내 문구가 보이는지
- `config.js`에 URL을 넣었을 때 버튼이 해당 Google Form으로 이동하는지

## 4. GitHub Pages 배포

1. GitHub 저장소에 이 패키지를 업로드합니다.
2. 저장소에서 `Settings`로 이동합니다.
3. 왼쪽 메뉴에서 `Pages`를 선택합니다.
4. `Build and deployment`의 Source를 `Deploy from a branch`로 선택합니다.
5. Branch는 `main`, 폴더는 `/root`를 선택합니다.
6. 배포 후 아래 형태의 URL을 엽니다.

```text
https://<GitHub아이디>.github.io/<저장소명>/exhibition_club_codex_package/public/
```

현재 저장소 기준 예상 URL은 다음과 같습니다.

```text
https://psunggu.github.io/exhibition-club-survey/exhibition_club_codex_package/public/
```

GitHub Pages는 `public` 폴더를 사이트 루트로 직접 지정할 수 없습니다. 더 짧은 URL이 필요하면 `public/index.html`, `public/styles.css`, `public/config.js`를 저장소 루트나 `docs` 폴더로 옮긴 뒤 Pages 설정을 맞춰 주세요.

## 5. Vercel 배포

1. [Vercel](https://vercel.com/)에 로그인합니다.
2. `Add New` > `Project`를 선택합니다.
3. GitHub 저장소를 연결합니다.
4. 프로젝트 설정에서 Root Directory를 `exhibition_club_codex_package/public`으로 지정합니다.
5. Framework Preset은 `Other` 또는 정적 사이트 기본값을 사용합니다.
6. Build Command는 비워 두고, Output Directory도 비워 둡니다.
7. Deploy를 누른 뒤 생성된 URL을 모바일에서 확인합니다.

Vercel을 쓰면 이 패키지의 `public` 폴더를 그대로 사이트 루트로 배포할 수 있어 가장 간단합니다.

## 6. 카카오톡 단톡방 공유

1. 배포된 모바일 안내 페이지 URL을 복사합니다.
2. `docs/kakao_notice.md`의 공지문을 단톡방 상황에 맞게 조금 수정합니다.
3. 공지문 안의 `[모바일 안내 페이지 링크 또는 Google Form 링크]` 자리에 배포 URL을 넣습니다.
4. 단톡방에는 Google Form 개별 링크보다 모바일 안내 페이지 링크 하나를 우선 공유합니다.

공유 전에는 반드시 휴대폰에서 버튼 두 개가 정상 동작하는지 확인해 주세요.

## 운영 원칙

- 개인정보는 이름, 카카오톡 이름, 참석 가능 일정, 추천 전시 정보, 기타 의견 정도로 최소 수집합니다.
- 전화번호, 주소, 생년월일은 수집하지 않습니다.
- 결제 기능과 로그인 기능은 포함하지 않습니다.
- 첫 버전은 7월 정기 관람을 실제로 운영하는 데 필요한 범위만 유지합니다.
