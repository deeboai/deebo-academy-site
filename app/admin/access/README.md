# Admin Access

## Purpose

This route manages database-backed portal access for admins, parents, tutors, and students.

## Notes

- Access rows live in `academy_portal_accounts`.
- Admins should send invites from this page after creating or syncing the linked Academy record.
- Password reset emails, disable/enable access, and forced re-auth are also managed from this surface.
- Disabled rows are blocked during login even if the Supabase Auth user still exists.
- Session revocation is enforced through the Academy access model by forcing the next portal request to re-authenticate.
