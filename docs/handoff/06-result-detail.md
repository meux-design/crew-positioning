# Unit 06: Result detail

Read `CONTEXT.md` first. This file specifies one unit only.

**Prerequisite:** Unit 05 complete.

## Intent

Give the user enough to decide on one option and go book it elsewhere.

## Requirements

1. The system shall open a detail view for any result without leaving the results context.
2. The system shall show the full mileage and taxes breakdown.
3. The system shall show flight number, carrier, times, cabin, and seats remaining.
4. The system shall show the data's freshness and whether it is cached or live.
5. The system shall trap focus within the detail view while open and restore it on close.
6. The system shall close on Escape.

## Scenarios

**Given** a results list
**When** the user activates a result
**Then** a slide-over opens with focus moved to it, results still mounted behind

**Given** an open slide-over
**When** the user presses Tab repeatedly
**Then** focus cycles within the slide-over and does not reach the page behind

**Given** an open slide-over
**When** the user presses Escape
**Then** it closes and focus returns to the result that opened it

**Given** a result from cached data
**When** detail renders
**Then** the cached source and retrieval time are stated

## Tasks

1. Build the slide-over from the Tailwind Plus Overlays blocks
2. Build the fare breakdown from Description Lists
3. Add the freshness and source indicator
4. Implement focus trap, restore, and Escape handling
5. Verify at 375px — this is the primary mobile surface
6. Screen reader pass on open, traverse, and close

## Out of scope

Booking. Deep links to airline sites. Price history or trend data.

## On completion

Append to `PROGRESS.md`: what was built, what was skipped and why, anything unresolved, and what the next session needs to know.
