import { Link } from 'react-router-dom'
import PointsProgress from '../components/PointsProgress.jsx'
import { fmtDate, kinzPath } from '../lib/format'
import { useAuth } from '../lib/auth.jsx'

export default function WalletPage() {
  const { family } = useAuth()
  const ledger = family?.wallet?.ledger || []
  const membership = family?.wallet?.membership

  return (
    <div>
      <h1>محفظة كينز</h1>
      <PointsProgress membership={membership} balance={family?.wallet?.balance} />
      <p>
        <Link className="btn btn-gold" to={kinzPath('/app/prizes')}>
          استبدل جائزة
        </Link>
      </p>
      <section className="panel">
        <h2>سجل النشاط</h2>
        {!ledger.length ? (
          <p className="muted">ستظهر النقاط هنا بعد الحصص والواجبات وأنشطة المركز.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>السبب</th>
                <th>التاريخ</th>
                <th>النقاط</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.source_label}
                    {row.note ? ` · ${row.note}` : ''}
                  </td>
                  <td>{fmtDate(row.created_at)}</td>
                  <td style={{ color: row.amount < 0 ? 'var(--danger)' : 'var(--navy)' }}>
                    {row.amount > 0 ? `+${row.amount}` : row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
