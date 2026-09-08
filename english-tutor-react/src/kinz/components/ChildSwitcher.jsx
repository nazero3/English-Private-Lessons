export default function ChildSwitcher({ childrenList, currentId, onChange }) {
  if (!childrenList?.length) return null
  return (
    <div className="switcher" role="tablist" aria-label="الأبناء">
      {childrenList.map((child) => {
        const id = child.student?.id
        const name = child.student?.full_name || 'ابن'
        return (
          <button
            key={id}
            type="button"
            className={id === currentId ? 'active' : ''}
            onClick={() => onChange(id)}
            aria-selected={id === currentId}
          >
            <span className="switcher-orb" aria-hidden="true">
              {name.slice(0, 1)}
            </span>
            {name}
          </button>
        )
      })}
    </div>
  )
}
