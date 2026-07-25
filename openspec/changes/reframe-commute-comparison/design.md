## Context

The current app is a working Next.js prototype centered on seats.aero award availability. The updated brief reframes Reposition as a commuting-crew decision tool for self-funded travel to and from base. The product must compare four routes: staff standby, staff confirmed fare, cash fare, and award redemption.

The central domain distinction is that this is not airline-directed deadheading. It serves the SUBLOAD/personal commute case where the crew member weighs cost against certainty before report time. Award availability remains useful, but it becomes one option among four rather than the whole product.

Current implementation assets to keep:
- Next.js App Router, TypeScript strict mode, Tailwind tokens, Zod validation, Vitest, Playwright.
- Server-only seats.aero client in `lib/seats-aero/client.ts`.
- Arrival-before hard filtering and explainable ranking logic.
- Mobile-first layout, saved-search affordance, and result detail slide-over.

Current implementation assets to replace or extend:
- Award-only search form and results list.
- `SavedSearch`/`CachedResult` naming and schema.
- Single composite fit score across all results.
- Demo data that only mimics award results.

## Goals / Non-Goals

**Goals:**
- Build a comparison model with four independently ranked columns: standby, staff fare, cash, and award.
- Keep arrival deadline as the hard filter across every option type.
- Add report-time buffer flagging without hiding tight-but-valid options.
- Label provenance everywhere: seeded standby data, user-entered fares, and seats.aero award data.
- Derive standby clearance bands from explainable load inputs without using probabilities.
- Let users save and re-run repeat commutes.
- Update README and product copy so the portfolio argument matches the commuting-crew problem.

**Non-Goals:**
- Do not book flights or deep-link into airline booking flows.
- Do not integrate with airline crew systems, GDS cash fares, staff fare systems, or live load data.
- Do not scrape airline systems or imply seeded load data is live.
- Do not add multi-user authentication beyond a seeded demo user.
- Do not combine cash, points, and standby risk into one cross-column score.

## Decisions

1. **Use a comparison response instead of a flat result list.**
   - Decision: `/api/search` returns columns keyed by option type, each with its own options and metadata.
   - Rationale: standby, staff fare, cash, and award differ in certainty, currency, provenance, and deadlines. A single sorted list implies false equivalence.
   - Alternative considered: keep one flat ranked list with a type badge. Rejected because it hides the confirmed-versus-speculative distinction.

2. **Rank within columns only.**
   - Decision: rank every column independently using arrival buffer, cost within the column, cabin match, and standby clearance where applicable.
   - Rationale: comparing points against cash or standby risk requires personal assumptions. The app should surface tradeoffs, not bury them.
   - Alternative considered: convert points and risk into a shared dollar-equivalent score. Rejected as too speculative for v1.

3. **Model standby data as seeded demo inputs.**
   - Decision: create a deterministic seeded standby dataset with capacity, booked seats, non-revs listed, taxes, and notes.
   - Rationale: no public live load API is available; seeded data is honest for a weekend portfolio build and supports the decision model.
   - Alternative considered: crowdsourcing or scraping. Rejected as out of scope and potentially unauthorized.

4. **Derive clearance bands from visible inputs.**
   - Decision: compute `LIKELY`, `UNCERTAIN`, or `UNLIKELY` from seats open, adjusted non-revs ahead, onload category, and seniority input.
   - Rationale: the UI can explain the estimate with concrete inputs rather than pretending to know a precise probability.
   - Alternative considered: percentage clearance probability. Rejected because the data is seeded/self-declared and lacks precision.

5. **Keep manual staff fare and cash fare entry in the search flow.**
   - Decision: staff fare and cash columns may be empty until the user enters options, producing a partially populated state.
   - Rationale: v1 has no live staff fare or GDS integration. User-entered values are transparent and useful for the decision.
   - Alternative considered: omit manual columns until integrations exist. Rejected because the four-route comparison is the product thesis.

6. **Use mobile segmented navigation for the columns.**
   - Decision: on narrow viewports, show one option column at a time behind a segmented control; on wider viewports, show columns side by side.
   - Rationale: four columns will not fit well at 375px, and mobile is the primary surface.
   - Alternative considered: horizontal scroll. Rejected as harder to compare and easier to miss context.

7. **Preserve the server-only seats.aero boundary.**
   - Decision: award data continues to flow through `lib/seats-aero/client.ts` and `/api/search`; the API key remains server-only.
   - Rationale: this preserves rate-limit control and keeps credentials out of the browser.
   - Alternative considered: direct browser calls. Rejected for security and rate-limit reasons.

## Risks / Trade-offs

- **Seeded standby data may look fake** -> Mitigate with persistent seeded-data labels, README explanation, and realistic but clearly demo-only inputs.
- **Four-column comparison can overwhelm mobile users** -> Mitigate with segmented navigation, concise cards, and detail slide-over.
- **Manual fare entry adds friction** -> Mitigate by allowing partially populated results and prompting users to add missing fare options after standby/award results load.
- **Existing award ranking code may not map cleanly to columns** -> Mitigate by extracting shared ranking factors and testing each column independently.
- **Data model rename from saved search to saved commute may touch many files** -> Mitigate with focused migration and compatibility notes in tasks.
- **Live seats.aero may not be available for the account** -> Mitigate by keeping cached search default and surfacing live-search errors clearly.

## Migration Plan

1. Add domain types and Zod schemas for commute search, option columns, clearance bands, and manual fare inputs.
2. Extend the API route to return comparison columns while preserving server-only seats.aero access.
3. Add seeded standby data and clearance derivation.
4. Refactor UI from award list to four-route comparison shell.
5. Rename saved searches to saved commutes in UI and persistence.
6. Update detail view, README, tests, and accessibility coverage.
7. Deploy behind the existing Vercel project and verify at `crew.meux.com.au`.

Rollback strategy: keep changes isolated in the OpenSpec branch until implementation is complete. If deployment fails, revert to the previous production deployment in Vercel.

## Open Questions

- What exact onload category control should v1 use: free text, category picker, or seniority slider?
- Which demo routes should have seeded standby loads so the portfolio can reliably show populated columns?
- Should award results stay visible if the four-route comparison proves that awards are a secondary or rarely useful option?
- What cache TTL should production use after observing seats.aero response behavior and rate-limit headroom?
