-- Session students, manager feedback, and teacher notifications
-- Run after schema.sql

alter table public.lesson_sessions
  add column if not exists manager_feedback text not null default '',
  add column if not exists manager_feedback_at timestamptz,
  add column if not exists manager_id uuid references public.profiles (id) on delete set null;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now(),
  unique (teacher_id, full_name)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.lesson_sessions (id) on delete cascade,
  type text not null default 'manager_feedback',
  title text not null default '',
  message text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists students_teacher_id_idx on public.students (teacher_id);
create index if not exists notifications_user_id_idx on public.notifications (user_id);

alter table public.students enable row level security;
alter table public.notifications enable row level security;

create policy "Teachers manage own students"
  on public.students for all
  using (auth.uid() = teacher_id or public.is_manager())
  with check (auth.uid() = teacher_id or public.is_manager());

create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_manager());

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Managers insert notifications"
  on public.notifications for insert
  with check (public.is_manager());

create policy "Managers update session feedback"
  on public.lesson_sessions for update
  using (public.is_manager() or auth.uid() = teacher_id)
  with check (public.is_manager() or auth.uid() = teacher_id);
