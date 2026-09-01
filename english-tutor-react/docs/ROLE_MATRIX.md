# Role matrix (RLS + UI)

| Action | Manager | Teacher (assigned) | Teacher (not assigned) |
|--------|---------|--------------------|------------------------|
| List all courses | Yes | No | No |
| List assigned courses | Yes | Yes | No rows |
| Read lessons | All | Assigned courses only | Denied by RLS |
| Edit lessons | Yes | No | No |
| Assign courses to teachers | Yes | No | No |
| Create teacher | Yes | No | No |
| Open lesson pack / print | Yes | Assigned only | No |
| Check mode + save session | Yes | Own sessions | No |
| View all sessions | Yes | Own only | Own only |
| English File private lessons | Always | If `can_access_private_lessons` | No |
| Math Grade 9 (Algebra + Geometry) | Always | If `can_access_math_grade9` | No |

Enforcement: Supabase RLS in `supabase/schema.sql`. UI hiding is convenience only.
Curriculum flags for English File / Math G9 are manager-toggled on `profiles`.
