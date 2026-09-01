import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'

const emptyParent = { full_name: '', phone: '', pin: '123456', student_id: '', relationship: 'guardian' }

export default function ParentsPage() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'manager'
  const back = isManager ? '/manager' : '/teacher'
  const [tab, setTab] = useState('families')
  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [form, setForm] = useState(emptyParent)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState(null)
  const [linkStudentId, setLinkStudentId] = useState('')
  const [creditNote, setCreditNote] = useState('دعوة صديق')

  const load = async () => {
    const [p, s] = await Promise.all([api.listParents(), api.listStudents(profile)])
    setParents(p)
    setStudents(s)
    if (isManager) {
      setPayments(await api.listPayments())
      setRedemptions(await api.listPrizeRequests())
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        await load()
      } catch (err) {
        setError(err.message)
      }
    })()
  }, [profile])

  const run = async (fn, success) => {
    setError('')
    setMessage('')
    try {
      await fn()
      await load()
      if (selected) {
        const rows = await api.listParents()
        setSelected(rows.find((r) => r.id === selected.id) || null)
      }
      if (success) setMessage(success)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const createParent = async (e) => {
    e.preventDefault()
    const ok = await run(
      () =>
        api.createParent({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          pin: form.pin.trim(),
          student_id: form.student_id || undefined,
          relationship: form.relationship,
        }),
      'Parent saved. They sign in with phone + PIN.',
    )
    if (ok) setForm(emptyParent)
  }

  return (
    <div>
      <p className="crumb">
        <Link to={back}>← Back</Link>
      </p>
      <header className="teacher-dash__hero">
        <div>
          <h1>Kinz Family</h1>
          <p className="muted">Phone logins, child links, payments, and public hall opt-in.</p>
        </div>
      </header>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <nav className="manager-tabs" role="tablist" aria-label="Family sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'families'}
          className={`manager-tabs__btn ${tab === 'families' ? 'is-active' : ''}`}
          onClick={() => setTab('families')}
        >
          Families
        </button>
        {isManager ? (
          <>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pay'}
              className={`manager-tabs__btn ${tab === 'pay' ? 'is-active' : ''}`}
              onClick={() => setTab('pay')}
            >
              Payments
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'prizes'}
              className={`manager-tabs__btn ${tab === 'prizes' ? 'is-active' : ''}`}
              onClick={() => setTab('prizes')}
            >
              Prize requests
            </button>
          </>
        ) : null}
      </nav>

      {tab === 'families' ? (
        <>
          <section className="panel">
            <h2>Add parent</h2>
            <form onSubmit={createParent}>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="pname">Full name</label>
                  <input
                    id="pname"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="pphone">Phone</label>
                  <input
                    id="pphone"
                    value={form.phone}
                    placeholder="0993 000 001"
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="ppin">PIN</label>
                  <input
                    id="ppin"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="pstu">Link student</label>
                  <select
                    id="pstu"
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  >
                    <option value="">— optional —</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn" type="submit">
                Save parent
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Families</h2>
            {!parents.length ? (
              <p className="muted">No parents yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Card</th>
                    <th>Access</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map((row) => (
                    <tr key={row.id}>
                      <td>{row.full_name}</td>
                      <td>{row.phone_display || row.phone}</td>
                      <td>{row.wallet?.membership?.label_ar || '—'}</td>
                      <td>{row.subscription?.status || '—'}</td>
                      <td>
                        <button type="button" className="table-link" onClick={() => setSelected(row)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {selected ? (
            <section className="panel">
              <h2>
                {selected.full_name}{' '}
                <span className="badge">{selected.family_code}</span>
              </h2>
              <p className="muted">
                PIN reset from the form below. Family code works without a smartphone.
              </p>
              <p>
                Children:{' '}
                {(selected.children || []).map((c) => c.full_name).join(', ') || 'none'}
              </p>
              <div className="grid-2">
                <div className="field">
                  <label>Link another student</label>
                  <select value={linkStudentId} onChange={(e) => setLinkStudentId(e.target.value)}>
                    <option value="">Choose…</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={!linkStudentId}
                    onClick={() =>
                      run(() => api.linkParentStudent(selected.id, { student_id: linkStudentId }), 'Linked.')
                    }
                  >
                    Link
                  </button>
                </div>
                <div className="field">
                  <label>Reset PIN</label>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      const pin = window.prompt('New 6-digit PIN', '123456')
                      if (pin) run(() => api.updateParent(selected.id, { pin }), 'PIN updated.')
                    }}
                  >
                    Set PIN
                  </button>
                </div>
              </div>
              {(selected.children || []).map((c) => (
                <p key={c.student_id}>
                  {c.full_name}{' '}
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => run(() => api.unlinkParentStudent(selected.id, c.student_id), 'Unlinked.')}
                  >
                    Unlink
                  </button>
                </p>
              ))}
              <div className="actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    run(
                      () =>
                        api.grantParentCredits(selected.id, {
                          amount: 50,
                          source: 'referral',
                          note: creditNote,
                        }),
                      'Referral credits added.',
                    )
                  }
                >
                  +50 referral credits
                </button>
                {isManager ? (
                  <>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() =>
                        run(() => api.grantComplimentary(selected.id, { days: 30 }), 'Complimentary month granted.')
                      }
                    >
                      Complimentary 30 days
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() =>
                        run(
                          () => api.setParentSpotlight(selected.id, { opted_in: true, kind: 'vip_parent' }),
                          'VIP wall enabled (first name only).',
                        )
                      }
                    >
                      Feature as VIP
                    </button>
                  </>
                ) : null}
              </div>
              <div className="field">
                <label>Referral note</label>
                <input value={creditNote} onChange={(e) => setCreditNote(e.target.value)} />
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {tab === 'pay' ? (
        <section className="panel">
          <h2>Payment confirmations</h2>
          {!payments.length ? (
            <p className="muted">No invoices yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Parent</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.parent?.full_name}</td>
                    <td>{row.period}</td>
                    <td>{row.amount}</td>
                    <td>{row.status}</td>
                    <td>
                      {row.status === 'pending' ? (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => run(() => api.confirmPayment(row.id), 'Marked paid.')}
                        >
                          Confirm paid
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {tab === 'prizes' ? (
        <section className="panel">
          <h2>Prize redemptions</h2>
          {!redemptions.length ? (
            <p className="muted">No requests.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Parent</th>
                  <th>Prize</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((row) => (
                  <tr key={row.id}>
                    <td>{row.parent?.full_name}</td>
                    <td>{row.prize?.title}</td>
                    <td>{row.status}</td>
                    <td>
                      {row.status === 'pending' ? (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => run(() => api.fulfillPrizeRequest(row.id), 'Fulfilled.')}
                        >
                          Fulfill
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}
    </div>
  )
}
