alter table if exists public.checkout_plans
  add column if not exists monthly_hours integer;

update public.checkout_plans
set monthly_hours = case id
  when 'light' then 4
  when 'support' then 8
  when 'core' then 8
  when 'intensive' then 12
  else monthly_hours
end
where monthly_hours is null;

alter table if exists public.checkout_plans
  alter column monthly_hours set not null;

alter table if exists public.checkout_plans
  drop constraint if exists checkout_plans_id_check;

alter table if exists public.checkout_plans
  add constraint checkout_plans_id_check
  check (id in ('light', 'core', 'intensive'));

alter table if exists public.checkout_enrollments
  drop constraint if exists checkout_enrollments_plan_id_check;

alter table if exists public.checkout_enrollments
  add constraint checkout_enrollments_plan_id_check
  check (plan_id in ('light', 'core', 'intensive'));

alter table if exists public.checkout_access_codes
  add column if not exists encrypted_code text,
  add column if not exists last_used_at timestamptz,
  add column if not exists student_first_name text,
  add column if not exists student_last_name text,
  add column if not exists parent_contact_name text,
  add column if not exists parent_contact_email text,
  add column if not exists approved_plan_id text,
  add column if not exists allowed_payment_methods text[] not null default array['ach', 'card']::text[],
  add column if not exists internal_note text,
  add column if not exists created_by_email text,
  add column if not exists default_promo_code_id uuid,
  add column if not exists default_promo_code_code text;

alter table if exists public.checkout_access_codes
  drop constraint if exists checkout_access_codes_approved_plan_id_check;

alter table if exists public.checkout_access_codes
  add constraint checkout_access_codes_approved_plan_id_check
  check (
    approved_plan_id is null
    or approved_plan_id in ('light', 'core', 'intensive')
  );

create index if not exists checkout_access_codes_parent_contact_email_idx
on public.checkout_access_codes (parent_contact_email);

create index if not exists checkout_access_codes_approved_plan_id_idx
on public.checkout_access_codes (approved_plan_id);

alter table if exists public.checkout_promo_codes
  add column if not exists can_combine_with_access_code boolean not null default true,
  add column if not exists assigned_contact_email text,
  add column if not exists internal_note text,
  add column if not exists stripe_coupon_id text,
  add column if not exists stripe_promotion_code_id text;

update public.checkout_enrollments
set
  plan_id = 'core',
  plan_name = 'Core Support'
where plan_id = 'support';

update public.checkout_access_codes
set approved_plan_id = 'core'
where approved_plan_id = 'support';

update public.checkout_promo_codes
set applies_to_plans = array(
  select case
    when plan_id = 'support' then 'core'
    else plan_id
  end
  from unnest(applies_to_plans) as plan_id
)
where applies_to_plans is not null
  and applies_to_plans @> array['support'];

insert into public.checkout_plans (
  id,
  name,
  monthly_price_cents,
  monthly_hours,
  description,
  included_features,
  sort_order,
  badge,
  active
)
values
  (
    'light',
    'Light Support',
    22900,
    4,
    'For students who need steady weekly help without a heavier schedule.',
    array[
      '1–2 hour session blocks',
      'Session notes after each session',
      'Assigned homework or practice',
      'Extra student questions between sessions',
      'Best for light weekly support'
    ]::text[],
    10,
    null,
    true
  ),
  (
    'core',
    'Core Support',
    42900,
    8,
    'For students who need consistent support, test preparation, or help catching up.',
    array[
      '1–2 hour session blocks',
      'Session notes after each session',
      'Assigned homework or practice',
      'Extra student questions between sessions',
      'Weekly progress summary',
      'Priority scheduling'
    ]::text[],
    20,
    'Recommended',
    true
  ),
  (
    'intensive',
    'Intensive Support',
    62900,
    12,
    'For demanding courses, catch-up periods, or exam-heavy months.',
    array[
      '1–2 hour session blocks',
      'Session notes after each session',
      'Assigned homework or practice',
      'Extra student questions between sessions',
      'Deeper exam planning',
      'Highest scheduling priority'
    ]::text[],
    30,
    null,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  monthly_price_cents = excluded.monthly_price_cents,
  monthly_hours = excluded.monthly_hours,
  description = excluded.description,
  included_features = excluded.included_features,
  sort_order = excluded.sort_order,
  badge = excluded.badge,
  active = excluded.active;

delete from public.checkout_plans
where id = 'support';

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
    set
      use_count = use_count + 1,
      last_used_at = timezone('utc', now())
    where id = enrollment_row.access_code_id;

    update public.checkout_enrollments
    set success_accounted_at = timezone('utc', now())
    where id = enrollment_row.id
    returning * into enrollment_row;
  end if;

  return enrollment_row;
end;
$$;

revoke all on function public.apply_checkout_enrollment_event(
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean
) from public, anon, authenticated;

grant execute on function public.apply_checkout_enrollment_event(
  text,
  text,
  text,
  text,
  text,
  boolean,
  boolean
) to service_role;

create index if not exists checkout_enrollments_access_code_id_idx
on public.checkout_enrollments (access_code_id);

create index if not exists checkout_enrollments_promo_code_id_idx
on public.checkout_enrollments (promo_code_id);
