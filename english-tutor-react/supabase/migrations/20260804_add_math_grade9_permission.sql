-- Manager-controlled access to Grade 9 Math (Algebra + Geometry).
alter table public.profiles
  add column if not exists can_access_math_grade9 boolean not null default false;

-- Optional: grant managers immediately
-- update public.profiles set can_access_math_grade9 = true where role = 'manager';
