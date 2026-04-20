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

## Local Run

```bash
npm install
npm run dev
```

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
