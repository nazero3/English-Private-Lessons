-- Physics Grade 12 curriculum access (static coursebook in public/books)
alter table public.profiles
  add column if not exists can_access_physics_grade12 boolean not null default false;
