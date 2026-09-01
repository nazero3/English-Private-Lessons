-- Lesson Sheets Platform — schema + RLS
-- Run in Supabase SQL editor (or via CLI) before seeding.

create extension if not exists "pgcrypto";

-- Roles
create type public.app_role as enum ('manager', 'teacher');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'teacher',
  can_access_private_lessons boolean not null default false,
  can_access_math_grade9 boolean not null default false,
  can_access_math_grade12 boolean not null default false,
  can_access_physics_grade12 boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  grade text not null,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  unit_number int not null,
  theme text not null,
  grammar text not null,
  arabic text not null default '',
  explanation text not null default '',
  visual jsonb not null default '[]'::jsonb,
  objectives jsonb not null default '[]'::jsonb,
  session_flow jsonb not null default '[]'::jsonb,
  common_mistakes jsonb not null default '[]'::jsonb,
  teacher_notes text not null default '',
  worksheet jsonb not null default '[]'::jsonb,
  homework jsonb not null default '[]'::jsonb,
  quiz_bank jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, unit_number)
);

create table public.teacher_course_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, course_id)
);

create table public.lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_name text not null default 'Student',
  worksheet_score numeric,
  worksheet_total numeric,
  quiz_score numeric,
  quiz_total numeric,
  homework_score numeric,
  homework_total numeric,
  notes text not null default '',
  session_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index lessons_course_id_idx on public.lessons (course_id);
create index assignments_teacher_id_idx on public.teacher_course_assignments (teacher_id);
create index sessions_teacher_id_idx on public.lesson_sessions (teacher_id);
create index sessions_lesson_id_idx on public.lesson_sessions (lesson_id);

-- Auto-create profile on signup (default teacher; promote managers via SQL)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'teacher')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'manager'
  );
$$;

create or replace function public.teacher_has_course(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_course_assignments a
    where a.teacher_id = auth.uid() and a.course_id = cid
  );
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.teacher_course_assignments enable row level security;
alter table public.lesson_sessions enable row level security;

-- profiles
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_manager());

create policy "Users update own name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Managers update any profile"
  on public.profiles for update
  using (public.is_manager());

create policy "Managers insert profiles"
  on public.profiles for insert
  with check (public.is_manager() or auth.uid() = id);

-- courses
create policy "Managers full courses"
  on public.courses for all
  using (public.is_manager())
  with check (public.is_manager());

create policy "Teachers read assigned courses"
  on public.courses for select
  using (public.is_manager() or public.teacher_has_course(id));

-- lessons
create policy "Managers full lessons"
  on public.lessons for all
  using (public.is_manager())
  with check (public.is_manager());

create policy "Teachers read assigned lessons"
  on public.lessons for select
  using (public.is_manager() or public.teacher_has_course(course_id));

-- assignments
create policy "Managers full assignments"
  on public.teacher_course_assignments for all
  using (public.is_manager())
  with check (public.is_manager());

create policy "Teachers read own assignments"
  on public.teacher_course_assignments for select
  using (auth.uid() = teacher_id or public.is_manager());

-- sessions
create policy "Managers read all sessions"
  on public.lesson_sessions for select
  using (public.is_manager() or auth.uid() = teacher_id);

create policy "Teachers insert own sessions"
  on public.lesson_sessions for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers update own sessions"
  on public.lesson_sessions for update
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Managers manage sessions"
  on public.lesson_sessions for all
  using (public.is_manager())
  with check (public.is_manager());
