# Reposition

Reposition is a mobile-first decision tool for cabin crew who self-fund commutes to and from base. It focuses on the SUBLOAD/personal commute problem: choosing between staff standby, staff confirmed fares, public cash fares, and award redemptions before a hard report-time deadline.

This is intentionally different from airline-directed, space-positive deadheading. Deadheading is operational travel assigned by an airline; Reposition is for the crew member who lives away from base and needs to weigh certainty, cost, provenance, and arrival buffer for a personal commute.

## What is built

- Next.js App Router, React, TypeScript strict mode, Tailwind tokens, Zod boundary validation
- Four independent comparison columns: staff standby, staff confirmed fare, cash fare, and award redemption
- Arrival-before hard filtering across every option type
- Report-time buffer flags for tight-but-valid arrivals
- Seeded standby load fixtures with capacity, booked seats, non-revs listed, taxes, notes, and derived clearance bands
- Manual staff fare and cash fare entry with user-entered provenance and staff-fare booking expiry
- Server-only seats.aero award lookup, defaulting to cached search with live search explicit
- Saved commutes for the seeded demo user via local storage, including buffer and standby profile defaults
- Type-specific option detail slide-over with focus trapping, Escape close, and focus restoration
- Prisma schema for the intended Postgres persistence model
- Vitest coverage for schemas, seats.aero normalization, clearance, filtering, expiry, and ranking

## Product Position

Adjacent crew tools such as StaffTraveler, Staff Airlines, and FlyStandby are strongest around load visibility, requests, and staff-travel workflows. Reposition sits in the next decision layer: once a commuter has some load signal, a possible confirmed staff fare, a public cash fare, or an award option, the product helps compare the tradeoffs against report time.

The app does not combine every route into one score. Points, cash, and standby risk depend on personal assumptions: how a crew member values certainty, mileage balances, taxes, and the pain of a misconnect. Reposition ranks options inside each column and makes the tradeoffs visible instead of pretending those currencies convert cleanly.

## Data Honesty

Standby load data in v1 is seeded demo data, not live airline-system data. The seeded records exist so the portfolio app can demonstrate capacity, booked seats, non-revs listed, onload category, seniority inputs, and clearance explanations without scraping or integrating with restricted crew systems.

Award availability comes from seats.aero and is one supporting route, not the whole product. Cached search is the default because it is faster and gentler on rate limits; live search remains explicit and may depend on seats.aero account access.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app defaults to demo mode so the portfolio experience works without external credentials. To call seats.aero, set `SEATS_AERO_API_KEY` and switch `NEXT_PUBLIC_APP_MODE=production`.

## Environment

Copy `.env.example` to `.env.local` and fill values as needed.

`SEATS_AERO_API_KEY` is server-side only. Never expose it through a `NEXT_PUBLIC_*` variable.

## API Notes

`/api/search` returns a commute comparison response with `standby`, `staffFare`, `cash`, and `award` columns. The seats.aero client remains isolated in `lib/seats-aero/client.ts` so upstream schema drift fails loudly and API credentials never reach the browser.

## V1 Limitations

- No booking flow or airline deep links
- No live airline load, GDS cash fare, or staff fare system integration
- No scraping of crew systems
- No multi-user authentication beyond a seeded demo-user concept
- Standby clearance bands are explainable estimates, not numeric probabilities

## Accessibility

The UI uses visible focus rings, 44px interactive targets, text plus icons for certainty/provenance, semantic labels with descriptions, mobile segmented column navigation, and a dialog surface for option detail.

## Handoff Source

The original project handoff bundle is preserved under `docs/handoff`.
