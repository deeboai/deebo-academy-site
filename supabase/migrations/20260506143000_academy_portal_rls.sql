-- Portal users should only read records linked to their active portal account.
-- Admin pages continue to use the service-role client, which bypasses these policies.

create or replace function public.has_academy_parent_portal_access(target_parent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_portal_accounts account
    where account.auth_user_id = auth.uid()
      and account.status <> 'disabled'
      and account.role = 'parent'
      and account.parent_id = target_parent_id
  );
$$;

create or replace function public.has_academy_tutor_portal_access(target_tutor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_portal_accounts account
    where account.auth_user_id = auth.uid()
      and account.status <> 'disabled'
      and account.role = 'tutor'
      and account.tutor_id = target_tutor_id
  );
$$;

create or replace function public.has_academy_student_portal_access(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_portal_accounts account
    left join public.academy_students student on student.id = target_student_id
    where account.auth_user_id = auth.uid()
      and account.status <> 'disabled'
      and (
        (account.role = 'student' and account.student_id = target_student_id)
        or (account.role = 'parent' and account.parent_id = student.parent_id)
        or (
          account.role = 'tutor'
          and exists (
            select 1
            from public.academy_student_subjects subject
            where subject.student_id = target_student_id
              and subject.tutor_id = account.tutor_id
          )
        )
        or (
          account.role = 'tutor'
          and exists (
            select 1
            from public.academy_sessions session
            where session.student_id = target_student_id
              and session.tutor_id = account.tutor_id
          )
        )
      )
  );
$$;

create or replace function public.has_academy_session_portal_access(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_sessions session
    join public.academy_portal_accounts account
      on account.auth_user_id = auth.uid()
     and account.status <> 'disabled'
    where session.id = target_session_id
      and (
        (account.role = 'parent' and account.parent_id = session.parent_id)
        or (account.role = 'student' and account.student_id = session.student_id)
        or (account.role = 'tutor' and account.tutor_id = session.tutor_id)
      )
  );
$$;

create or replace function public.has_academy_family_session_portal_access(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_sessions session
    join public.academy_portal_accounts account
      on account.auth_user_id = auth.uid()
     and account.status <> 'disabled'
    where session.id = target_session_id
      and (
        (account.role = 'parent' and account.parent_id = session.parent_id)
        or (account.role = 'student' and account.student_id = session.student_id)
      )
  );
$$;

alter table public.academy_portal_accounts enable row level security;
alter table public.academy_parents enable row level security;
alter table public.academy_students enable row level security;
alter table public.academy_tutors enable row level security;
alter table public.academy_student_subjects enable row level security;
alter table public.academy_sessions enable row level security;
alter table public.academy_payments enable row level security;
alter table public.academy_session_notes enable row level security;
alter table public.academy_recordings enable row level security;

drop policy if exists "Portal users can read their own access rows" on public.academy_portal_accounts;
create policy "Portal users can read their own access rows"
on public.academy_portal_accounts
for select
to authenticated
using (
  auth_user_id = auth.uid()
  and status <> 'disabled'
);

drop policy if exists "Parent portal can read linked parent records" on public.academy_parents;
create policy "Parent portal can read linked parent records"
on public.academy_parents
for select
to authenticated
using (public.has_academy_parent_portal_access(id));

drop policy if exists "Tutor portal can read linked tutor records" on public.academy_tutors;
create policy "Tutor portal can read linked tutor records"
on public.academy_tutors
for select
to authenticated
using (public.has_academy_tutor_portal_access(id));

drop policy if exists "Portal users can read scoped student records" on public.academy_students;
create policy "Portal users can read scoped student records"
on public.academy_students
for select
to authenticated
using (public.has_academy_student_portal_access(id));

drop policy if exists "Portal users can read scoped student subjects" on public.academy_student_subjects;
create policy "Portal users can read scoped student subjects"
on public.academy_student_subjects
for select
to authenticated
using (public.has_academy_student_portal_access(student_id));

drop policy if exists "Portal users can read scoped sessions" on public.academy_sessions;
create policy "Portal users can read scoped sessions"
on public.academy_sessions
for select
to authenticated
using (public.has_academy_session_portal_access(id));

drop policy if exists "Parent portal can read scoped payments" on public.academy_payments;
create policy "Parent portal can read scoped payments"
on public.academy_payments
for select
to authenticated
using (public.has_academy_parent_portal_access(parent_id));

drop policy if exists "Portal users can read scoped validated notes" on public.academy_session_notes;
create policy "Portal users can read scoped validated notes"
on public.academy_session_notes
for select
to authenticated
using (
  admin_status in ('validated', 'emailed')
  and public.has_academy_session_portal_access(session_id)
);

drop policy if exists "Portal users can read scoped visible recordings" on public.academy_recordings;
create policy "Portal users can read scoped visible recordings"
on public.academy_recordings
for select
to authenticated
using (
  visible_to_parent
  and expires_at > timezone('utc', now())
  and public.has_academy_family_session_portal_access(session_id)
);
