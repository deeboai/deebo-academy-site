create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.academy_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  parent_full_name text not null,
  parent_email text not null,
  parent_phone text,
  student_first_name text not null,
  grade text not null,
  subject text not null,
  course_name text,
  school_name text,
  goals text not null,
  upcoming_deadline text,
  session_format text not null check (session_format in ('online', 'in-person')),
  requested_location text,
  preferred_availability text,
  referral_source text,
  status text not null default 'new',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  accepted_client_agreement boolean not null default false,
  accepted_terms boolean not null default false,
  accepted_privacy boolean not null default false
);

alter table public.academy_intake_submissions
  add column if not exists course_name text,
  add column if not exists school_name text,
  add column if not exists upcoming_deadline text,
  add column if not exists requested_location text,
  add column if not exists preferred_availability text,
  add column if not exists referral_source text,
  add column if not exists admin_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid;

alter table public.academy_intake_submissions
  alter column updated_at set default timezone('utc', now());

alter table public.academy_intake_submissions
  drop constraint if exists academy_intake_submissions_status_check;

alter table public.academy_intake_submissions
  add constraint academy_intake_submissions_status_check
  check (
    status in (
      'new',
      'reviewing',
      'needs_follow_up',
      'approved',
      'rejected',
      'converted'
    )
  );

create index if not exists academy_intake_submissions_status_created_at_idx
on public.academy_intake_submissions (status, created_at desc);

create index if not exists academy_intake_submissions_parent_email_idx
on public.academy_intake_submissions (lower(parent_email));

drop trigger if exists academy_intake_submissions_updated_at on public.academy_intake_submissions;
create trigger academy_intake_submissions_updated_at
before update on public.academy_intake_submissions
for each row
execute function public.set_updated_at();

create table if not exists public.academy_intake_status_events (
  id uuid primary key default gen_random_uuid(),
  intake_submission_id uuid not null references public.academy_intake_submissions(id) on delete cascade,
  previous_status text,
  next_status text not null,
  changed_by uuid,
  changed_by_email text,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists academy_intake_status_events_submission_idx
on public.academy_intake_status_events (intake_submission_id, created_at desc);

alter table public.academy_intake_submissions enable row level security;

drop policy if exists "Academy intake submissions can be created publicly" on public.academy_intake_submissions;
create policy "Academy intake submissions can be created publicly"
on public.academy_intake_submissions
for insert
to anon, authenticated
with check (
  accepted_client_agreement
  and accepted_terms
  and accepted_privacy
  and char_length(trim(parent_full_name)) > 1
  and char_length(trim(parent_email)) > 3
  and char_length(trim(student_first_name)) > 0
  and char_length(trim(grade)) > 0
  and char_length(trim(subject)) > 0
  and char_length(trim(course_name)) > 0
  and char_length(trim(goals)) > 0
  and char_length(trim(upcoming_deadline)) > 0
  and char_length(trim(preferred_availability)) > 0
  and session_format in ('online', 'in-person')
);
