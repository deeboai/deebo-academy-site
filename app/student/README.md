# Student Portal Routes

## Purpose

This folder contains the authenticated student portal.

## Student Capabilities

- review upcoming and completed session details
- open the live meeting link when it is attached to a session
- read Academy-validated recap notes and homework follow-up

## Notes

Access is based on the signed-in email matching an active `student` row in `academy_portal_accounts`.

The student portal is intentionally read-only. Billing, recordings, account changes, and admin operations stay in the
parent or Academy admin workflows until the student model needs a broader surface.
