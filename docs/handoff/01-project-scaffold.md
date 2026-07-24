# Unit 01: Project scaffold

Read `CONTEXT.md` first. This file specifies one unit only.

**Prerequisite:** None — this is the first unit.

## Intent

Stand up the repository so every later unit has a working foundation.

## Requirements

1. The system shall build and typecheck with zero errors under TypeScript strict mode.
2. The system shall fail to start if any required environment variable is missing or malformed.
3. The system shall expose a health route returning application status and database connectivity.
4. The system shall apply the §9 design tokens as CSS custom properties consumed by Tailwind.
5. The system shall run lint, typecheck, and tests in CI on every push.

## Scenarios

**Given** a developer clones the repo and omits `SEATS_AERO_API_KEY`
**When** they start the dev server
**Then** startup fails with a message naming the missing variable

**Given** the app is running with a reachable database
**When** the health route is requested
**Then** it responds 200 with database status `connected`

**Given** a component references `--color-action-primary`
**When** the page renders
**Then** the computed colour matches the `accent-600` hex in §9

## Tasks

1. Initialise Next.js with App Router and TypeScript strict
2. Configure Tailwind; add the §9 palette, type scale, and radius values
3. Define semantic CSS custom properties on `:root`; map Tailwind to them
4. Add Prisma; configure the Postgres connection
5. Add a Zod-validated environment module, imported at startup
6. Add the health route
7. Configure Vitest and Playwright with one smoke test each
8. Add CI running lint, typecheck, and tests

## Out of scope

Any external API calls. Any UI beyond a placeholder page. Database tables — schema comes in unit 02.

## On completion

Append to `PROGRESS.md`: what was built, what was skipped and why, anything unresolved, and what the next session needs to know.
