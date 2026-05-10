# Academy Operator Checklist

## Purpose

This checklist is the operational path for moving the Academy repo toward production without relying on memory or scattered README notes.

Use this together with [docs/ACADEMY_WORKFLOW.md](/Users/amadoutoure/Documents/git_projects/deebo-academy-site/docs/ACADEMY_WORKFLOW.md).

## Before SQL

1. Confirm the target Supabase project and Netlify site.
2. Confirm the first Academy admin email that should be bootstrapped.
3. Confirm the production Academy URL for `NEXT_PUBLIC_ACADEMY_SITE_URL`.
4. Keep real admin emails, refresh tokens, and secret keys out of tracked repo files.

## Supabase SQL

Run these in Supabase SQL editor in filename order:

1. `supabase/migrations/20260506120000_remove_academy_placement.sql`
2. `supabase/migrations/20260506133000_academy_portal_accounts.sql`
3. `supabase/scripts/bootstrap_academy_admin_access.sql`
4. `supabase/migrations/20260506143000_academy_portal_rls.sql`
5. `supabase/migrations/20260506153000_academy_data_consistency.sql`
6. `supabase/migrations/20260508173000_academy_portal_session_revocation.sql`

## Environment

Set these values in the deployment environment:

Public values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ACADEMY_SITE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Private values:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ACADEMY_FROM_EMAIL`
- `ACADEMY_NOTIFICATION_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_REFRESH_TOKEN`

Remove this old env if it still exists:

- `ACADEMY_ADMIN_EMAILS`

Deployment hygiene:

- keep private values only in Netlify/Supabase dashboards or local ignored env files
- do not place real secrets or private admin emails in `.env.example`, SQL scripts, README text, PR descriptions, or public build output

## Admin Validation

1. Sign in as the bootstrapped admin through `/login`.
2. Open `/admin/system` and confirm the Supabase and bootstrap checks are healthy.
3. Open `/admin/access` and confirm the admin row exists.
4. Create a non-admin portal access row and send an invite.
5. Complete the invite flow with a real test account.
6. Use `Revoke sessions` on a test account and confirm the next portal request forces sign-in again.
7. Open `/admin/emails` and confirm the invite or reset email was logged.

## Portal Validation

1. Confirm parent login only sees linked students, sessions, and payments.
2. Confirm tutor login only sees assigned sessions and student context.
3. Confirm student login only sees linked student sessions.
4. Confirm disabled portal accounts can no longer use the portal.
5. Confirm forced re-auth sends a revoked user back through `/login`.

## Workflow Validation

1. Convert an intake into parent and student records.
2. Assign a tutor to the student subject.
3. Create a session.
4. Confirm the session appears in `/admin/workflow` until notes are submitted.
5. Submit tutor notes.
6. Validate the notes from admin.
7. Send the recap email.
8. Confirm the recap email appears in `/admin/emails`.
9. Confirm the parent can view the validated recap in `/parent`.

## Payments and Scheduling Validation

1. Create a payment record linked to a session.
2. Confirm the parent sees the open payment in `/parent/payments`.
3. Complete a Stripe Checkout payment with a test card.
4. Confirm the Stripe webhook updates both the payment row and the linked session payment status.
5. Create or update a session with Google Calendar env configured.
6. Confirm the calendar event syncs and that online sessions can receive a Meet link automatically.

## Recording Validation

1. Attach a recording to a completed session.
2. Confirm the parent only receives the protected Academy recording path, not the raw vendor URL.
3. Confirm expired or hidden recordings are blocked in the parent portal.
4. Confirm admin preview still works for the same session.

## Rollback

If the portal-account rollout needs to pause:

1. Stop sending new invites.
2. Keep admin work on the existing records only.
3. Do not apply the RLS migration until the portal-account migration and bootstrap step are confirmed.
4. Fix data or env issues first, then re-test from `/admin/system`.
5. Re-run the build, typecheck, and test commands before the next deploy attempt.
