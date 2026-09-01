import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FALLBACK_LUMINATE } from '../data/luminateFallback'
import { api } from '../lib/api'
import { INSTAGRAM, KINZ_LOGO, SITE, TIER_LABEL, WHATSAPP, fmtDate, kinzPath } from '../lib/format'

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

  useEffect(() => {
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
          <a href="#activities">الأنشطة</a>
          <a href="#prizes">الجوائز</a>
          <a href="#hall">قاعة النور</a>
          <Link className="btn btn-gold" to={kinzPath('/login')}>
            دخول برقم الموبايل
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-inner">
          <p className="gift">{data.copy?.complimentary || 'عضوية عائلة كينز مجاناً مع كل كورس'}</p>
          <h1>
            كينز تُضيء. <span>عائلة تتقدّم معاً.</span>
          </h1>
          <p>
            تابع ابنك بعد كل حصة، اجمع نقاط الحضور، واحمل بطاقة برونز أو فضة أو بلاتين. الصفحة
            العامة تحتفي بالشراكة لا بالدرجات.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-gold" to={kinzPath('/login')}>
              دخول الأهل
            </Link>
            <a className="btn btn-whatsapp" href={`${WHATSAPP}?text=${encodeURIComponent('مرحباً، أريد الانضمام لعائلة كينز')}`} target="_blank" rel="noreferrer">
              سجّل عبر واتساب
            </a>
          </div>
        </div>
      </header>

      <section className="section" id="activities">
        <div className="section-head">
          <h2>الأنشطة</h2>
          <div className="gold-rule" />
        </div>
        <div className="grid-3">
          {(data.activities || []).map((item) => (
            <article key={item.id} className="lift-card">
              <h3>{item.title}</h3>
              <p className="muted">{item.description}</p>
              <p>
                {item.location || 'كينز'}
                {item.starts_at ? ` · ${fmtDate(item.starts_at)}` : ''}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="prizes" style={{ background: '#f7f3e8' }}>
        <div className="section-head">
          <h2>الجوائز والخصومات</h2>
          <div className="gold-rule" />
          <p className="muted">النقاط من الحضور والمتابعة — البطاقة لا تهبط إذا استبدلت جائزة.</p>
        </div>
        <div className="grid-3">
          {(data.prizes || []).map((item) => (
            <article key={item.id} className="lift-card">
              <span className="badge">{item.credit_cost} نقطة</span>
              <h3>{item.title}</h3>
              <p className="muted">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="hall">
        <div className="section-head">
          <h2>قاعة كينز المضيئة</h2>
          <div className="gold-rule" />
          <p className="muted">أسماء مستعارة أو الاسم الأول فقط، وبموافقة الأهل. لا نعرض العلامات هنا.</p>
        </div>
        <h3 style={{ margin: '0 0 0.8rem' }}>آباء VIP</h3>
        <div className="grid-3">
          {(data.vip_parents || []).map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
        <h3 style={{ margin: '2rem 0 0.8rem' }}>نجوم الحضور</h3>
        <div className="grid-3">
          {(data.best_students || []).map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
        <h3 style={{ margin: '2rem 0 0.8rem' }}>شركاء متميّزون</h3>
        <div className="grid-3">
          {(data.good_parents || []).map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>
          <a href={SITE}>kinz-ed.com</a> · <a href={INSTAGRAM}>إنستغرام</a> ·{' '}
          <a href={WHATSAPP}>واتساب</a>
        </p>
        <p>© {new Date().getFullYear()} KINZ. المعرفة هي الكنز الحقيقي.</p>
      </footer>
    </div>
  )
}
