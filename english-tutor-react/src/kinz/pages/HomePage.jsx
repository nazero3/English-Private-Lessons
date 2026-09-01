import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ChildSwitcher from '../components/ChildSwitcher.jsx'
import DigitalCard from '../components/DigitalCard.jsx'
import ScoreChips from '../components/ScoreChips.jsx'
import { useAuth } from '../lib/auth.jsx'
import { CHILD_KEY, fmtDate, kinzPath } from '../lib/format'

export default function HomePage() {
  const { family } = useAuth()
  const childrenList = family?.children || []
  const [childId, setChildId] = useState(() => localStorage.getItem(CHILD_KEY) || childrenList[0]?.student?.id)

  useEffect(() => {
    if (!childId && childrenList[0]?.student?.id) setChildId(childrenList[0].student.id)
  }, [childrenList, childId])

  const child = useMemo(
    () => childrenList.find((c) => c.student?.id === childId) || childrenList[0],
    [childrenList, childId],
  )

  const selectChild = (id) => {
    setChildId(id)
    localStorage.setItem(CHILD_KEY, id)
  }

  const membership = family?.wallet?.membership
  const earned = membership?.earned_12m || 0
  const next = membership?.next
  const pct = next?.threshold ? Math.min(100, Math.round((earned / next.threshold) * 100)) : 100
  const last = child?.sessions?.[0]

  return (
    <div>
      <ChildSwitcher childrenList={childrenList} currentId={child?.student?.id} onChange={selectChild} />
      <p className="muted" style={{ marginTop: '0.8rem' }}>
        مرحباً {family?.parent?.full_name}. تابع {child?.student?.full_name || 'ابنك'} بعد كل حصة.
      </p>
      <ScoreChips summary={child?.summary} />
      <div className="panel">
        <h2>آخر حصة</h2>
        {last ? (
          <>
            <strong>{last.lesson?.theme || 'حصة'}</strong>
            <p className="muted">
              {fmtDate(last.session_date)} {last.course?.title ? `· ${last.course.title}` : ''}
            </p>
            {last.notes ? <p>{last.notes}</p> : <p className="muted">لا ملاحظات بعد.</p>}
            <Link className="btn btn-navy" to={kinzPath('/app/child')}>
              تفاصيل الحصص
            </Link>
          </>
        ) : (
          <p className="muted">لم تُسجَّل حصص بعد. سيظهر التقدم هنا فور حفظ المعلّم للحصة.</p>
        )}
      </div>
      <DigitalCard membership={membership} name={family?.parent?.full_name} />
      <div className="panel" style={{ marginTop: '1rem' }}>
        <h2>نقاطك هذه السنة</h2>
        <p>
          {earned} نقطة
          {next?.tier ? ` · تبقّى ${next.needed} للوصول إلى ${next.label_ar}` : ' · أنت في أعلى بطاقة'}
        </p>
        <div className="progress-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">الرصيد القابل للاستبدال: {family?.wallet?.balance ?? 0}</p>
      </div>
    </div>
  )
}
