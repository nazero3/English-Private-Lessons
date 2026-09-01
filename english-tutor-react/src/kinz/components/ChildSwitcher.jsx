export default function ChildSwitcher({ childrenList, currentId, onChange }) {
  if (!childrenList?.length) return null
  return (
    <div className="switcher" role="tablist" aria-label="الأبناء">
      {childrenList.map((child) => {
        const id = child.student?.id
        return (
          <button
            key={id}
            type="button"
            className={id === currentId ? 'active' : ''}
            onClick={() => onChange(id)}
          >
            {child.student?.full_name}
          </button>
        )
      })}
    </div>
  )
}
