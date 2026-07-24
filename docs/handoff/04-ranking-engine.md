# Unit 04: Ranking engine

Read `CONTEXT.md` first. This file specifies one unit only.

**Prerequisite:** Unit 03 complete.

## Intent

Order results by fit, and make the ordering explainable in the UI.

## Requirements

1. The system shall compute a fitScore server-side for every result.
2. The system shall exclude, not down-rank, results violating the arrive-before constraint.
3. The system shall weight arrival buffer above points cost.
4. The system shall apply diminishing returns to arrival buffer beyond roughly six hours.
5. The system shall normalise points cost across the result set.
6. The system shall return per-factor contributions alongside the score.
7. The system shall surface in the UI why each result ranked where it did.

## Scenarios

**Given** two results, one cheaper but arriving 20 minutes before the deadline and one costlier arriving four hours before
**When** ranked
**Then** the costlier, earlier-arriving result ranks higher

**Given** a result arriving after the deadline
**When** ranked
**Then** it is absent from the response entirely

**Given** two results identical but for cabin
**When** the request specified Business
**Then** the exact Business match ranks above the First upgrade

**Given** any ranked result
**When** the user opens its ranking explanation
**Then** each contributing factor and its weight are shown in plain language

## Tasks

1. Implement fitScore as a pure, unit-testable function
2. Implement the hard arrival filter ahead of scoring
3. Implement buffer scoring with the diminishing-returns curve
4. Implement cost normalisation across the set
5. Implement cabin match scoring
6. Extend the API response with per-factor contributions
7. Build the ranking explanation UI on each result row
8. Unit-test each factor in isolation and the composite together

## Out of scope

Personalised or learned weights. User-configurable weighting. Both are out of scope for v1.

## On completion

Append to `PROGRESS.md`: what was built, what was skipped and why, anything unresolved, and what the next session needs to know.
