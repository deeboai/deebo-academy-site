create table if not exists public.checkout_plans (
  id text primary key,
  name text not null,
  monthly_price_cents integer not null check (monthly_price_cents >= 0),
  description text not null,
  included_features text[] not null default '{}'::text[],
  sort_order integer not null default 100,
  badge text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint checkout_plans_id_check check (id in ('light', 'support', 'intensive'))
);

create table if not exists public.checkout_access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses >= 0),
  use_count integer not null default 0 check (use_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint checkout_access_codes_window_check check (
    expires_at is null
    or starts_at is null
    or expires_at >= starts_at
  ),
  constraint checkout_access_codes_use_count_check check (
    max_uses is null
    or use_count <= max_uses
  )
);

create table if not exists public.checkout_promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  normalized_code text generated always as (lower(btrim(code))) stored,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  percentage_off numeric(6, 2),
  amount_off_cents integer,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions >= 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  applies_to_plans text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint checkout_promo_codes_window_check check (
    expires_at is null
    or starts_at is null
    or expires_at >= starts_at
  ),
  constraint checkout_promo_codes_discount_shape_check check (
    (discount_type = 'percentage' and percentage_off is not null and percentage_off >= 0 and percentage_off <= 100 and amount_off_cents is null)
    or (discount_type = 'fixed_amount' and amount_off_cents is not null and amount_off_cents >= 0 and percentage_off is null)
  ),
  constraint checkout_promo_codes_redemption_count_check check (
    max_redemptions is null
    or redemption_count <= max_redemptions
  )
);

create unique index if not exists checkout_promo_codes_normalized_code_key
on public.checkout_promo_codes (normalized_code);

