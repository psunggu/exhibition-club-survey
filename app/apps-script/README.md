# Google Apps Script 사용 방법

1. https://script.google.com 에 접속합니다.
2. 새 프로젝트를 만듭니다.
3. `Code.gs` 내용을 붙여넣습니다.
4. 함수 선택에서 `setupClubSurveySystem`을 고릅니다.
5. 실행 버튼을 누르고 Google 권한을 승인합니다.
6. 실행이 완료되면 새 Google Sheet와 Google Form 2개가 생성됩니다.
7. 생성된 Sheet의 `설정` 시트에서 다음 링크를 확인합니다.
   - 운영 관리 Sheet URL
   - 7월 참석 설문 응답 URL
   - 전시·공연 추천 설문 응답 URL
8. 응답 URL 2개를 `public/config.js`에 입력합니다.
