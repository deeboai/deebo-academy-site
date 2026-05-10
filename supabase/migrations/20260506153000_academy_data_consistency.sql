-- Normalize historical rows before adding stricter guards for future writes.
update public.academy_sessions
set payment_status = 'pending'
where payment_status is null
   or payment_status = 'unpaid'
   or payment_status not in ('pending', 'paid', 'failed', 'refunded', 'waived');

update public.academy_sessions
set status = 'scheduled'
where status is null
   or status not in (
     'draft',
     'scheduled',
     'completed',
     'cancelled',
     'no_show',
     'rescheduled',
     'notes_submitted',
     'notes_validated',
     'recap_sent'
   );

update public.academy_payments
set status = 'pending'
where status is null
   or status not in ('pending', 'paid', 'failed', 'refunded', 'waived');

update public.academy_payments
set currency = lower(currency)
where currency is not null;

update public.academy_session_notes
set admin_status = 'submitted'
where admin_status is null
   or admin_status not in ('submitted', 'needs_revision', 'validated', 'emailed');

-- These checks are added as NOT VALID so deployment can succeed before a later validation pass.
alter table public.academy_sessions
  alter column payment_status set default 'pending';

alter table public.academy_sessions
  drop constraint if exists academy_sessions_status_check;

alter table public.academy_sessions
  add constraint academy_sessions_status_check
  check (
    status in (
      'draft',
      'scheduled',
      'completed',
      'cancelled',
      'no_show',
      'rescheduled',
      'notes_submitted',
      'notes_validated',
      'recap_sent'
    )
  ) not valid;

alter table public.academy_sessions
  drop constraint if exists academy_sessions_payment_status_check;

alter table public.academy_sessions
  add constraint academy_sessions_payment_status_check
  check (
    payment_status in ('pending', 'paid', 'failed', 'refunded', 'waived')
  ) not valid;

alter table public.academy_sessions
  drop constraint if exists academy_sessions_time_range_check;

alter table public.academy_sessions
  add constraint academy_sessions_time_range_check
  check (starts_at < ends_at) not valid;

alter table public.academy_payments
  drop constraint if exists academy_payments_status_check;

alter table public.academy_payments
  add constraint academy_payments_status_check
  check (
    status in ('pending', 'paid', 'failed', 'refunded', 'waived')
  ) not valid;

alter table public.academy_payments
  drop constraint if exists academy_payments_amount_nonnegative_check;

alter table public.academy_payments
  add constraint academy_payments_amount_nonnegative_check
  check (amount_cents >= 0) not valid;

alter table public.academy_payments
  drop constraint if exists academy_payments_currency_lowercase_check;

alter table public.academy_payments
  add constraint academy_payments_currency_lowercase_check
  check (currency = lower(currency) and char_length(trim(currency)) > 0) not valid;

alter table public.academy_session_notes
  drop constraint if exists academy_session_notes_admin_status_check;

alter table public.academy_session_notes
  add constraint academy_session_notes_admin_status_check
  check (
    admin_status in ('submitted', 'needs_revision', 'validated', 'emailed')
  ) not valid;

alter table public.academy_session_notes
  drop constraint if exists academy_session_notes_validation_metadata_check;

alter table public.academy_session_notes
  add constraint academy_session_notes_validation_metadata_check
  check (
    (
      admin_status in ('submitted', 'needs_revision')
      and validated_by is null
      and validated_at is null
      and emailed_to_parent_at is null
    )
    or (
      admin_status = 'validated'
      and validated_by is not null
      and validated_at is not null
      and emailed_to_parent_at is null
    )
    or (
      admin_status = 'emailed'
      and validated_by is not null
      and validated_at is not null
      and emailed_to_parent_at is not null
    )
  ) not valid;

create or replace function public.prevent_duplicate_academy_student()
returns trigger
language plpgsql
as $$
declare
  conflicting_student_id uuid;
begin
  -- Family-linked students dedupe within a parent; unlinked students dedupe by core identity plus school.
  select student.id
  into conflicting_student_id
  from public.academy_students student
  where student.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and lower(student.first_name) = lower(new.first_name)
    and lower(coalesce(student.last_name, '')) = lower(coalesce(new.last_name, ''))
    and lower(student.grade) = lower(new.grade)
    and (
      (
        student.parent_id is not distinct from new.parent_id
        and new.parent_id is not null
      )
      or (
        student.parent_id is null
        and new.parent_id is null
        and lower(coalesce(student.school_name, '')) = lower(coalesce(new.school_name, ''))
      )
    )
  limit 1;

  if conflicting_student_id is not null then
    raise exception
      using errcode = '23505',
            message = 'A matching student record already exists for this family or unlinked student profile.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_duplicate_academy_student_subject()
