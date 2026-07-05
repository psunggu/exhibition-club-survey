# 전시 및 공연 동호회 모바일 설문 시스템

이 패키지는 다음 구성을 빠르게 만들기 위한 Codex 작업용 기본 파일입니다.

- 모바일 안내 페이지 1개
- Google Form 2개
  - 7월 정기 관람 참석 설문
  - 전시·공연 추천 설문
- Google Sheet 1개
  - 운영 관리 및 응답 저장

## 전체 구조

```text
public/
  index.html       # 모바일 안내 페이지
  styles.css       # 모바일 스타일
  config.js        # Google Form 링크 설정
apps-script/
  Code.gs          # Google Form 2개 + Google Sheet 1개 생성 스크립트
docs/
  CODEX_TASK.md    # Codex에게 줄 작업 지시서
  kakao_notice.md  # 단톡방 공지문
  privacy_notice.md
  google_form_questions.md
  google_sheet_schema.md
sheets/
  attendance_sample.csv
  recommendation_sample.csv
```

## 추천 진행 순서

1. GitHub에 새 저장소를 만든다.
2. 이 패키지 파일을 저장소에 업로드한다.
3. Codex에게 `docs/CODEX_TASK.md` 내용을 작업 지시로 전달한다.
4. Google Apps Script에서 `apps-script/Code.gs`를 실행해 Google Form 2개와 Sheet 1개를 생성한다.
5. 생성된 Form 링크 2개를 `public/config.js`에 넣는다.
6. `public/index.html`을 GitHub Pages, Vercel, Netlify 중 하나로 배포한다.
7. 단톡방에는 모바일 안내 페이지 링크와 공지문을 공유한다.

## 운영 원칙

처음부터 완성된 시스템을 목표로 하지 않고, 7월 정기 관람을 실제로 한 번 운영하면서 필요한 항목을 보완합니다.
