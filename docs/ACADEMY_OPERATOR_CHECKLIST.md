# Academy Operator Checklist

## Before Deploy

1. Confirm the target Supabase project.
2. Confirm the admin email that should be bootstrapped.
3. Keep all real secrets and private admin emails out of tracked files.

## Required SQL

Run these in Supabase SQL editor:

1. `supabase/migrations/20260503110000_academy_os_phase1_intake.sql`
2. `supabase/migrations/20260506133000_academy_portal_accounts.sql`
3. `supabase/scripts/bootstrap_academy_admin_access.sql`

## Required Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ACADEMY_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ACADEMY_FROM_EMAIL`
- `ACADEMY_NOTIFICATION_EMAIL`

## Validation

1. Submit a test intake through `/book`.
2. Sign in as admin through `/login`.
3. Confirm the intake appears in `/admin/intake`.
4. Open the intake detail page and confirm status updates and admin notes persist.
