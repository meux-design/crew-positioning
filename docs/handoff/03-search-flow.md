# Unit 03: Search flow

Read `CONTEXT.md` first. This file specifies one unit only.

**Prerequisite:** Unit 02 complete.

## Intent

The core interaction: enter a positioning need, get back available seats.

## Requirements

1. The system shall accept origin, destination, departure window, arrive-before time, cabin, and seat count.
2. The system shall validate input client-side and server-side against one shared schema.
3. The system shall exclude results arriving after the arrive-before time.
4. The system shall group results by loyalty program.
5. The system shall render all five states from §11.
6. The system shall let the user request live rather than cached data as an explicit action.
7. The system shall remain fully operable by keyboard and meet §10 throughout.

## Scenarios

**Given** the search form is empty
**When** the page first loads
**Then** the empty state renders, distinct from a zero-results state

**Given** a submitted search
**When** results are pending
**Then** skeletons matching the final layout render, not a spinner

**Given** results exist but all arrive after the deadline
**When** results render
**Then** the zero-results state shows with a suggestion to widen the window

**Given** a user pressing Tab from the first field
**When** they traverse the form
**Then** focus order matches visual order and every stop has a visible ring

## Tasks

1. Build the search form from the Tailwind Plus Forms blocks
2. Define one Zod schema shared by client and server validation
3. Add airport code typeahead
4. Add the route handler calling the unit 02 client
5. Build the results list from Stacked Lists, grouped by program
6. Implement all five states from §11
7. Add the cached/live toggle with a clear freshness indicator
8. Keyboard and screen reader pass

## Out of scope

Ranking — results may render in arbitrary order for now. Result detail — unit 06. Persistence of searches — unit 05.

## On completion

Append to `PROGRESS.md`: what was built, what was skipped and why, anything unresolved, and what the next session needs to know.
