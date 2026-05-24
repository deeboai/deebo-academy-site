# Login Route

This folder contains the Academy admin sign-in page at `/login`.

## Responsibilities

- authenticate admins through Supabase Auth
- verify that the signed-in email is linked to an active admin row in `academy_portal_accounts`
- redirect successful sign-in to `/admin`
