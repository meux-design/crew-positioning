## 1. Domain Model And Schemas

- [x] 1.1 Rename search-domain language in shared types from saved search/results toward commute comparison terminology.
- [x] 1.2 Add Zod schemas for commute search inputs including report-time buffer, onload category, seniority input, cabin, seat count, and manual fare options.
- [x] 1.3 Define TypeScript types for standby, staff fare, cash, award, comparison columns, certainty labels, provenance labels, and detail payloads.
- [x] 1.4 Update Prisma schema with `User`, `SavedCommute`, `SearchRun`, `StandbyOption`, `StaffFareOption`, `CashOption`, and `AwardResult` models from the brief.

## 2. Standby And Comparison Logic

- [x] 2.1 Add seeded standby load fixtures for reliable demo routes with capacity, booked seats, non-revs listed, taxes, carrier, flight number, timing, and notes.
- [x] 2.2 Implement standby clearance derivation returning `LIKELY`, `UNCERTAIN`, or `UNLIKELY` with explainable inputs and no percentages.
- [x] 2.3 Implement arrival-deadline hard filtering across all option types.
- [x] 2.4 Implement report-time buffer flagging for tight-but-valid options.
- [x] 2.5 Implement booking-deadline expiry handling for staff fare options.
- [x] 2.6 Refactor ranking so options are ranked independently within each column and no cross-column score is produced.
- [x] 2.7 Unit-test clearance derivation, buffer flagging, deadline expiry, and per-column ranking.

## 3. API And Data Flow

- [x] 3.1 Update `/api/search` to return a commute comparison response with standby, staff fare, cash, and award columns.
- [x] 3.2 Keep seats.aero award lookup server-only and map cached trips into the award column.
- [x] 3.3 Accept manual staff fare and cash fare inputs in the search payload and include valid options in their columns.
- [x] 3.4 Return partially populated comparison states when manual options are absent but standby or award options exist.
- [x] 3.5 Preserve differentiated errors for invalid input, rate-limited seats.aero, upstream unavailable, and schema mismatch.

## 4. User Interface

- [x] 4.1 Update product copy to frame Reposition as a self-funded crew commute decision tool rather than deadheading or award-only search.
- [x] 4.2 Extend the search form with report-time buffer, onload category, seniority input, and manual staff fare/cash fare entry controls.
- [x] 4.3 Replace the award-only list with a four-route comparison shell.
- [x] 4.4 Add mobile segmented navigation for the four columns and tablet/desktop side-by-side comparison.
- [x] 4.5 Label every option with certainty and provenance using icons plus text, never color alone.
- [x] 4.6 Add persistent seeded-data notices wherever standby load figures appear.
- [x] 4.7 Implement empty, loading, populated, zero-result, partially populated, seeded-data notice, and error states.

## 5. Saved Commutes

- [x] 5.1 Rename saved-search UI to saved commutes.
- [x] 5.2 Persist saved commute fields including buffer minutes and standby profile defaults for the demo user.
- [x] 5.3 Re-run saved commutes against current award availability and seeded/manual comparison data.
- [x] 5.4 Update last-run timestamps after successful re-runs.
- [x] 5.5 Add delete confirmation and not-found behavior for out-of-scope commute identifiers.

## 6. Detail View

- [x] 6.1 Update the slide-over to support standby, staff fare, cash, and award option detail variants.
- [x] 6.2 Show standby load inputs and clearance explanation in standby detail.
- [x] 6.3 Show staff fare booking deadline and expiry state in staff fare detail.
- [x] 6.4 Show user-entered provenance in staff fare and cash detail.
- [x] 6.5 Show seats.aero source, freshness, mileage, taxes, seats remaining, and cabin in award detail.
- [x] 6.6 Preserve focus trap, Escape close, and focus restoration behavior.

## 7. Design Tokens And Accessibility

- [x] 7.1 Add clearance tokens and column tokens to Tailwind and CSS custom properties.
- [x] 7.2 Verify contrast for new clearance and column states and adjust any failing text/icon pair.
- [x] 7.3 Ensure all interactive controls remain at least 44x44px on mobile.
- [x] 7.4 Associate all form errors with fields via `aria-describedby`.
- [x] 7.5 Run a keyboard pass across search, comparison columns, manual entry, saved commutes, and detail slide-over.

## 8. Documentation And Case Study

- [x] 8.1 Update README to explain SUBLOAD/self-funded commuting versus space-positive deadheading.
- [x] 8.2 Add competitive landscape notes for StaffTraveler, Staff Airlines, and FlyStandby.
- [x] 8.3 Document that standby load data is seeded demo data and not live airline-system data.
- [x] 8.4 Document that seats.aero award availability is one supporting route and may be cached.
- [x] 8.5 Explain why the app avoids one cross-column composite score.

## 9. Verification And Release

- [x] 9.1 Update Vitest coverage for schemas, comparison response mapping, clearance bands, and ranking.
- [x] 9.2 Update Playwright happy path to cover search to comparison to option detail at mobile viewport.
- [x] 9.3 Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- [x] 9.4 Verify the updated deployed app at `crew.meux.com.au`.
- [x] 9.5 Record any remaining v1 limitations or open questions before archiving the OpenSpec change.
