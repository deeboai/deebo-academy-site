# Academy Workflow

## Purpose

This document explains the Academy operational workflow from first contact through session recap, with the current
roles, systems, and handoffs.

## System Roles

- `admin`: runs intake, conversion, access, assignment, scheduling, review, recap, payment operations, and system checks
- `parent`: reviews students, sessions, validated recaps, recordings, and payments; can pay open balances
- `tutor`: reviews assigned students and sessions, then submits or revises notes
- `student`: read-only view of sessions, meeting links, validated recaps, and homework follow-up

All portal roles are defined in `academy_portal_accounts`.

## Access Lifecycle

1. Admin creates or identifies the Academy record first: parent, tutor, or student.
2. Admin creates or syncs the linked portal account from `/admin/access`.
3. The system generates a Supabase Auth invite or reset link.
4. The Academy email layer sends the branded email and logs the delivery in `academy_email_logs`.
5. The user signs in through `/login`.
6. Academy access resolution reads the portal account and routes the user into the correct workspace.

If access must be paused:

- disable the portal account to block future portal use
- revoke sessions to force the next request back through sign-in

## Core Workflow

### 1. Intake

- Public intake starts in `/book`.
- Admin reviews the intake queue in `/admin/intake`.
- Status changes are auditable.

### 2. Conversion

- Admin converts approved intake into parent and student records.
- Duplicate-prevention and consistency rules apply during conversion.
- Converted intake records link forward to the created Academy records.

### 3. Access Setup

- Admin uses `/admin/access` to create or sync portal access.
- This can create access for admins, parents, tutors, and students.
- Invite and reset emails are sent from the Academy email layer, not from a default Supabase email template alone.

### 4. Tutor Assignment

- Admin links a tutor to the student subject record.
- `/admin/workflow` treats missing tutor assignment as a blocked next step.

### 5. Scheduling

- Admin creates a session from the session admin workflow.
- If Google Calendar is configured, the system attempts to create or update the calendar event automatically.
- For online sessions without a manual meeting URL, the system can generate a Google Meet link and write it back to the session.
- Scheduled-session emails can be sent and resent from the admin email workflow.

### 6. Session Delivery

- Tutors use `/tutor` to review their workload and open assigned sessions.
- Tutors can see student context, note state, and revision feedback before submitting notes.

### 7. Note Review

- Tutors submit notes.
- Admin reviews notes in `/admin/session-notes`.
- Notes can move through `submitted`, `needs_revision`, `validated`, and `emailed`.
- `emailed` is not a manual admin entry state; it follows recap sending.

### 8. Recap

- Admin can only send a recap from a validated note.
- Recap emails include the protected parent recording path instead of a raw vendor recording URL.
- Parent users can review the validated recap from the portal.

### 9. Payment

- Admin creates and manages operational payment records.
- Parents see open and historical payments in `/parent/payments`.
- `Pay now` launches Stripe Checkout.
- Stripe webhooks update payment status and linked session payment status.

### 10. Recording Access

- Recordings are attached as managed metadata around an external recording URL.
- Parent access is enforced through a protected route and the `visible_to_parent` plus expiry rules.
- Students do not have recording access in the current model.
- Admin can hide, show, expire, preview, and extend recording availability from the session admin page.

## Admin Control Surfaces

- `/admin`: summary dashboard
- `/admin/workflow`: next blocked operational step
- `/admin/access`: portal account management
- `/admin/emails`: delivery log, preview, resend
- `/admin/system`: environment and rollout health

## Audit Coverage

The system now records audit events for:

- portal account lifecycle changes
- intake conversion
- parent, student, and tutor edits
- tutor assignment
- session changes
- payment changes
- note review
- recap send
- recording access and availability changes

## Minimum Production Validation

1. Admin sign-in works through `/login`.
2. `/admin/system` shows the expected healthy configuration.
3. A parent invite can be sent, accepted, and routed correctly.
4. A tutor can view an assigned session and submit notes.
5. A validated note can be turned into a recap email.
6. A parent can pay an open payment through Stripe Checkout.
7. A scheduled session can sync to Google Calendar when env is configured.
