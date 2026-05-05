create table if not exists public.academy_student_users (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.academy_students(id) on delete cascade,
  email text not null,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists academy_student_users_student_id_idx
on public.academy_student_users (student_id);

create unique index if not exists academy_student_users_email_idx
on public.academy_student_users (lower(email));

drop trigger if exists academy_student_users_updated_at on public.academy_student_users;
create trigger academy_student_users_updated_at
before update on public.academy_student_users
for each row
execute function public.set_updated_at();
