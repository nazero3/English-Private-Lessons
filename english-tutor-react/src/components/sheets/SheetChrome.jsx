export function SheetChrome({
  title,
  subtitle,
  meta,
  children,
  showAnswerKey,
  answerKey,
  dir = 'ltr',
  lang,
  answerKeyTitle = 'Teacher answer key',
}) {
  return (
    <article className="sheet" dir={dir} lang={lang || undefined}>
      <header className="sheet-header">
        <div>
          <h1>{title}</h1>
          {subtitle ? <div className="sheet-meta">{subtitle}</div> : null}
        </div>
        <div className="sheet-meta" style={{ textAlign: dir === 'rtl' ? 'left' : 'right' }}>
          {meta}
        </div>
      </header>
      {children}
      {showAnswerKey && answerKey ? (
        <section className="answer-key">
          <h2>{answerKeyTitle}</h2>
          {answerKey}
        </section>
      ) : null}
    </article>
  )
}

export function NameDateLines({ studentName, studentLabel = 'Student', dateLabel = 'Date' }) {
  return (
    <div className="grid-2 print-block" style={{ marginBottom: '4mm' }}>
      <div>
        <strong>{studentLabel}:</strong> {studentName || '________________________'}
      </div>
      <div>
        <strong>{dateLabel}:</strong> ________________
      </div>
    </div>
  )
}
