# Build Brief — Crew Positioning Optimiser

**Deliverable:** Working web application, deployed, with README
**Timebox:** One weekend
**Method:** Specification-first — write and review specs before implementation code

---

## How to use this document

This is the stable context for the project. Re-read it at the start of every working session.

It does not change. Individual work units live in separate files under `units/` and are provided one at a time alongside this document.

**Working agreement — treat these as hard constraints, not suggestions:**

1. Do not write implementation code until the specification for the current unit exists and has been reviewed.
2. When a requirement here is ambiguous or contradicted by the API docs, stop and ask. Do not guess and proceed.
3. Do not expand scope beyond §4. If you think something is missing, raise it rather than adding it.
4. Do not substitute libraries or frameworks listed in §5 without asking.
5. At the end of each unit, write a short handover note to `PROGRESS.md`: what you built, what you skipped, what you were unsure about, and anything the next session needs to know.

---

## 1. Context

Portfolio build supporting an application for a Senior Product Designer role focused on mobile tooling for airline cabin crew. The app deliberately mirrors that problem space.

Use no real airline's branding, marks, colours, or internal system names anywhere in the product. The domain framing is generic aviation crew.

## 2. Problem

Cabin crew frequently need to position — travel as a passenger to reach a duty start point, or get home after a duty ends away from base. Under time pressure and often on mobile, they need to know: what seats can I actually get, on which programs, and how much will it cost me?

Consumer award-search tools assume a leisure traveller with a flexible year-long window. Crew have a hard deadline, a fixed origin, and a strong bias toward the soonest arrival that still works.

## 3. Primary user and job story

**User:** Cabin crew member. Mobile-first, low patience, often on poor connectivity.

> When I finish a duty away from base and need to get home before my next report time, I want to see which award seats exist on flights that land in time, so I can book one without scanning six loyalty programs myself.

## 4. Scope

### In scope (v1)

| Capability | Notes |
|---|---|
| Origin/destination + date range search | Airport code entry with typeahead |
| "Arrive before" constraint | The differentiator — filters on arrival time, not departure |
| Multi-program availability | Whatever the API returns; grouped by program |
| Cabin filter | Economy / Premium / Business / First |
| Seat count filter | Default 1, up to 4 |
| Results ranked by fit | Composite of arrival buffer + points cost |
| Saved searches | Persisted per user, re-runnable |
| Result detail view | Full fare/mileage breakdown for one option |

### Explicitly out of scope

- Booking or deep-linking into airline booking flows
- Real crew rostering integration
- Push notifications
- Authentication beyond a single seeded demo user
- Payment, points balance sync, multi-tenancy

## 5. Tech stack

Do not substitute without asking.

- **Framework:** Next.js (App Router), React, TypeScript in strict mode
- **Styling:** Tailwind CSS, with Tailwind Plus Application UI blocks
- **Database:** Postgres (Supabase or Neon), accessed via Prisma
- **External API:** seats.aero — https://developers.seats.aero/
- **Validation:** Zod at every boundary — API responses, form input, environment variables
- **Testing:** Vitest for units, Playwright for one happy-path end-to-end test

### Component library usage

Use these Tailwind Plus block families:

- *Application Shells → Stacked* for the top-level layout
- *Forms* patterns adapted for the search form
- *Lists → Stacked Lists* for results
- *Overlays → Slide-overs* for result detail on mobile
- *Data Display → Description Lists* for the fare breakdown

Do not hand-roll components where a block exists.

## 6. External API integration

Read the seats.aero documentation before writing the client. Constraints to design around:

- **Rate limits exist.** Build a server-side cache layer from the start. Never call the API from the browser.
- **Cached search and live search are different endpoints** with different freshness and cost characteristics. Default to cached; expose live as an explicit user action.
- API key lives in `SEATS_AERO_API_KEY`, server-side only, never in a `NEXT_PUBLIC_*` variable.
- All external calls go through a single module at `lib/seats-aero/client.ts` with Zod-parsed responses. If the response shape drifts from the schema, fail loudly in development and degrade gracefully in production.
- Route handlers under `app/api/` proxy to the external API. The browser never sees the key.

## 7. Data model

```
User          id, email, displayName, homeBaseIata, createdAt
SavedSearch   id, userId, originIata, destinationIata,
              departAfter, arriveBefore, cabin, seatCount,
              label, createdAt, lastRunAt
SearchRun     id, savedSearchId?, requestPayload (jsonb),
              resultCount, ranAt, source (CACHED|LIVE)
CachedResult  id, searchRunId, program, carrier, flightNumber,
              departsAt, arrivesAt, cabin, mileageCost,
              taxesCents, seatsRemaining, rawPayload (jsonb)
```

Retain `rawPayload`. Storage is cheap and it protects against upstream schema surprises.

## 8. Ranking logic

Results sort by a `fitScore`, computed server-side and included in the API response so the UI can explain the ordering.

1. **Hard filter:** arrival must be before `arriveBefore`. Non-conforming results are excluded, not down-ranked.
2. **Arrival buffer:** more slack before the deadline scores higher, with diminishing returns past roughly six hours.
3. **Points cost:** lower is better, normalised across the result set.
4. **Cabin match:** exact match to the requested cabin beats an upgrade, which beats a downgrade.

Weight arrival buffer above cost. A cheap seat that lands too late is worth zero.

The UI must show why a result ranked where it did. A black-box sort is a worse product.

## 9. Design system

Original brand. Do not use marks, colours, or typography belonging to any real airline.

