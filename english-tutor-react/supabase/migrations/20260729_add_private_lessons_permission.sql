-- Add manager-controlled access to English File private lessons.
alter table public.profiles
  add column if not exists can_access_private_lessons boolean not null default false;

-- Managers always retain access via app logic; optional convenience default:
-- update public.profiles set can_access_private_lessons = true where role = 'manager';
