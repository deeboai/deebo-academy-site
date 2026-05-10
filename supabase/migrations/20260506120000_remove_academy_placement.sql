update public.academy_intake_submissions
set status = 'reviewing'
where status = 'placement_required';

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

alter table public.academy_intake_submissions
  drop column if exists placement_required;

drop table if exists public.academy_placement_responses cascade;
drop table if exists public.academy_placement_attempts cascade;
drop table if exists public.academy_placement_questions cascade;
drop table if exists public.academy_placement_exams cascade;
