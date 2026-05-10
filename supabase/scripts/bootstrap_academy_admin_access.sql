-- Run this once after the portal account migration and before deploying code that removes env-based admin access.
-- Replace the placeholder email with the real Academy admin email only inside the Supabase SQL editor.
-- Do not commit the real admin email back into this file.
insert into public.academy_portal_accounts (email, role, status)
values (lower('admin@example.invalid'), 'admin', 'active')
on conflict (email, role) do update
set status = 'active',
    disabled_at = null,
    updated_at = timezone('utc', now());
