# Parent Recording Access Route

## Purpose

This folder contains the parent-facing recording access route for one session.

## Responsibilities

- verify that the signed-in parent owns the linked session
- enforce recording visibility and expiry before opening the vendor URL
- keep raw recording URLs out of rendered parent portal HTML

## Notes

This route should only redirect when the recording is both parent-visible and still active.
