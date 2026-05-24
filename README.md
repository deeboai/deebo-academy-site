# Deebo Academy Site

This repository now serves two things:

- the public Academy marketing site and intake form
- an admin-only intake workspace at `/admin`

Parent, student, and tutor portals have been removed from the app.

## Current Scope

- Public intake lives at `/book`.
- Admins sign in through `/login`.
- Admin intake review lives at `/admin/intake`.
- Intake detail pages support status updates, notes, and review history.

## Required Environment

Create `.env.local` from `.env.example` and set:

Public values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ACADEMY_SITE_URL`

Private values:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ACADEMY_FROM_EMAIL`
- `ACADEMY_NOTIFICATION_EMAIL`

## Supabase Setup

The current app still expects:

1. `supabase/migrations/20260503110000_academy_os_phase1_intake.sql`
2. `supabase/migrations/20260506133000_academy_portal_accounts.sql`
3. `supabase/scripts/bootstrap_academy_admin_access.sql`

`academy_portal_accounts` is now only used for admin access control.

## Local Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Verification

```bash
npm run test
npm run typecheck
npm run build
```
