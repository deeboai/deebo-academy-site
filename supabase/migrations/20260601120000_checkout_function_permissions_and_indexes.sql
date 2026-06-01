create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create index if not exists checkout_enrollments_access_code_id_idx
on public.checkout_enrollments (access_code_id);

create index if not exists checkout_enrollments_promo_code_id_idx
on public.checkout_enrollments (promo_code_id);

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
