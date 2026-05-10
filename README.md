# Deebo Academy Site

This app is the Academy production surface: public site, shared login, admin workspace, and the parent, tutor, and
student portals. It is meant to live in its own repository and deploy as `academy.deeboai.com`.

## Operational Model

The current system is built around one database-backed access model.

- `academy_portal_accounts` is the source of truth for who can enter the Academy workspace.
- Supabase Auth handles sign-in sessions and password credentials.
- Academy records such as parents, tutors, students, sessions, payments, notes, and recordings stay in the Academy
  schema and are linked to portal accounts.
- `/admin/access` is the control surface for invite, resend invite, disable access, force re-authentication, and role
  visibility.
- `/admin/workflow` is the operational queue for the core path from intake to recap.

There is no placement flow in the live Academy workflow anymore. That surface has been removed from the app and the
schema cleanup migration must stay applied.

## Required Files

The public assets already expected by the app are:

- `public/homepage_video.mp4`
- `public/branding/deebo-academy-logo-white-on-black.png`

## Environment Variables

Create a local `.env.local` from `.env.example` and set:

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

Operational rule:

- never commit real secrets, refresh tokens, or private admin emails
- keep the first admin email only in Supabase SQL editor / dashboard steps, not in tracked files
- treat `ACADEMY_NOTIFICATION_EMAIL` as a private operational mailbox, even if `ACADEMY_FROM_EMAIL` is public-facing

## Supabase Setup

Run these SQL files in Supabase SQL editor in filename order:

1. `supabase/migrations/20260506120000_remove_academy_placement.sql`
2. `supabase/migrations/20260506133000_academy_portal_accounts.sql`
3. `supabase/scripts/bootstrap_academy_admin_access.sql`
4. `supabase/migrations/20260506143000_academy_portal_rls.sql`
5. `supabase/migrations/20260506153000_academy_data_consistency.sql`
6. `supabase/migrations/20260508173000_academy_portal_session_revocation.sql`

Do not keep `ACADEMY_ADMIN_EMAILS` in deployment env. Admin authorization is now database-backed.

## Local Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Verification Commands

Use these before deployment:

```bash
npm run test
npm run typecheck
npm run build
```

## Academy Access

The shared `/login` page uses Supabase Auth sessions and routes the user to the correct Academy workspace after sign-in.

- Manage later admin, parent, tutor, and student access from `/admin/access`.
- Portal access is stored in `academy_portal_accounts` and linked to the relevant Academy record.
- Send invites and password reset emails from the admin access page.
- Use `Revoke sessions` from admin access pages when a portal account must be forced to sign in again.
- Sign in through `/login`. Admins can still go directly to `/admin`, but unauthenticated access is redirected through the shared login page.

## Core Workflow

The operational path is:

1. intake arrives through `/book`
2. admin reviews intake in `/admin/intake`
3. admin converts intake into parent and student records
4. admin creates or syncs portal access from `/admin/access`
5. admin assigns tutors on the student subject records
6. admin schedules sessions, which can sync to Google Calendar and generate a Meet link when configured
7. tutors submit notes from `/tutor`
8. admin validates notes and sends the recap
9. parents review sessions, notes, recordings, and payments from `/parent`
10. students use `/student` as a read-only session and recap workspace

`/admin/workflow` is the main queue for tracking the next blocked step in that chain.

## Payments, Email, and Scheduling

- Parent payments use Stripe Checkout from `/parent/payments`.
- Stripe webhooks update Academy payment and linked session payment status.
- Invite, reset, scheduled-session, and recap emails are sent through the Academy email layer and logged for resend from `/admin/emails`.
- Session scheduling can create or update Google Calendar events when the Google env values are configured.

## Documentation Map

- Operator checklist: [docs/ACADEMY_OPERATOR_CHECKLIST.md](/Users/amadoutoure/Documents/git_projects/deebo-academy-site/docs/ACADEMY_OPERATOR_CHECKLIST.md)
- Workflow guide: [docs/ACADEMY_WORKFLOW.md](/Users/amadoutoure/Documents/git_projects/deebo-academy-site/docs/ACADEMY_WORKFLOW.md)
- Route overview: [app/README.md](/Users/amadoutoure/Documents/git_projects/deebo-academy-site/app/README.md)
- Admin workspace: [app/admin/README.md](/Users/amadoutoure/Documents/git_projects/deebo-academy-site/app/admin/README.md)

## Netlify Setup

For the standalone Academy repository:

1. Connect the repository to a new Netlify site.
2. Leave `Base directory` empty.
3. Leave `Package directory` empty.
4. Set `Build command` to `npm run build`.
5. Leave `Publish directory` empty.
6. Leave `Functions directory` empty.
7. Add the environment variables listed above.
8. Attach `academy.deeboai.com` to the site.
9. Do not paste real secret values into repository files, PR descriptions, or public build logs.
10. Run `/admin/system` and the operator checklist after the first production deploy.
