import { useMemo, useState } from 'react'
import { CHILD_KEY } from './format'

const EMPTY = []

export function useSelectedChild(children) {
  const childrenList = children?.length ? children : EMPTY
  const [childId, setChildId] = useState(() => localStorage.getItem(CHILD_KEY) || '')

  const child = useMemo(
    () => childrenList.find((row) => row.student?.id === childId) || childrenList[0],
    [childrenList, childId],
  )

  const selectChild = (id) => {
    setChildId(id)
    localStorage.setItem(CHILD_KEY, id)
  }

  return { childrenList, child, selectChild }
}
