alter table public.academy_intake_submissions
  add column if not exists converted_parent_id uuid,
  add column if not exists converted_student_id uuid,
  add column if not exists converted_student_subject_id uuid;

create table if not exists public.academy_parents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  stripe_customer_id text,
  created_from_intake_id uuid references public.academy_intake_submissions(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists academy_parents_email_idx
on public.academy_parents (lower(email));

create table if not exists public.academy_students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.academy_parents(id),
  first_name text not null,
  last_name text,
  grade text not null,
  school_name text,
  status text not null default 'active',
  created_from_intake_id uuid references public.academy_intake_submissions(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_tutors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subjects text[] not null default '{}',
  levels text[] not null default '{}',
  hourly_rate_cents integer,
  status text not null default 'active',
  internal_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists academy_tutors_email_idx
on public.academy_tutors (lower(email));

create table if not exists public.academy_student_subjects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.academy_students(id) on delete cascade,
  subject text not null,
  course_name text,
  level text,
  tutor_id uuid references public.academy_tutors(id),
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.academy_students(id),
  parent_id uuid references public.academy_parents(id),
  tutor_id uuid references public.academy_tutors(id),
  student_subject_id uuid references public.academy_student_subjects(id),
  subject text not null,
  course_name text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  format text not null default 'online',
  location text,
  meeting_url text,
  google_calendar_event_id text,
  status text not null default 'scheduled',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_payments (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.academy_parents(id),
  student_id uuid references public.academy_students(id),
  session_id uuid references public.academy_sessions(id),
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  session_count integer,
  amount_cents integer not null,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_session_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.academy_sessions(id) on delete cascade,
  tutor_id uuid references public.academy_tutors(id),
  what_was_covered text not null,
  student_understood text not null,
  student_struggled_with text not null,
  recommended_homework text,
  came_prepared boolean not null default false,
  parent_follow_up_needed boolean not null default false,
  internal_concern boolean not null default false,
  continue_same_pace boolean not null default true,
  tutor_private_notes text,
  admin_status text not null default 'submitted',
  admin_feedback text,
  validated_by uuid,
  validated_at timestamptz,
  emailed_to_parent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.academy_sessions(id) on delete cascade,
  recording_url text not null,
  storage_provider text not null default 'manual',
  visible_to_parent boolean not null default true,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  template text not null,
  status text not null default 'pending',
  provider text not null default 'resend',
  provider_message_id text,
  error_message text,
  related_type text,
  related_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz
);

create table if not exists public.academy_placement_exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  grade_band text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_placement_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.academy_placement_exams(id) on delete cascade,
  subject text not null,
  grade_band text,
  topic text not null,
  question_type text not null,
  question_text text not null,
  choices jsonb,
  correct_answer text,
  rubric text,
  difficulty text default 'medium',
  points numeric not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_placement_attempts (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid references public.academy_intake_submissions(id),
  student_id uuid references public.academy_students(id),
  exam_id uuid references public.academy_placement_exams(id),
  status text not null default 'assigned',
  started_at timestamptz,
  submitted_at timestamptz,
  total_score numeric,
  ai_recommendation text,
  admin_recommendation text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  access_token text default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_placement_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.academy_placement_attempts(id) on delete cascade,
  question_id uuid references public.academy_placement_questions(id),
  response text not null,
  auto_score numeric,
  ai_score numeric,
  ai_feedback text,
  ai_confidence text,
  ai_missing_concepts jsonb,
  ai_recommended_next_topic text,
  admin_score numeric,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists academy_placement_responses_attempt_question_idx
on public.academy_placement_responses (attempt_id, question_id);

create table if not exists public.academy_curriculum_lessons (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  unit text not null,
  topic text not null,
  slug text not null,
  title text not null,
  objective text not null,
  prerequisites text,
  tutor_notes text,
  in_session_examples text,
  common_mistakes text,
  practice_problems text,
  homework text,
  answer_key text,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists academy_curriculum_lessons_slug_idx
on public.academy_curriculum_lessons (subject, slug);

drop trigger if exists academy_parents_updated_at on public.academy_parents;
create trigger academy_parents_updated_at
before update on public.academy_parents
for each row
execute function public.set_updated_at();

drop trigger if exists academy_students_updated_at on public.academy_students;
create trigger academy_students_updated_at
before update on public.academy_students
for each row
execute function public.set_updated_at();

drop trigger if exists academy_tutors_updated_at on public.academy_tutors;
create trigger academy_tutors_updated_at
before update on public.academy_tutors
for each row
execute function public.set_updated_at();

drop trigger if exists academy_student_subjects_updated_at on public.academy_student_subjects;
create trigger academy_student_subjects_updated_at
before update on public.academy_student_subjects
for each row
execute function public.set_updated_at();

drop trigger if exists academy_sessions_updated_at on public.academy_sessions;
create trigger academy_sessions_updated_at
before update on public.academy_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists academy_payments_updated_at on public.academy_payments;
create trigger academy_payments_updated_at
before update on public.academy_payments
for each row
execute function public.set_updated_at();

drop trigger if exists academy_session_notes_updated_at on public.academy_session_notes;
create trigger academy_session_notes_updated_at
before update on public.academy_session_notes
for each row
execute function public.set_updated_at();

drop trigger if exists academy_recordings_updated_at on public.academy_recordings;
create trigger academy_recordings_updated_at
before update on public.academy_recordings
for each row
execute function public.set_updated_at();

drop trigger if exists academy_curriculum_lessons_updated_at on public.academy_curriculum_lessons;
create trigger academy_curriculum_lessons_updated_at
before update on public.academy_curriculum_lessons
for each row
execute function public.set_updated_at();
