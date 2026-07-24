# Unit 02: External API client

Read `CONTEXT.md` first. This file specifies one unit only.

**Prerequisite:** Unit 01 complete.

## Intent

Wrap seats.aero behind a typed, cached, server-only module so no later unit touches the network directly.

## Requirements

1. The system shall expose a single client module as the only path to the external API.
2. The system shall validate every external response against a Zod schema before use.
3. The system shall never expose the API key to the browser.
4. The system shall cache responses server-side and serve cached data by default.
5. The system shall classify failures as rate-limited, upstream-unavailable, invalid-request, or schema-mismatch.
6. The system shall, on schema mismatch, throw in development and return degraded results in production.

## Scenarios

**Given** a valid search request
**When** the client is called and the cache is cold
**Then** the external API is called once and the response is persisted

**Given** an identical request within the cache TTL
**When** the client is called
**Then** the cached result is returned without an external call

**Given** the external API returns a rate limit response
**When** the client is called
**Then** the error is classified as rate-limited and includes any retry-after value

**Given** the external API returns a payload missing a required field
**When** running in production
**Then** the affected result is dropped, the remainder returns, and the mismatch is logged

## Tasks

1. Read the seats.aero documentation; record endpoint shapes in the spec before coding
2. Resolve the §14 arrival-time question — this blocks unit 04
3. Define Zod schemas for each endpoint used
4. Implement the client with typed methods and the error taxonomy
5. Add Prisma models for `SearchRun` and `CachedResult` per §7
6. Implement the cache read/write path with a configurable TTL
7. Unit-test schema validation and each error branch against fixtures

## Out of scope

UI of any kind. Ranking — that is unit 04. Saved searches — unit 05.

## On completion

Append to `PROGRESS.md`: what was built, what was skipped and why, anything unresolved, and what the next session needs to know.
