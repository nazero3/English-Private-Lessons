import { useLocation } from 'react-router-dom'

/** Math and physics share the same pages under /teacher/{subject}/… */
export function useCoursebookSubjectKey() {
  const { pathname } = useLocation()
  if (pathname.includes('/teacher/physics/')) return 'physics'
  return 'math'
}

export function coursebookSubjectFromPath(pathname) {
  if (pathname.includes('/teacher/physics/')) return 'physics'
  return 'math'
}
