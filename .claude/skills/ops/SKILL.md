---
name: ops
description: 운영 점검 — 정기 갱신 넷이 각각 얼마나 오래됐는지, 정리봇 자동 내보내기가 살아 있는지, 열린 PR 과 배포 상태를 열 줄 안쪽으로 보고한다. 세션을 열고 「뭐부터 할까」 할 때 쓴다.
---

읽기만 한다. 아무것도 고치지 않는다. 아래를 한 번의 Bash 로 모아서 보고한다.

```bash
cd C:/D/Project/exhibition-club-survey && git fetch -q --prune origin && echo "main: $(git -C . log --oneline -1 origin/main)" \
&& echo "영화 순위 기준: $(grep -o "MOVIE_RANKING_UPDATED_AT = '[^']*'" app/src/data/movies.ts | cut -d"'" -f2)" \
&& echo "정리봇 기간: $(grep -o '"period_label": "[^"]*"' app/public/weekly-digest.public.json | cut -d'"' -f4) / $(grep -o '"updated_label": "[^"]*"' app/public/weekly-digest.public.json | cut -d'"' -f4)" \
&& echo "정리봇 마지막 자동 실행: $(node -e "const r=require('C:/D/Project/kakao-digest/last_run.json');console.log(r.startedAt.slice(0,16), r.result, r.steps.export.reason||'')")" \
&& echo "조율 중: $(grep -c "^    id: '" <(awk '/^export const TENTATIVE/,/^\]/' app/src/data/meetups.ts))건" \
&& echo "열린 PR: $(gh pr list --state open --json number,title -q '.[] | "#\(.number) \(.title)"' | tr '\n' ' ')" \
&& echo "마지막 배포: $(gh run list --workflow=deploy-pages.yml --limit 1 --json conclusion,createdAt -q '.[0] | "\(.conclusion) \(.createdAt)"')" \
&& echo "영화 작업(PC): $(ls -t logs/update-movies-*.log 2>/dev/null | head -1 | xargs -r tail -1)"
```

보고는 이렇게 쓴다.

- 항목마다 한 줄, 오래된 것부터. 영화 순위가 4일 넘었거나 정리봇이 8일 넘었으면 앞에 「⚠」.
- 정리봇 자동 실행이 `export-failed` 면 「카톡 방을 독립 창으로 띄운 뒤 `/digest`」 라고 적는다.
- 남은 사람 일을 마지막에 한 줄: 운영자 암호 재설정이 아직이면 그것, 아니면 없음.
- 열 줄을 넘기지 않는다. 다음 행동을 하나만 권한다.
