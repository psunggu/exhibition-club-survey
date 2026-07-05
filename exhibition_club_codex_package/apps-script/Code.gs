/**
 * 전시 및 공연 동호회 모바일 설문 시스템 생성 스크립트
 *
 * 사용 방법:
 * 1. https://script.google.com 접속
 * 2. 새 프로젝트 생성
 * 3. 이 파일 내용을 Code.gs에 붙여넣기
 * 4. setupClubSurveySystem() 실행
 * 5. 권한 승인
 * 6. 실행 로그 또는 생성된 Sheet의 [설정] 시트에서 링크 확인
 */

function setupClubSurveySystem() {
  const clubName = '전시 및 공연 동호회';
  const monthLabel = '2026년 7월';

  const spreadsheet = SpreadsheetApp.create(`${clubName} 운영 관리 시트`);
  const spreadsheetId = spreadsheet.getId();

  setupBaseSheets_(spreadsheet);

  const attendanceForm = createAttendanceForm_(clubName, monthLabel, spreadsheetId);
  const recommendForm = createRecommendForm_(clubName, spreadsheetId);

  const settings = spreadsheet.getSheetByName('설정');
  settings.appendRow(['항목', '값']);
  settings.appendRow(['운영 관리 Sheet URL', spreadsheet.getUrl()]);
  settings.appendRow(['7월 참석 설문 응답 URL', attendanceForm.getPublishedUrl()]);
  settings.appendRow(['7월 참석 설문 편집 URL', attendanceForm.getEditUrl()]);
  settings.appendRow(['전시·공연 추천 설문 응답 URL', recommendForm.getPublishedUrl()]);
  settings.appendRow(['전시·공연 추천 설문 편집 URL', recommendForm.getEditUrl()]);
  settings.autoResizeColumns(1, 2);

  Logger.log('운영 관리 Sheet URL: ' + spreadsheet.getUrl());
  Logger.log('7월 참석 설문 응답 URL: ' + attendanceForm.getPublishedUrl());
  Logger.log('전시·공연 추천 설문 응답 URL: ' + recommendForm.getPublishedUrl());
}

function setupBaseSheets_(spreadsheet) {
  const defaultSheet = spreadsheet.getSheets()[0];
  defaultSheet.setName('대시보드');
  defaultSheet.getRange('A1').setValue('전시 및 공연 동호회 운영 대시보드');
  defaultSheet.getRange('A3').setValue('사용 방법');
  defaultSheet.getRange('A4').setValue('1. [설정] 시트에서 생성된 Google Form 링크를 확인합니다.');
  defaultSheet.getRange('A5').setValue('2. Form 응답이 쌓이면 응답 시트가 자동 생성됩니다.');
  defaultSheet.getRange('A6').setValue('3. 참석자 집계와 추천 전시는 월별로 확인합니다.');
  defaultSheet.autoResizeColumns(1, 4);

  const members = spreadsheet.insertSheet('회원 메모');
  members.appendRow(['이름', '카카오톡 이름', '관심 분야', '주말 가능 여부', '평일 가능 여부', '비고']);
  members.setFrozenRows(1);
  members.autoResizeColumns(1, 6);

  const monthly = spreadsheet.insertSheet('월별 운영 기록');
  monthly.appendRow(['월', '정기 관람 전시', '주말 관람일', '평일 관람일', '참석자 수', '후기 공유 여부', '비고']);
  monthly.appendRow(['2026-07', '퐁피두센터 한화 63빌딩 《큐비스트》', '2026-07-11 16:00', '2026-07-29 19:00', '', '', '첫 정기 관람']);
  monthly.setFrozenRows(1);
  monthly.autoResizeColumns(1, 7);

  const candidates = spreadsheet.insertSheet('전시 후보 수동 기록');
  candidates.appendRow(['추천일', '추천자', '전시/공연명', '장소', '기간', '관람료', '추천 이유', '관련 링크', '투표 여부', '비고']);
  candidates.setFrozenRows(1);
  candidates.autoResizeColumns(1, 10);

  spreadsheet.insertSheet('설정');
}

function createAttendanceForm_(clubName, monthLabel, spreadsheetId) {
  const form = FormApp.create(`${clubName} - ${monthLabel} 정기 관람 참석 설문`);
  form.setDescription(
    `${monthLabel} 정기 관람 참석 가능 일정을 확인하기 위한 설문입니다.\n` +
    `이번 달 정기 관람은 퐁피두센터 한화 63빌딩 《큐비스트》입니다.\n` +
    `응답은 동호회 운영 목적으로만 사용합니다.`
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(true);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheetId);

  form.addTextItem()
    .setTitle('이름')
    .setRequired(true);

  form.addTextItem()
    .setTitle('카카오톡 이름')
    .setHelpText('단톡방 이름과 다르면 확인을 위해 적어주세요.')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('참석 가능한 일정')
    .setChoiceValues([
      '7.11.(토) 16:00 / 28,000원',
      '7.29.(수) 19:00 / 14,000원 / 문화의날 50% 할인',
      '둘 다 가능',
      '이번 달은 참석 어려움'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('관람 후 티타임 가능 여부')
    .setChoiceValues(['가능', '어려움', '당일 상황 보고 결정'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('티켓 비용 확인')
    .setChoiceValues(['확인했습니다'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('기타 의견')
    .setHelpText('일정, 티켓, 티타임 관련 의견이 있으면 적어주세요.')
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('개인정보 수집 및 이용 동의')
    .setChoiceValues(['동호회 운영을 위한 이름, 카카오톡 이름, 참석 가능 일정, 기타 의견 수집에 동의합니다.'])
    .setRequired(true);

  return form;
}

function createRecommendForm_(clubName, spreadsheetId) {
  const form = FormApp.create(`${clubName} - 전시·공연 추천 설문`);
  form.setDescription(
    `함께 보고 싶은 전시, 공연, 박물관 일정을 자유롭게 추천해 주세요.\n` +
    `추천된 내용은 월별 후보 선정과 자율 관람 안내에 활용합니다.`
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(true);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheetId);

  form.addTextItem().setTitle('추천자 이름').setRequired(true);
  form.addTextItem().setTitle('전시/공연명').setRequired(true);
  form.addTextItem().setTitle('장소').setRequired(true);
  form.addTextItem().setTitle('기간').setRequired(false);
  form.addTextItem().setTitle('관람료').setRequired(false);
  form.addParagraphTextItem().setTitle('추천 이유').setRequired(true);
  form.addTextItem().setTitle('관련 링크').setRequired(false);
  form.addTextItem().setTitle('함께 가고 싶은 날짜/시간').setRequired(false);
  form.addTextItem().setTitle('도슨트/오디오가이드 정보').setRequired(false);
  form.addParagraphTextItem().setTitle('주변 카페/식사 장소 또는 기타 의견').setRequired(false);

  form.addCheckboxItem()
    .setTitle('개인정보 수집 및 이용 동의')
    .setChoiceValues(['동호회 운영을 위한 추천자 이름과 추천 내용을 수집·활용하는 것에 동의합니다.'])
    .setRequired(true);

  return form;
}
