# App Directory

## Purpose

This folder contains all Next.js App Router routes for the public Academy site and the Academy operational workspace.

## Major Areas

- `auth`: Academy sign-out and forced re-auth routes.
- `admin`: administrator dashboard and operational workflows.
- `api`: server endpoints such as Stripe webhooks.
- `book`: public intake flow.
- `login`: shared portal sign-in.
- `parent`, `student`, `tutor`: role-specific portals.
- public marketing routes such as `subjects`, `pricing`, `faq`, `privacy`, and `terms`.

## Notes

Operational routes intentionally live beside the public site so one deployment can serve the full Academy workflow.
The highest-level operational sequence is documented in
[docs/ACADEMY_WORKFLOW.md](/Users/amadoutoure/Documents/git_projects/deebo-academy-site/docs/ACADEMY_WORKFLOW.md).
