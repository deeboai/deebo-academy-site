create table if not exists public.academy_testimonials (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  class_year text not null,
  tutor_name text not null,
  subject text not null,
  impression text,
  video_path text,
  video_url text,
  moderation_status text not null default 'pending',
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint academy_testimonials_moderation_status_check
    check (moderation_status in ('pending', 'approved', 'rejected'))
);

create index if not exists academy_testimonials_published_created_idx
on public.academy_testimonials (is_published, created_at desc);

drop trigger if exists academy_testimonials_updated_at on public.academy_testimonials;
create trigger academy_testimonials_updated_at
before update on public.academy_testimonials
for each row
execute function public.set_updated_at();

alter table public.academy_testimonials enable row level security;

drop policy if exists "Published testimonials can be read publicly" on public.academy_testimonials;
create policy "Published testimonials can be read publicly"
on public.academy_testimonials
for select
to anon, authenticated
using (is_published);

drop policy if exists "Testimonials can be submitted publicly" on public.academy_testimonials;
create policy "Testimonials can be submitted publicly"
on public.academy_testimonials
for insert
to anon, authenticated
with check (
  moderation_status = 'pending'
  and is_published = false
);