create table if not exists public.checkout_enrollments (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  parent_email text not null,
  student_name text,
  plan_id text not null,
  plan_name text not null,
  payment_method_type text not null check (payment_method_type in ('ach', 'card')),
  base_price_cents integer not null check (base_price_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  card_adjustment_cents integer not null default 0 check (card_adjustment_cents >= 0),
  final_total_cents integer not null check (final_total_cents >= 0),
  promo_code text,
  promo_code_id uuid references public.checkout_promo_codes(id) on delete set null,
  access_code_id uuid not null references public.checkout_access_codes(id) on delete restrict,
  access_code_label text,
  stripe_customer_id text,
  stripe_checkout_session_id text not null,
  stripe_subscription_id text,
  stripe_invoice_id text,
  status text not null default 'pending' check (
    status in ('pending', 'checkout_completed', 'active', 'payment_failed', 'past_due', 'canceled', 'expired')
  ),
  legal_acceptance_timestamp timestamptz not null,
  client_agreement_version text not null,
  terms_version text not null,
  privacy_policy_version text not null,
  checkout_completed_at timestamptz,
  payment_confirmed_at timestamptz,
  success_accounted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint checkout_enrollments_plan_id_check check (plan_id in ('light', 'support', 'intensive'))
);

create unique index if not exists checkout_enrollments_stripe_checkout_session_id_key
on public.checkout_enrollments (stripe_checkout_session_id);

create unique index if not exists checkout_enrollments_stripe_subscription_id_key
on public.checkout_enrollments (stripe_subscription_id)
where stripe_subscription_id is not null;

create unique index if not exists checkout_enrollments_stripe_invoice_id_key
on public.checkout_enrollments (stripe_invoice_id)
where stripe_invoice_id is not null;

create index if not exists checkout_enrollments_parent_email_idx
on public.checkout_enrollments (parent_email);

drop trigger if exists checkout_plans_updated_at on public.checkout_plans;
create trigger checkout_plans_updated_at
before update on public.checkout_plans
for each row
execute function public.set_updated_at();

drop trigger if exists checkout_access_codes_updated_at on public.checkout_access_codes;
create trigger checkout_access_codes_updated_at
before update on public.checkout_access_codes
for each row
execute function public.set_updated_at();

drop trigger if exists checkout_promo_codes_updated_at on public.checkout_promo_codes;
create trigger checkout_promo_codes_updated_at
before update on public.checkout_promo_codes
for each row
execute function public.set_updated_at();

drop trigger if exists checkout_enrollments_updated_at on public.checkout_enrollments;
create trigger checkout_enrollments_updated_at
before update on public.checkout_enrollments
for each row
execute function public.set_updated_at();

alter table public.checkout_plans enable row level security;
alter table public.checkout_access_codes enable row level security;
alter table public.checkout_promo_codes enable row level security;
alter table public.checkout_enrollments enable row level security;

create or replace function public.apply_checkout_enrollment_event(
  target_checkout_session_id text default null,
  target_stripe_subscription_id text default null,
  target_stripe_invoice_id text default null,
  target_stripe_customer_id text default null,
  next_status text default 'pending',
  mark_checkout_completed boolean default false,
  mark_success boolean default false
)
returns public.checkout_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  enrollment_row public.checkout_enrollments;
begin
  if next_status not in ('pending', 'checkout_completed', 'active', 'payment_failed', 'past_due', 'canceled', 'expired') then
    raise exception 'Unsupported checkout enrollment status: %', next_status;
  end if;

  select *
  into enrollment_row
  from public.checkout_enrollments
  where (
    target_checkout_session_id is not null
    and stripe_checkout_session_id = target_checkout_session_id
  )
  or (
    target_stripe_subscription_id is not null
    and stripe_subscription_id = target_stripe_subscription_id
  )
  or (
    target_stripe_invoice_id is not null
    and stripe_invoice_id = target_stripe_invoice_id
  )
  order by created_at asc
  limit 1
  for update;

  if not found then
    return null;
  end if;

  update public.checkout_enrollments
  set
    stripe_customer_id = coalesce(target_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = coalesce(target_stripe_subscription_id, stripe_subscription_id),
    stripe_invoice_id = coalesce(target_stripe_invoice_id, stripe_invoice_id),
    status = next_status,
    checkout_completed_at = case
      when mark_checkout_completed then coalesce(checkout_completed_at, timezone('utc', now()))
      else checkout_completed_at
    end,
    payment_confirmed_at = case
      when mark_success then coalesce(payment_confirmed_at, timezone('utc', now()))
      else payment_confirmed_at
    end
  where id = enrollment_row.id
  returning * into enrollment_row;

  if mark_success and enrollment_row.success_accounted_at is null then
    if enrollment_row.promo_code_id is not null then
      update public.checkout_promo_codes
      set redemption_count = redemption_count + 1
      where id = enrollment_row.promo_code_id;
    end if;

    update public.checkout_access_codes
    set use_count = use_count + 1
    where id = enrollment_row.access_code_id;

    update public.checkout_enrollments
    set success_accounted_at = timezone('utc', now())
    where id = enrollment_row.id
    returning * into enrollment_row;
  end if;

  return enrollment_row;
end;
$$;

insert into public.checkout_plans (
  id,
  name,
  monthly_price_cents,
  description,
  included_features,
  sort_order,
  badge,
  active
)
values
  (
    'light',
    'Light',
    14900,
    'Steady weekly support for students who need consistent help without the heaviest schedule.',
    array[
      '1 live session each week',
      'Session notes after each meeting',
      'Assigned practice between sessions',
      'Email follow-up for parent coordination'
    ]::text[],
    10,
    null,
    true
  ),
  (
    'support',
    'Support',
    29900,
    'The standard plan for recurring tutoring, test prep, and ongoing academic repair.',
    array[
      'Up to 2 live sessions each week',
      'Session notes and practice after each meeting',
      'Progress check-ins for families',
      'Priority scheduling compared with Light'
    ]::text[],
    20,
    'Recommended',
    true
  ),
  (
    'intensive',
    'Intensive',
    59900,
    'Higher-frequency support for major catch-up periods, demanding courses, or exam-heavy stretches.',
    array[
      'Multiple weekly sessions for heavier support',
      'Detailed progress tracking',
      'Priority scheduling for urgent academic needs',
      'Planning support for exams and major deadlines'
    ]::text[],
    30,
    null,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  monthly_price_cents = excluded.monthly_price_cents,
  description = excluded.description,
  included_features = excluded.included_features,
  sort_order = excluded.sort_order,
  badge = excluded.badge,
  active = excluded.active;

insert into public.checkout_promo_codes (
  code,
  discount_type,
  percentage_off,
  amount_off_cents,
  active,
  applies_to_plans
)
values (
  'DEEBOFOUNDER25',
  'percentage',
  25,
  null,
  true,
  null
)
on conflict (normalized_code) do update
set
  discount_type = excluded.discount_type,
  percentage_off = excluded.percentage_off,
  amount_off_cents = excluded.amount_off_cents,
  active = excluded.active,
  applies_to_plans = excluded.applies_to_plans;
