import { Link } from 'react-router-dom'
import ChildSwitcher from '../components/ChildSwitcher.jsx'
import DigitalCard from '../components/DigitalCard.jsx'
import PointsProgress from '../components/PointsProgress.jsx'
import ReferralCard from '../components/ReferralCard.jsx'
import WelcomeModal from '../components/WelcomeModal.jsx'
import { useAuth } from '../lib/auth.jsx'
import { fmtDate, kinzPath } from '../lib/format'
import { useSelectedChild } from '../lib/useSelectedChild'

function firstName(value) {
  const name = String(value || '').trim()
  return name.split(/\s+/)[0] || ''
}

export default function HomePage() {
  const { family } = useAuth()
  const { childrenList, child, selectChild } = useSelectedChild(family?.children)

  const membership = family?.wallet?.membership
  const last = child?.sessions?.[0]
  const homeworkOpen = last?.homework_assigned && last.homework_score == null
  const parentName = firstName(family?.parent?.full_name) || 'ولي الأمر'
  const childName = firstName(child?.student?.full_name) || 'ابنك'

  return (
    <div className="home-flow">
      <WelcomeModal parentId={family?.parent?.id} />
      {childrenList.length > 1 ? (
        <ChildSwitcher childrenList={childrenList} currentId={child?.student?.id} onChange={selectChild} />
      ) : null}

      <header className="home-hello">
        <p className="welcome-kicker">مرحباً {parentName}</p>
        <h1>{childName}</h1>
        <p className="muted">
          {last ? `آخر حصة · ${fmtDate(last.session_date)}` : 'سيظهر التقدم هنا بعد أول حصة.'}
        </p>
      </header>

      <section className={`today-card ${homeworkOpen ? 'is-need' : ''}`}>
        {homeworkOpen ? <p className="need-flag">يحتاج متابعتك</p> : <p className="welcome-kicker">آخر حصة</p>}
        {last ? (
          <>
            <h2>{last.lesson?.theme || 'حصة'}</h2>
            {last.course?.title ? <p className="muted">{last.course.title}</p> : null}
            {last.notes ? <p className="today-note">{last.notes}</p> : <p className="muted">لا ملاحظات بعد.</p>}
            {last.homework_assigned ? (
              <p className="today-hw">
                الواجب: {last.homework_assigned}
                {homeworkOpen ? ' — لم يُصحَّح بعد.' : ''}
              </p>
            ) : null}
            <Link className="btn btn-navy" to={kinzPath('/app/child')}>
              عرض الحصص
            </Link>
          </>
        ) : (
          <p className="muted">لم تُسجَّل حصص بعد. سيظهر التقدم هنا فور حفظ المعلّم للحصة.</p>
        )}
      </section>

      <DigitalCard compact membership={membership} name={family?.parent?.full_name} />
      <PointsProgress slim membership={membership} balance={family?.wallet?.balance} />
      <ReferralCard familyCode={family?.family_code || family?.parent?.family_code} />
    </div>
  )
}
