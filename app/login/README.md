# Shared Login Route

## Purpose

This folder contains the shared Academy sign-in page at `/login`.

## Responsibilities

- authenticate users through Supabase Auth
- resolve Academy role access through `academy_portal_accounts`
- redirect users into the correct portal
- offer a choice when one email has more than one role
- force re-authentication when the portal account has been revoked after the current session was issued

## Notes

This route is the main access gateway for admin, parent, tutor, and student users.
