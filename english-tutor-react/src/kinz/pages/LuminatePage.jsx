import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FALLBACK_LUMINATE } from '../data/luminateFallback'
import { api } from '../lib/api'
import { COPY, HOW_IT_WORKS, INSTAGRAM, KINZ_LOGO, POINT_SOURCES, SITE, TIER_LABEL, WHATSAPP, fmtDate, kinzPath } from '../lib/format'
import TierLadder from '../components/TierLadder.jsx'

function PersonCard({ person }) {
  const letter = (person.display_name || 'ك').slice(0, 1)
  return (
    <article className="lift-card person">
      <div className="orb">{letter}</div>
      <h3>{person.display_name}</h3>
      <span className={`badge ${person.tier || ''}`}>
        {person.badge || TIER_LABEL[person.tier] || 'كينز'}
      </span>
    </article>
  )
}

export default function LuminatePage() {
  const [data, setData] = useState(FALLBACK_LUMINATE)
  const pointHighlights = POINT_SOURCES.slice(0, 4)
  const hall = [...(data.vip_parents || []), ...(data.best_students || []), ...(data.good_parents || [])].slice(0, 3)

  useEffect(() => {
    document.title = 'Kinz Platform'
    ;(async () => {
      try {
        const live = await api.getLuminate()
        setData({ ...FALLBACK_LUMINATE, ...live })
      } catch {
        setData(FALLBACK_LUMINATE)
      }
    })()
  }, [])

  return (
    <div className="page-public">
      <nav className="topnav">
        <img src={KINZ_LOGO} alt="كينز" />
        <div className="topnav-links">
          <a href="#how">كيف تعمل</a>
          <a href="#activities">الأنشطة</a>
          <Link className="nav-login" to={kinzPath('/login')}>
            دخول
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="gift">{data.copy?.complimentary || 'عضوية عائلة كينز مجاناً مع كل كورس'}</p>
            <h1>
              منصة كينز..
              <span>شركاء في رحلة نجاح أبنائكم.</span>
            </h1>
            <p className="hero-lead">{COPY.subhead}</p>
            <p className="hero-outcome">{COPY.outcome}</p>
            <div className="hero-actions">
              <Link className="btn-hero" to={kinzPath('/login')}>
                تابع ابنك الآن
              </Link>
              <a
                className="hero-textlink"
                href={`${WHATSAPP}?text=${encodeURIComponent('مرحباً، أريد الانضمام لعائلة كينز')}`}
                target="_blank"
                rel="noreferrer"
              >
                لست مشتركاً؟ تواصل عبر واتساب
              </a>
            </div>
          </div>
          <div className="hero-stage" aria-hidden="true">
            <div className="hero-pass hero-pass--silver" />
            <article className="hero-pass hero-pass--front">
              <span>عائلة كينز · برونز</span>
              <strong>أم سارة</strong>
              <em>{COPY.motto}</em>
              <div>
                <span>خصم 5٪</span>
              </div>
            </article>
          </div>
        </div>
      </header>

      <section className="section" id="how">
        <div className="section-head">
          <h2>ثلاث خطوات، بلا تعقيد</h2>
          <div className="gold-rule" />
        </div>
        <ol className="steps">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.n} className="step">
              <span className="step-n">{step.n}</span>
              <div>
                <h3>{step.title}</h3>
                <p className="muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" id="membership" style={{ background: '#f7f3e8' }}>
        <div className="section-head">
          <h2>بطاقتك تتغيّر معكم</h2>
          <div className="gold-rule" />
          <p className="muted">برونز للترحيب، فضة بعد النقاط، بلاتين لأعلى المزايا. الاستبدال لا يخفض الفئة.</p>
        </div>
        <TierLadder />
      </section>

      <section className="section" id="points">
        <div className="section-head">
          <h2>النقاط من الشراكة، لا من الضغط</h2>
          <div className="gold-rule" />
          <p className="muted">الحصص والواجبات والاختبارات، وكذلك حضور أنشطة المركز.</p>
        </div>
        <div className="grid-3">
          {pointHighlights.map((item) => (
            <article key={item.id} className="lift-card">
              <h3>{item.title}</h3>
              <p className="muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="activities" style={{ background: '#f7f3e8' }}>
        <div className="section-head">
          <h2>الأنشطة</h2>
          <div className="gold-rule" />
          <p className="muted">الحضور يمنح نقاطاً للعائلة — يضيفها المركز بعد النشاط.</p>
        </div>
        <div className="grid-3">
          {(data.activities || []).map((item) => (
            <article key={item.id} className="lift-card">
              <span className="badge">+{item.credit_award || 20} نقطة</span>
              <h3>{item.title}</h3>
              <p className="muted">{item.description}</p>
              <p className="activity-meta">
                {item.location || 'كينز'}
                {item.starts_at ? ` · ${fmtDate(item.starts_at)}` : ''}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="prizes">
        <div className="section-head">
          <h2>ماذا تفعل بالنقاط</h2>
          <div className="gold-rule" />
        </div>
        <div className="grid-3">
          {(data.prizes || []).slice(0, 3).map((item) => (
            <article key={item.id} className="lift-card">
              <span className="badge">{item.credit_cost} نقطة</span>
              <h3>{item.title}</h3>
              <p className="muted">{item.description}</p>
            </article>
          ))}
        </div>
        <p className="section-cta">
          <Link className="btn btn-navy" to={kinzPath('/login')}>
            دخول لمتابعة ابنك
          </Link>
        </p>
      </section>

      {hall.length ? (
        <section className="section" id="hall">
          <div className="section-head">
            <h2>قاعة كينز المضيئة</h2>
            <div className="gold-rule" />
            <p className="muted">الاسم الأول فقط، وبموافقة الأهل. لا نعرض العلامات.</p>
          </div>
          <div className="grid-3">
            {hall.map((p, idx) => (
              <PersonCard key={`${p.id}-${idx}`} person={p} />
            ))}
          </div>
        </section>
      ) : null}

      <footer className="footer">
        <p>
          <a href={SITE}>kinz-ed.com</a> · <a href={INSTAGRAM}>إنستغرام</a> · <a href={WHATSAPP}>واتساب</a>
        </p>
        <p>© {new Date().getFullYear()} KINZ. {COPY.motto}</p>
      </footer>
    </div>
  )
}