**Product name:** *Reposition* (working title)

### Palette

Define as semantic tokens, not raw hexes scattered through components.

| Token | Hex | Use |
|---|---|---|
| `brand-900` | `#0B1F33` | Headers, primary text on light |
| `brand-700` | `#153A5B` | Nav, filled surfaces |
| `brand-500` | `#2C6B9E` | Interactive default |
| `brand-300` | `#8FB8D6` | Hover tints, borders |
| `brand-50` | `#EEF4F9` | Subtle backgrounds |
| `accent-600` | `#B8541F` | Primary action, focus |
| `accent-500` | `#D46A2E` | Action hover |
| `accent-50` | `#FCF1EA` | Action background tint |
| `neutral-900` | `#16191C` | Body text |
| `neutral-600` | `#5A6169` | Secondary text |
| `neutral-300` | `#CBD1D7` | Dividers |
| `neutral-100` | `#F1F3F5` | Page background |
| `neutral-0` | `#FFFFFF` | Cards |

State colours — always paired with an icon or text label, never colour alone:

| Token | Hex | Meaning |
|---|---|---|
| `state-available` | `#1F6B4A` | Seats confirmed |
| `state-limited` | `#8A6410` | Low seat count |
| `state-unavailable` | `#9B2C2C` | No availability |
| `state-info` | `#2C6B9E` | Cached vs live notice |

### Contrast pairs

These ratios were derived by hand and must be verified with a contrast checker before shipping. Correct any pair that falls below 4.5:1 for body text or 3:1 for large text and non-text elements.

| Foreground | Background | Approx. ratio |
|---|---|---|
| `neutral-900` | `neutral-0` | 16:1 |
| `neutral-900` | `neutral-100` | 15:1 |
| `neutral-600` | `neutral-0` | 6:1 |
| `neutral-600` | `neutral-100` | 5.5:1 |
| `brand-900` | `neutral-0` | 15:1 |
| `brand-700` | `neutral-0` | 10:1 |
| `brand-500` | `neutral-0` | 5:1 |
| `neutral-0` | `brand-700` | 10:1 |
| `neutral-0` | `accent-600` | 5.5:1 |
| `accent-600` | `neutral-0` | 5.5:1 |
| `accent-600` | `accent-50` | 5:1 |
| `state-available` | `neutral-0` | 6:1 |
| `state-limited` | `neutral-0` | 6:1 |
| `state-unavailable` | `neutral-0` | 7:1 |

Do not use `brand-300`, `brand-50`, `neutral-300`, or `accent-500` as text colours on light backgrounds. They are surface and border tokens only.

Non-text contrast — borders, icons, focus rings — needs 3:1 minimum. `neutral-300` on `neutral-0` is below that; use it for decorative dividers only. Any border conveying the bounds of an interactive control uses `neutral-600`.

### Typography

System font stack. No webfont payload, no licensing question.

```
font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
font-mono: ui-monospace, "SF Mono", Menlo, monospace
```

Mono is for flight numbers, airport codes, and mileage figures — tabular data where character alignment aids scanning.

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Display | 30px | 600 | 1.2 | -0.02em |
| H1 | 24px | 600 | 1.25 | -0.015em |
| H2 | 20px | 600 | 1.3 | -0.01em |
| H3 | 16px | 600 | 1.4 | 0 |
| Body | 16px | 400 | 1.5 | 0 |
| Body small | 14px | 400 | 1.45 | 0 |
| Caption | 12px | 500 | 1.4 | 0.01em |
| Data (mono) | 14px | 500 | 1.4 | 0 |

Body stays at 16px on mobile. Caption is for metadata only and must never carry essential information alone.

### Spacing and radius

4px base unit — Tailwind's default scale already matches.

Radius: 4px for inputs and badges, 8px for cards and buttons, 12px for slide-overs and modals. Nothing fully rounded except avatars.

### Token layering

Define CSS custom properties on `:root` and map Tailwind to them. Components reference the semantic layer, never the primitive layer directly.

```css
:root {
  --color-surface-page: <neutral-100>;
  --color-surface-raised: <neutral-0>;
  --color-text-primary: <neutral-900>;
  --color-text-secondary: <neutral-600>;
  --color-action-primary: <accent-600>;
  --color-action-primary-hover: <accent-500>;
  --color-border-interactive: <neutral-600>;
  --color-border-decorative: <neutral-300>;
  --color-focus-ring: <accent-600>;
}
```

This is what makes re-theming a config change rather than a rebuild.

### Focus treatment

2px `accent-600` ring, 2px offset, on every interactive element. Never removed. On `accent-600` backgrounds, switch the ring to `neutral-0` to maintain non-text contrast.

## 10. Accessibility

Target WCAG 2.0 AA. Non-negotiable:

- Never encode meaning in colour alone — availability state needs an icon or text label alongside any colour
- All interactive targets at least 44×44px
- Full keyboard operability, including the slide-over
- Visible focus rings; do not remove outlines
- Form errors associated with their inputs via `aria-describedby`
- One screen reader pass before considering the work done

## 11. States to build

Every list and detail surface needs all five.

- **Empty** — no search run yet, distinct from zero results
- **Loading** — skeletons matching the final layout, not spinners
- **Populated** — the normal case
- **Zero results** — with an actionable suggestion, such as relaxing the cabin filter or widening the date window
- **Error** — distinguish rate-limited, upstream-unavailable, and invalid-input, each with its own recovery path
