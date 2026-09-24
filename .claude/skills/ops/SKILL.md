---
name: ops
description: 운영 점검 — 정기 갱신 넷이 각각 얼마나 오래됐는지, 정리봇 병합·요약(inbox 저장 → launchd kakao-weekly)이 최근에 돌았는지, launchd 배치 · 열린 PR · 배포 상태를 열 줄 안쪽으로 보고한다. 세션을 열고 「뭐부터 할까」 할 때 쓴다.
---

읽기만 한다. 아무것도 고치지 않는다. 아래를 한 번의 Bash 로 모아서 보고한다.

```bash
cd "$HOME/D/Project/exhibition-club-survey" && git fetch -q --prune origin && echo "main: $(git -C . log --oneline -1 origin/main)" \
&& echo "영화 순위 기준: $(grep -o "MOVIE_RANKING_UPDATED_AT = '[^']*'" app/src/data/movies.ts | cut -d"'" -f2)" \
&& echo "정리봇 공개본 기간: $(grep -o '"period_label": "[^"]*"' app/public/weekly-digest.public.json | cut -d'"' -f4) / $(grep -o '"updated_label": "[^"]*"' app/public/weekly-digest.public.json | cut -d'"' -f4)" \
&& echo "정리봇 원천: $(node -e 'const fs=require("fs"),H=require("os").homedir(),K=H+"/D/Project/kakao-digest",rd=f=>{try{return JSON.parse(fs.readFileSync(f,"utf8"))}catch{return {}}},ls=d=>{try{return fs.readdirSync(d)}catch{return []}};const g=ls(K+"/output").map(f=>f.match(/^digest-(\d{8})-(\d{8})\.json$/)).filter(Boolean).sort((a,b)=>(a[2]+a[1]).localeCompare(b[2]+b[1])).pop(),ago=s=>Math.floor((Date.now()-new Date(s.replace(/^(\d{4})(\d\d)(\d\d)$/,"$1-$2-$3T00:00")))/864e5),r=rd(K+"/last_run.json"),st=r.steps||{},c=st.collect||{},p=rd("logs/digest-public-last.json"),q=ls(H+"/KakaoDigest/inbox").filter(f=>/\.(csv|txt)$/i.test(f)).length;console.log(`끝 ${g?g[2]+" ("+ago(g[2])+"일 전)":"없음"} · 병합·요약 ${(r.startedAt||"-").slice(0,16)} ${r.result||"-"}/${r.exitCode??"-"} 새 ${c.new??"-"}건 공지 ${(st.summary||{}).noticeFile?"생성":"없음"} · inbox 대기 ${q}개 · 공개본 배치 ${(p.file||"-").replace(/^digest-\d{8}-|\.json$/g,"")} ${p.result||"-"}`)')" \
&& echo "조율 중: $(grep -c "^    id: '" <(awk '/^export const TENTATIVE/,/^\]/' app/src/data/meetups.ts))건" \
&& echo "열린 PR: $(gh pr list --state open --json number,title -q '.[] | "#\(.number) \(.title)"' | tr '\n' ' ')" \
&& echo "마지막 배포: $(gh run list --workflow=deploy-pages.yml --limit 1 --json conclusion,createdAt -q '.[0] | "\(.conclusion) \(.createdAt)"')" \
&& echo "launchd 종료 코드: $(launchctl list | awk '$3 ~ /^com\.psunggu\.(exhibition-|kakao-)/ { sub(/^com\.psunggu\./, "", $3); print $3 "=" $2 }' | sort | tr '\n' ' ')" \
&& echo "영화 배치 마지막 로그: $(ls -t logs 2>/dev/null | grep -m1 '^update-movies-.*\.log$' | sed 's|^|logs/|' | xargs -r tail -1)"
```

보고는 이렇게 쓴다.

- 항목마다 한 줄, 오래된 것부터. 영화 순위가 4일 넘었거나 정리봇 공개본 끝 날짜가 8일 넘었거나 launchd 종료 코드가 0 이 아니거나 일곱(exhibition 넷 · kakao 셋) 중 빠진 것이 있으면 앞에 「⚠」.
- 정리봇이 밀렸으면 원천 줄에서 다음 행동을 이 순서로 하나 고른다: 병합·요약 `error` → `tail -20 ~/Library/Logs/com.psunggu.kakao-weekly.log`(inbox 파일은 오류라 남은 것) · 공개본 배치 `stopped` → 개인정보 검사로 멈춤, 사람에게 · 열린 정리봇 PR → 그 머지(06:30 배치는 머지하지 않는다) · 원천 끝이 공개본보다 뒤인데 PR 이 없음 → 다음 06:30 배치를 기다리거나 `/digest` · inbox 대기 → `launchctl kickstart gui/$(id -u)/com.psunggu.kakao-weekly` · 그 밖 → 「⚠ 카톡에서 대화 내보내기 → `~/KakaoDigest/inbox` 에 저장」.
- 남은 사람 일을 마지막에 한 줄: 운영자 암호 재설정이 아직이면 그것, 아니면 없음.
- 열 줄을 넘기지 않는다. 다음 행동을 하나만 권한다.
