## Why

Reposition currently behaves like an award-seat search tool, but the updated brief frames the real product as a commuting-crew decision aid. Cabin crew who live away from base need to compare confirmed and speculative travel routes against report time, not only find award availability.

This change updates the app and case study around the more credible SUBLOAD commute problem: standby, staff confirmed fare, cash fare, and award redemption are different options with different certainty, cost, provenance, and deadlines.

## What Changes

- Reframe the product copy, README, and UI from airline-directed positioning to crew self-funded commuting to and from base.
- Replace the single ranked award-results surface with a four-route comparison model: staff standby, staff confirmed fare, cash fare, and award redemption.
- Add report-time buffer handling so tight-but-valid arrivals remain visible and clearly flagged.
- Add seeded standby load data and derive a `LIKELY`, `UNCERTAIN`, or `UNLIKELY` clearance band from load, non-rev, onload category, and seniority inputs.
- Add user-entered staff confirmed fare and cash fare options with visible provenance and booking deadline handling for staff fares.
- Keep seats.aero as the live award source, defaulting to cached search with live search explicit.
- Rank independently within each column; do not compute one composite score across standby, staff fare, cash, and award.
- Rename saved-search behavior toward saved commutes that can be re-run.
- Update the result detail view to explain option-specific provenance, certainty, arrival buffer, cost, and ranking factors.
- Add design tokens for clearance states and route columns while preserving the existing Reposition brand system.

## Capabilities

### New Capabilities

- `commute-search`: Captures the route, report deadline, buffer, cabin, seat count, onload category, and optional manual fare inputs needed to run a commute comparison.
- `four-route-comparison`: Presents staff standby, staff confirmed fare, cash fare, and award options side by side, with each column ranked independently and no cross-column composite score.
- `standby-clearance`: Uses seeded demo load data and self-declared crew inputs to derive and explain standby clearance bands without presenting probabilities.
- `manual-fare-options`: Lets users enter staff confirmed fares and cash fares, including staff-fare booking deadlines and clear user-entered data provenance.
- `saved-commutes`: Saves repeat commute definitions per demo user and supports re-running them against current availability.
- `option-detail`: Opens a detail view for any option showing full breakdown, provenance, certainty, timing, cost, and ranking explanation.
- `app-positioning-documentation`: Documents the domain distinction, competitive landscape, seeded-data limits, and tradeoffs in the README and product copy.

### Modified Capabilities

- None. There are no existing OpenSpec baseline specs in `openspec/specs/`.

## Impact

- UI: search form, comparison surface, saved commute list, option detail slide-over, empty/loading/partial/error states, seeded-data notices, and mobile segmented-column behavior.
- Server/API: `/api/search` response shape changes from award-only results to comparison columns; seats.aero remains server-only for award options.
- Data model: Prisma schema changes from `SavedSearch`/`CachedResult` toward `SavedCommute`, `SearchRun`, `StandbyOption`, `StaffFareOption`, `CashOption`, and `AwardResult`.
- Domain logic: new standby clearance derivation, per-column ranking, report-time hard filtering, buffer flagging, and booking-deadline expiry handling.
- Tests: unit coverage for clearance derivation, per-column ranking, buffer/deadline behavior, seats.aero award normalization, and Playwright coverage for search to comparison to detail.
- Documentation: README and handoff/spec artifacts need to explain why live load data is seeded, why award data is only one column, and why the app does not combine all options into one score.
