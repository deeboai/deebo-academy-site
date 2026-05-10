# Admin System Health

## Purpose

This route shows operational readiness across env wiring, Supabase dependencies, and pending SQL work.

## Notes

- The page is intentionally admin-only.
- It surfaces the portal-account, data-consistency, and forced-re-auth migrations because those require manual execution in Supabase.
- The detailed rollout checklist lives in `docs/ACADEMY_OPERATOR_CHECKLIST.md`.
