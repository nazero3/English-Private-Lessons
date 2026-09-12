## Learned User Preferences

- Do not merge, push, or deploy `main` unless the user asks; production deploys only from pushes to main. After showing merge/push commands, wait for the user to run them unless they explicitly say to run them.
- Keep MCP and test work on `feat/kinz-mcp-readonly`; put new product work on a dedicated feature branch rather than committing onto the test branch.
- Local demo database rows (students, schedules, and similar) stay local and must not be mixed into the production or main database.
- End each session with a handoff prompt so the next chat can continue from where work stopped.
- Prefer quiet, simple UI: fewer extra tabs and buttons, especially on manager dashboards; teacher hour entry should be easy with little repetition. Hours totals stay a large highlight with a Details button for the per-student breakdown; show the date only, not extra session-hour chips next to it.
- Teacher hours should be editable in place, not only deleted as a whole hour; teachers should be able to remove a postponed or cancelled class.
- Keep student and session list actions on the list (including delete) and return to the list after delete; session and history order is last-entered, and edits must not reshuffle items.
- Brand manager, teacher, and ops surfaces as "Kinz Teacher Platform" and student/family surfaces as "Kinz Platform"; follow the kinz-ed.com color palette.
- Managers see everything; teachers see only assigned courses; private-lesson curricula appear only when the manager grants permission.
- Review quizzes belong every three units (3, 6, 9, …), not after every unit.
- Test locally before committing work that will go to production.
- GitHub username for this remote is nazero3. Do not change git config. When the user asks to commit as nazero3 / nazerrabah1994@gmail.com, set author for that commit only via `git -c user.name` / `git -c user.email`, never `git config`.

## Learned Workspace Facts

- Live production is https://kinz-teach.cloud/; the GitHub repo is nazero3/English-Private-Lessons; GitHub Actions deploys on push to `main`.
- The product lives in `english-tutor-react` (the older `english-tutor-app` was removed): React/Vite frontend, FastAPI backend, Postgres, and Docker Compose on a Hostinger VPS with Caddy.
- Roles in use are teacher, operations, and manager, plus student and family portals. Ops uses sessions and hours. Operations and managers add, edit, and delete students; teachers view assigned students only and pick from the roster when logging a class. Payments and prizes need teacher or manager.
- MCP and test work is on `feat/kinz-mcp-readonly`. The read-only MCP sidecar is `english-tutor-react/mcp/` (kinz-mcp-server); the default local API is `http://127.0.0.1:8000`; production URLs stay blocked unless `KINZ_ALLOW_PRODUCTION=true`.
- Curricula include 9th/12th grade English school books, English File beginner and intermediate for private lessons, 9th-grade Arabic algebra and geometry, and 12th-grade math as two books under one course.
- Production uses Postgres in Docker, not Supabase.
- Ops can design weekly teacher/student schedules and export Excel or PDF.
- The app is a PWA for phone install.
- Students are first-class records, not free-text labels; history, lessons, and hours should show the current roster name after a rename, not a frozen snapshot.
- Ops, teachers, and managers can open total hours into a per-student breakdown.
