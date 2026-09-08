import { useCallback, useEffect, useRef, useState } from 'react'
import { COPY, KINZ_LOGO, WELCOME_KEY } from '../lib/format'

export default function WelcomeModal({ parentId }) {
  const key = parentId ? `${WELCOME_KEY}:${parentId}` : ''
  const alreadySeen = Boolean(key && localStorage.getItem(key))
  const [hidden, setHidden] = useState(false)
  const closeRef = useRef(null)
  const open = Boolean(parentId) && !alreadySeen && !hidden

  const dismiss = useCallback(() => {
    if (key) localStorage.setItem(key, '1')
    setHidden(true)
  }, [key])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismiss])

  if (!open) return null

  return (
    <div className="welcome-overlay" onClick={dismiss}>
      <div
        className="welcome-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={KINZ_LOGO} alt="" />
        <p className="welcome-kicker">أهلاً بكم في العائلة</p>
        <h2 id="welcome-title">{COPY.welcome}</h2>
        <p className="muted">بعد كل حصة، افتحوا الرئيسية لتروا ماذا تعلّم ابنكم.</p>
        <button ref={closeRef} type="button" className="btn btn-gold btn-block" onClick={dismiss}>
          متابعة ابنك
        </button>
      </div>
    </div>
  )
}
