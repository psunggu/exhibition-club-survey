import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
// 옛 화면의 스타일을 그대로 쓴다. 회원에게 익숙한 화면이라 새로 그리지 않는다.
import './styles/legacy-board.css'
import './styles/legacy-notice.css'
import './styles/survey.css'
import './styles/app.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root 를 찾지 못했다')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
