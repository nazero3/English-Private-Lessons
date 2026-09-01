# Role matrix (RLS + UI)

| Action | Manager | Operations | Teacher (assigned) | Teacher (not assigned) |
|--------|---------|------------|--------------------|------------------------|
| List all courses | Yes | No | No | No |
| List assigned courses | Yes | No | Yes | No rows |
| Read lessons | All | No | Assigned courses only | Denied |
| Edit lessons | Yes | No | No | No |
| Assign courses to teachers | Yes | No | No | No |
| Create teacher | Yes | No | No | No |
| Create operations account | Yes | No | No | No |
| Open lesson pack / print | Yes | No | Assigned only | No |
| Check mode + save session | Yes | No | Own sessions | No |
| Log class hours | Yes | No | Own sessions | Own only |
| View all sessions | Yes | Yes | Own only | Own only |
| Teacher hours dashboard | Yes | Yes | No | No |
| English File private lessons | Always | No | If `can_access_private_lessons` | No |
| Math Grade 9 (Algebra + Geometry) | Always | No | If `can_access_math_grade9` | No |

Enforcement: FastAPI role checks. UI hiding is convenience only.
Curriculum flags for English File / Math G9 are manager-toggled on `profiles`.
