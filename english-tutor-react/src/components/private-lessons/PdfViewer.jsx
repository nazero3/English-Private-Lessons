export default function PdfViewer({ src, page = 1, title = 'Coursebook' }) {
  const hash = page > 1 ? `#page=${page}` : ''
  const url = `${src}${hash}`

  return (
    <div className="pdf-viewer">
      <iframe
        title={title}
        src={url}
        className="pdf-viewer__frame"
      />
      <p className="pdf-viewer__hint muted">
        Page {page} · Use browser controls inside the viewer to zoom or scroll.
      </p>
    </div>
  )
}
