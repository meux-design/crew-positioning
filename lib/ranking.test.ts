import { describe, expect, it } from "vitest";
import { buildCommuteComparison, deriveClearanceBand, rankResults } from "@/lib/ranking";
import type { AwardAvailabilityResult, CommuteSearchRequest } from "@/lib/search-schema";

const request: CommuteSearchRequest = {
  originIata: "SYD",
  destinationIata: "MEL",
  departAfter: "2026-08-01T00:00:00.000Z",
  arriveBefore: "2026-08-01T12:00:00.000Z",
  bufferMinutes: 90,
  cabin: "business",
  seatCount: 1,
  onloadCategory: "C",
  seniorityYears: 3,
  source: "CACHED",
  staffFares: [],
  cashFares: []
};

function award(overrides: Partial<AwardAvailabilityResult>): AwardAvailabilityResult {
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

describe("deriveClearanceBand", () => {
  it("returns likely when open seats comfortably exceed adjusted non-revs", () => {
    expect(deriveClearanceBand({
      capacity: 180,
      bookedSeats: 150,
      nonRevsListed: 8,
      onloadCategory: "A",
      seniorityYears: 10
    }).clearance).toBe("LIKELY");
  });

  it("returns unlikely when adjusted non-revs exceed likely open seats", () => {
    expect(deriveClearanceBand({
      capacity: 180,
      bookedSeats: 176,
      nonRevsListed: 12,
      onloadCategory: "D",
      seniorityYears: 0
    }).clearance).toBe("UNLIKELY");
  });
});

describe("rankResults", () => {
  it("excludes awards that arrive after the deadline", () => {
    const ranked = rankResults([award({ id: "late", arrivesAt: "2026-08-01T12:30:00.000Z" })], request);
    expect(ranked).toHaveLength(0);
  });

  it("flags tight but valid arrival buffers", () => {
    const ranked = rankResults([award({ id: "tight", arrivesAt: "2026-08-01T11:20:00.000Z" })], request);
    expect(ranked[0].ranking.isTightBuffer).toBe(true);
  });

  it("ranks awards inside the award column without a cross-column score", () => {
    const ranked = rankResults([
      award({ id: "cheap-tight", arrivesAt: "2026-08-01T11:40:00.000Z", mileageCost: 10000 }),
      award({ id: "costly-safe", arrivesAt: "2026-08-01T08:00:00.000Z", mileageCost: 45000 })
    ], request);
    expect(ranked[0].id).toBe("costly-safe");
    expect(ranked[0]).not.toHaveProperty("fitScore");
  });
});

describe("buildCommuteComparison", () => {
  it("returns partial state when manual fares are absent but awards or standby exist", () => {
    const comparison = buildCommuteComparison(request, [award({ id: "award-1" })], "2026-08-01T01:00:00.000Z");
    expect(comparison.state).toBe("partial");
    expect(comparison.columns.award.options).toHaveLength(1);
    expect(comparison.columns.staffFare.prompt).toContain("staff confirmed fare");
  });

  it("keeps expired staff fare options visible", () => {
    const comparison = buildCommuteComparison({
      ...request,
      staffFares: [{
        carrier: "QF",
        flightNumber: "QF401",
        departsAt: "2026-08-01T07:00:00.000Z",
        arrivesAt: "2026-08-01T08:40:00.000Z",
        cabin: "economy",
        amountCents: 9800,
        currency: "AUD",
        bookByAt: "2026-07-31T10:00:00.000Z",
        note: ""
      }]
    }, [], "2026-08-01T01:00:00.000Z");
    expect(comparison.columns.staffFare.options[0].isExpired).toBe(true);
    expect(comparison.columns.staffFare.options[0].certainty).toBe("expired");
  });

  it("filters manual fares that miss report deadline", () => {
    const comparison = buildCommuteComparison({
      ...request,
      cashFares: [{
        carrier: "VA",
        flightNumber: "VA999",
        departsAt: "2026-08-01T10:00:00.000Z",
        arrivesAt: "2026-08-01T13:00:00.000Z",
        cabin: "economy",
        amountCents: 12000,
        currency: "AUD",
        note: ""
      }]
    }, [], "2026-08-01T01:00:00.000Z");
    expect(comparison.columns.cash.options).toHaveLength(0);
  });
});
