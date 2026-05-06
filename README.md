# Deebo Academy Site

This app is meant to live in its own repository and deploy as `academy.deeboai.com`.

## Required Files

The public assets already expected by the app are:

- `public/homepage_video.mp4`
- `public/branding/deebo-academy-logo-white-on-black.png`

## Environment Variables

Create a local `.env.local` from `.env.example` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ACADEMY_FROM_EMAIL`
- `ACADEMY_NOTIFICATION_EMAIL`
- `ACADEMY_ADMIN_EMAILS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALENDAR_ID`
- `OPENAI_API_KEY`

## Local Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Academy Access

The shared `/login` page uses Supabase Auth sessions and routes the user to the correct Academy workspace after sign-in.

- Create the admin user accounts in Supabase Auth.
- Set `ACADEMY_ADMIN_EMAILS` to a comma-separated allowlist such as `admin1@example.com,admin2@example.com`.
- Create parent, tutor, and student Auth users in Supabase with the same emails stored in the Academy tables.
- Parent portal access matches `academy_parents.email`.
- Tutor portal access matches `academy_tutors.email`.
- Student portal access matches `academy_student_users.email`.
- Sign in through `/login`. Admins can still go directly to `/admin`, but unauthenticated access is redirected through the shared login page.

## Netlify Setup

For the standalone Academy repository:

1. Connect the repository to a new Netlify site.
2. Leave `Base directory` empty.
3. Leave `Package directory` empty.
4. Set `Build command` to `npm run build`.
5. Leave `Publish directory` empty.
6. Leave `Functions directory` empty.
7. Add the six environment variables listed above.
8. Attach `academy.deeboai.com` to the site.
