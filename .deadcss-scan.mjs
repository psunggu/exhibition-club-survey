import fs from 'node:fs'
import path from 'node:path'
const ROOT = 'C:/D/Project/exhibition-club-survey'
const files = ['app/src/App.tsx','app/src/Board.tsx','app/src/Calendar.tsx','app/src/main.tsx',
 'app/src/lib/router.ts','app/src/lib/events.ts','app/src/lib/calendar.ts','app/src/lib/digest.ts',
 'app/src/data/meetups.ts','app/src/data/movies.ts','app/index.html','app/src/styles/app.css']
const src = files.map(f=>fs.readFileSync(path.join(ROOT,f),'utf8')).join('\n')
const B = String.raw`\b`
for (const file of ['app/src/styles/legacy-board.css','app/src/styles/legacy-notice.css']) {
  const css = fs.readFileSync(path.join(ROOT,file),'utf8')
  const classes = [...new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m=>m[1]))]
  const dead = classes.filter(c=>!new RegExp(B+c+B).test(src))
  const live = classes.filter(c=>new RegExp(B+c+B).test(src))
  console.log('=== '+file+' : '+classes.length+' classes; live='+live.length+' dead='+dead.length)
  console.log('DEAD: '+dead.join(' '))
  console.log('')
}
console.log('---- sizes ----')
for (const f of ['app/public/styles.css','app/public/notice.css','app/src/styles/legacy-board.css','app/src/styles/legacy-notice.css','app/src/styles/app.css','app/public/app.js','app/public/notice.js','app/public/index.html','app/public/notice.html']) {
  console.log(f, fs.statSync(path.join(ROOT,f)).size)
}
