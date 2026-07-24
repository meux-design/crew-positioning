import { describe, expect, it } from "vitest";
import { __test__ } from "@/lib/seats-aero/client";
import type { SearchRequest } from "@/lib/search-schema";

const request: SearchRequest = {
  originIata: "SFO",
  destinationIata: "LHR",
  departAfter: "2026-08-01T00:00:00.000Z",
  arriveBefore: "2026-08-03T23:00:00.000Z",
  cabin: "economy",
  seatCount: 1,
  source: "CACHED"
};

describe("seats.aero cached search normalization", () => {
  it("reads flight-level AvailabilityTrips from cached search responses", () => {
    const results = __test__.normalizeResults({
      data: [{
        ID: "availability-1",
        Source: "virginatlantic",
        Route: { OriginAirport: "SFO", DestinationAirport: "LHR" },
        AvailabilityTrips: [{
          ID: "trip-1",
          Source: "virginatlantic",
          Carriers: "VS",
          FlightNumbers: "VS20",
          RemainingSeats: 9,
          MileageCost: 50000,
          TotalTaxes: 16280,
          OriginAirport: "SFO",
          DestinationAirport: "LHR",
          DepartsAt: "2026-08-01T17:55:00Z",
          ArrivesAt: "2026-08-02T12:15:00Z",
          Cabin: "economy"
        }]
      }]
    }, request);

    expect(results).toMatchObject([{
      id: "trip-1",
      program: "virginatlantic",
      carrier: "VS",
      flightNumber: "VS20",
      seatsRemaining: 9,
      taxesCents: 16280
    }]);
  });

  it("drops cached trips with too few seats", () => {
    const results = __test__.normalizeResults({
      data: [{
        ID: "availability-1",
        AvailabilityTrips: [{
          ID: "trip-1",
          RemainingSeats: 1,
          DepartsAt: "2026-08-01T17:55:00Z",
          ArrivesAt: "2026-08-02T12:15:00Z"
        }]
      }]
    }, { ...request, seatCount: 2 });

    expect(results).toEqual([]);
  });
});
