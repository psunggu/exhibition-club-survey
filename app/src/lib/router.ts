import { useEffect, useState } from 'react'

/**
 * 해시 라우팅을 쓴다. 404 폴백 방식이 아니다 (R-01-01).
 *
 * **이유는 카카오톡 인앱 브라우저다.** 회원 대부분이 카톡 링크로 들어오는데,
 * 그 WebView 는 히스토리 API 와 서버 폴백에서 일반 브라우저와 다르게 움직인다.
 * 해시는 서버를 타지 않고 뒤로 가기가 그대로 돌아서 깨질 자리가 적다.
 * GitHub Pages 의 404.html 복사 트릭도 필요 없어진다.
 *
 * 주소가 `#/calendar` 처럼 보이는 것은 값을 치르고 얻은 것이다.
 * 실기기 확인(R-01-10)에서 히스토리가 멀쩡하면 그때 다시 논의한다.
 */

export type Route =
  | { name: 'board' }
  | { name: 'calendar' }
  | { name: 'survey' }
  | { name: 'surveyDatetime' }
  | { name: 'surveyMeal' }
  | { name: 'surveyClub' }
  | { name: 'surveyGoogle' }
  | { name: 'surveyEtc' }
  | { name: 'surveyAdmin' }
  | { name: 'notFound'; path: string }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  switch (path) {
    case '':
    case '/':
      return { name: 'board' }
    case '/calendar':
      return { name: 'calendar' }
    case '/survey':
      return { name: 'survey' }
    case '/survey/datetime':
      return { name: 'surveyDatetime' }
    case '/survey/meal':
      return { name: 'surveyMeal' }
    case '/survey/club':
      return { name: 'surveyClub' }
    case '/survey/google':
      return { name: 'surveyGoogle' }
    case '/survey/etc':
      return { name: 'surveyEtc' }
    case '/survey/admin':
      return { name: 'surveyAdmin' }
    default:
      return { name: 'notFound', path }
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
