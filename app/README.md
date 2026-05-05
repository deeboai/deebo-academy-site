# App Directory

## Purpose

This folder contains all Next.js App Router routes for the public Academy site and the Academy operational workspace.

## Major Areas

- `admin`: administrator dashboard and operational workflows.
- `api`: server endpoints such as Stripe webhooks.
- `book`: public intake flow.
- `login`: shared portal sign-in.
- `parent`, `student`, `tutor`: role-specific portals.
- `placement`: external or token-driven placement attempt routes.
- public marketing routes such as `subjects`, `pricing`, `faq`, `privacy`, and `terms`.

## Notes

Operational routes intentionally live beside the public site so one deployment can serve the full Academy workflow.
