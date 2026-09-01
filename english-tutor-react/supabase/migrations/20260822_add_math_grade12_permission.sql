-- Grade 12 math (Baccalaureate f1 + f2) access flag on teacher profiles
alter table public.profiles
  add column if not exists can_access_math_grade12 boolean not null default false;