returns trigger
language plpgsql
as $$
declare
  conflicting_subject_id uuid;
begin
  -- A student should not accumulate duplicate subject/course records through repeated intake or admin edits.
  select subject.id
  into conflicting_subject_id
  from public.academy_student_subjects subject
  where subject.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and subject.student_id is not distinct from new.student_id
    and lower(subject.subject) = lower(new.subject)
    and lower(coalesce(subject.course_name, '')) = lower(coalesce(new.course_name, ''))
  limit 1;

  if conflicting_subject_id is not null then
    raise exception
      using errcode = '23505',
            message = 'A matching student subject record already exists for this student.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_academy_session_consistency()
returns trigger
language plpgsql
as $$
declare
  linked_parent_id uuid;
  linked_student_id uuid;
begin
  -- Sessions are the operational backbone, so parent, student, subject, and time range must agree.
  if new.starts_at >= new.ends_at then
    raise exception
      using errcode = '23514',
            message = 'Session end time must be later than session start time.';
  end if;

  if new.student_id is null or new.parent_id is null then
    raise exception
      using errcode = '23514',
            message = 'Sessions must always be linked to both a student and a parent.';
  end if;

  select student.parent_id
  into linked_parent_id
  from public.academy_students student
  where student.id = new.student_id;

  if linked_parent_id is null then
    raise exception
      using errcode = '23514',
            message = 'The linked student must exist and must be connected to a parent before a session can be saved.';
  end if;

  if linked_parent_id <> new.parent_id then
    raise exception
      using errcode = '23514',
            message = 'Session parent_id must match the linked student parent_id.';
  end if;

  if new.student_subject_id is not null then
    select subject.student_id
    into linked_student_id
    from public.academy_student_subjects subject
    where subject.id = new.student_subject_id;

    if linked_student_id is null then
      raise exception
        using errcode = '23514',
              message = 'The selected student subject record does not exist.';
    end if;

    if linked_student_id <> new.student_id then
      raise exception
        using errcode = '23514',
              message = 'Session student_subject_id must belong to the linked student.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_academy_payment_consistency()
returns trigger
language plpgsql
as $$
declare
  session_parent_id uuid;
  session_student_id uuid;
begin
  -- Payment records may be standalone, but any linked session must belong to the same family pair.
  new.currency = lower(new.currency);

  if new.amount_cents < 0 then
    raise exception
      using errcode = '23514',
            message = 'Payment amount_cents cannot be negative.';
  end if;

  if new.session_id is not null then
    select session.parent_id, session.student_id
    into session_parent_id, session_student_id
    from public.academy_sessions session
    where session.id = new.session_id;

    if session_parent_id is null or session_student_id is null then
      raise exception
        using errcode = '23514',
              message = 'Payments can only link to sessions that have both a parent and a student.';
    end if;

    if new.parent_id <> session_parent_id or new.student_id <> session_student_id then
      raise exception
        using errcode = '23514',
              message = 'Payment parent_id and student_id must match the linked session.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_academy_session_note_consistency()
returns trigger
language plpgsql
as $$
declare
  session_tutor_id uuid;
begin
  -- Tutor notes are only valid when they stay attached to the session's assigned tutor.
  select session.tutor_id
  into session_tutor_id
  from public.academy_sessions session
  where session.id = new.session_id;

  if session_tutor_id is null then
    raise exception
      using errcode = '23514',
            message = 'Session notes can only be saved for sessions with an assigned tutor.';
  end if;

  if new.tutor_id <> session_tutor_id then
    raise exception
      using errcode = '23514',
            message = 'Session note tutor_id must match the linked session tutor_id.';
  end if;

  return new;
end;
$$;

drop trigger if exists academy_students_prevent_duplicates on public.academy_students;
create trigger academy_students_prevent_duplicates
before insert or update on public.academy_students
for each row
execute function public.prevent_duplicate_academy_student();

drop trigger if exists academy_student_subjects_prevent_duplicates on public.academy_student_subjects;
create trigger academy_student_subjects_prevent_duplicates
before insert or update on public.academy_student_subjects
for each row
execute function public.prevent_duplicate_academy_student_subject();

drop trigger if exists academy_sessions_consistency_guard on public.academy_sessions;
create trigger academy_sessions_consistency_guard
before insert or update on public.academy_sessions
for each row
execute function public.validate_academy_session_consistency();

drop trigger if exists academy_payments_consistency_guard on public.academy_payments;
create trigger academy_payments_consistency_guard
before insert or update on public.academy_payments
for each row
execute function public.validate_academy_payment_consistency();

drop trigger if exists academy_session_notes_consistency_guard on public.academy_session_notes;
create trigger academy_session_notes_consistency_guard
before insert or update on public.academy_session_notes
for each row
execute function public.validate_academy_session_note_consistency();
