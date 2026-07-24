import { describe, expect, it } from "vitest";
import { rankResults } from "@/lib/ranking";
import type { AvailabilityResult, SearchRequest } from "@/lib/search-schema";

const request: SearchRequest = {
  originIata: "SYD",
  destinationIata: "MEL",
  departAfter: "2026-08-01T00:00:00.000Z",
  arriveBefore: "2026-08-01T12:00:00.000Z",
  cabin: "business",
  seatCount: 1,
  source: "CACHED"
};

function result(overrides: Partial<AvailabilityResult>): AvailabilityResult {
  return {
    id: "base",
    program: "Aeroplan",
    carrier: "AX",
    flightNumber: "AX101",
    originIata: "SYD",
    destinationIata: "MEL",
    departsAt: "2026-08-01T06:00:00.000Z",
    arrivesAt: "2026-08-01T10:00:00.000Z",
    cabin: "business",
    mileageCost: 30000,
    taxesCents: 9000,
    seatsRemaining: 2,
    source: "CACHED",
    fetchedAt: "2026-08-01T00:00:00.000Z",
    rawPayload: {},
    ...overrides
  };
}

describe("rankResults", () => {
  it("excludes flights that arrive after the deadline", () => {
    const ranked = rankResults([result({ id: "late", arrivesAt: "2026-08-01T12:30:00.000Z" })], request);
    expect(ranked).toHaveLength(0);
  });

  it("weights arrival buffer above points cost", () => {
    const ranked = rankResults([
      result({ id: "cheap-tight", arrivesAt: "2026-08-01T11:40:00.000Z", mileageCost: 10000 }),
      result({ id: "costly-safe", arrivesAt: "2026-08-01T08:00:00.000Z", mileageCost: 45000 })
    ], request);
    expect(ranked[0].id).toBe("costly-safe");
  });

  it("scores exact cabin matches above upgrades", () => {
    const ranked = rankResults([
      result({ id: "upgrade", cabin: "first" }),
      result({ id: "exact", cabin: "business" })
    ], request);
    expect(ranked[0].id).toBe("exact");
  });
});
