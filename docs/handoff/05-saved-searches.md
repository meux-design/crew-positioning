# Unit 05: Saved searches

Read `CONTEXT.md` first. This file specifies one unit only.

**Prerequisite:** Unit 04 complete.

## Intent

Let a returning user re-run a positioning search without re-entering it.

## Requirements

1. The system shall let a user save a completed search with a label.
2. The system shall list saved searches with their last-run time.
3. The system shall re-run a saved search against current availability.
4. The system shall let a user delete a saved search.
5. The system shall scope saved searches to the owning user.

## Scenarios

**Given** a completed search
**When** the user saves it with a label
**Then** it appears in the saved list with a null last-run time

**Given** a saved search
**When** the user re-runs it
**Then** current results render and last-run time updates

**Given** a saved search belonging to another user
**When** its identifier is requested directly
**Then** the response is 404, not 403 — do not confirm existence

## Tasks

1. Add the `SavedSearch` Prisma model per §7
2. Seed a single demo user
3. Add create, list, re-run, and delete route handlers with ownership checks
4. Build the save affordance on the results view
5. Build the saved searches list
6. Add delete with confirmation
7. Test the ownership boundary explicitly

## Out of scope

Multi-user authentication. Sharing. Scheduled or background re-runs. Notifications.

## On completion

Append to `PROGRESS.md`: what was built, what was skipped and why, anything unresolved, and what the next session needs to know.
