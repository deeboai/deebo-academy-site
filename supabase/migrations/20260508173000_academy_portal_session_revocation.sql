alter table public.academy_portal_accounts
  add column if not exists force_reauth_after timestamptz;

comment on column public.academy_portal_accounts.force_reauth_after is
  'When set, Academy portal requests must re-authenticate if their current session predates this timestamp.';
