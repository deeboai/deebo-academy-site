create table if not exists public.academy_portal_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null,
  status text not null default 'active',
  auth_user_id uuid,
  parent_id uuid references public.academy_parents(id) on delete cascade,
  tutor_id uuid references public.academy_tutors(id) on delete cascade,
  student_id uuid references public.academy_students(id) on delete cascade,
  invited_by uuid,
  invite_sent_at timestamptz,
  password_reset_sent_at timestamptz,
  disabled_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint academy_portal_accounts_email_lowercase_check
    check (email = lower(email)),
  constraint academy_portal_accounts_role_check
    check (role in ('admin', 'parent', 'tutor', 'student')),
  constraint academy_portal_accounts_status_check
    check (status in ('active', 'invited', 'disabled')),
  constraint academy_portal_accounts_link_check
    check (
      (role = 'admin' and parent_id is null and tutor_id is null and student_id is null)
      or (role = 'parent' and parent_id is not null and tutor_id is null and student_id is null)
      or (role = 'tutor' and tutor_id is not null and parent_id is null and student_id is null)
      or (role = 'student' and student_id is not null and parent_id is null and tutor_id is null)
    )
);

create unique index if not exists academy_portal_accounts_email_role_idx
on public.academy_portal_accounts (email, role);

create index if not exists academy_portal_accounts_parent_idx
on public.academy_portal_accounts (parent_id);

create unique index if not exists academy_portal_accounts_parent_role_idx
on public.academy_portal_accounts (parent_id, role)
where parent_id is not null;

create index if not exists academy_portal_accounts_tutor_idx
on public.academy_portal_accounts (tutor_id);

create unique index if not exists academy_portal_accounts_tutor_role_idx
on public.academy_portal_accounts (tutor_id, role)
where tutor_id is not null;

create index if not exists academy_portal_accounts_student_idx
on public.academy_portal_accounts (student_id);

create unique index if not exists academy_portal_accounts_student_role_idx
on public.academy_portal_accounts (student_id, role)
where student_id is not null;

create index if not exists academy_portal_accounts_auth_user_idx
on public.academy_portal_accounts (auth_user_id);

create table if not exists public.academy_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text not null,
  target_type text not null,
  target_id uuid,
  target_email text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists academy_audit_events_target_idx
on public.academy_audit_events (target_type, target_id, created_at desc);

create index if not exists academy_audit_events_actor_idx
on public.academy_audit_events (actor_user_id, created_at desc);

insert into public.academy_portal_accounts (email, role, status, parent_id, created_at, updated_at)
select lower(parent.email), 'parent', 'active', parent.id, timezone('utc', now()), timezone('utc', now())
from public.academy_parents parent
where parent.email is not null
on conflict (email, role) do update
set parent_id = excluded.parent_id,
    updated_at = timezone('utc', now());

insert into public.academy_portal_accounts (email, role, status, tutor_id, created_at, updated_at)
select lower(tutor.email), 'tutor', 'active', tutor.id, timezone('utc', now()), timezone('utc', now())
from public.academy_tutors tutor
where tutor.email is not null
on conflict (email, role) do update
set tutor_id = excluded.tutor_id,
    updated_at = timezone('utc', now());

insert into public.academy_portal_accounts (email, role, status, student_id, created_at, updated_at)
select
  lower(student_user.email),
  'student',
  case when student_user.status = 'active' then 'active' else 'disabled' end,
  student_user.student_id,
  student_user.created_at,
  student_user.updated_at
from public.academy_student_users student_user
where to_regclass('public.academy_student_users') is not null
on conflict (email, role) do update
set student_id = excluded.student_id,
    status = excluded.status,
    updated_at = timezone('utc', now());

drop trigger if exists academy_portal_accounts_updated_at on public.academy_portal_accounts;
create trigger academy_portal_accounts_updated_at
before update on public.academy_portal_accounts
for each row
execute function public.set_updated_at();

drop table if exists public.academy_student_users cascade;
