-- Manual RLS smoke checks (run as each role via Supabase SQL with auth context, or via app).
-- Expected:
-- 1) Teacher without assignment: select * from courses → 0 rows for unassigned
-- 2) Teacher with grade_9: sees grade_9 lessons only
-- 3) Manager: sees all courses/lessons/sessions
-- 4) Teacher cannot update lessons (policy denies)
-- 5) Teacher cannot insert assignments for others

-- Promote manager (run once after creating auth user):
-- update public.profiles set role = 'manager' where id = '<uuid>';

-- Assign teacher to grade 9:
-- insert into public.teacher_course_assignments (teacher_id, course_id)
-- values ('<teacher-uuid>', '11111111-1111-1111-1111-111111111111');
