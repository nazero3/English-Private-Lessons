import { fmtDate } from '../lib/format'
import { useAuth } from '../lib/auth.jsx'

export default function WalletPage() {
  const { family } = useAuth()
  const ledger = family?.wallet?.ledger || []
  return (
    <div>
      <h1>المحفظة</h1>
      <div className="score-row">
        <div className="score-chip">
          <span>الرصيد</span>
          <strong>{family?.wallet?.balance ?? 0}</strong>
        </div>
        <div className="score-chip">
          <span>مكتسب خلال 12 شهراً</span>
          <strong>{family?.wallet?.earned_12m ?? 0}</strong>
        </div>
      </div>
      <section className="panel">
        <h2>الحركة</h2>
        {!ledger.length ? (
          <p className="muted">ستظهر النقاط هنا بعد الحصص والواجبات.</p>
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
                  <td style={{ color: row.amount < 0 ? '#9b2c2c' : '#1a2656' }}>
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
