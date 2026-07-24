# Reposition

Award seat search for airline crew positioning. Reposition is a mobile-first prototype that helps a cabin crew member search award-seat availability against a hard arrival deadline, then ranks options by fit instead of making the user scan programs manually.

## What is built

- Next.js App Router, React, TypeScript strict mode, Tailwind tokens from the handoff brief
- Server-only seats.aero client boundary at `lib/seats-aero/client.ts`
- Zod validation for environment and search payloads
- Demo-mode availability data when `SEATS_AERO_API_KEY` is absent
- Arrival-before hard filtering and explainable fit scoring
- Results grouped by loyalty program
- Saved searches for the seeded demo user via local storage
- Mobile result detail slide-over with fare, freshness, and ranking breakdown
- Prisma schema for the intended Postgres persistence model
- Vitest ranking coverage and a Playwright happy path

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app defaults to demo mode so the portfolio experience works without external credentials. To call seats.aero, set `SEATS_AERO_API_KEY` and switch `NEXT_PUBLIC_APP_MODE=production`. Live search is exposed as an explicit action, but seats.aero currently documents live search as commercial-partner access.

## Environment

Copy `.env.example` to `.env.local` and fill values as needed.

`SEATS_AERO_API_KEY` is server-side only. Never expose it through a `NEXT_PUBLIC_*` variable.

## API notes

The implementation follows the seats.aero documentation for cached search (`GET /partnerapi/search`) and live search (`POST /partnerapi/live`). The project keeps the integration behind one module so upstream schema drift has one place to fail loudly during development and degrade gracefully in production.

## Accessibility

The UI uses visible focus rings, 44px interactive targets, text labels alongside status color, semantic form labels, and a dialog surface for result detail. A full Lighthouse and screen reader pass remains before public deployment.

## Handoff source

The original project handoff bundle is preserved under `docs/handoff`.
