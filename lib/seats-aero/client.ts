import { z } from "zod";
import { buildDemoResults } from "@/lib/demo-data";
import { env, isDemoMode } from "@/lib/env";
import type { AvailabilityResult, SearchRequest } from "@/lib/search-schema";

export type SeatsAeroFailureKind = "rate-limited" | "upstream-unavailable" | "invalid-request" | "schema-mismatch";

export class SeatsAeroError extends Error {
  constructor(
    public kind: SeatsAeroFailureKind,
    message: string,
    public retryAfter?: string
  ) {
    super(message);
  }
}

const availabilityTripSchema = z.object({
  ID: z.string().optional(),
  Source: z.string().optional(),
  Carriers: z.string().optional(),
  FlightNumbers: z.string().optional(),
  OriginAirport: z.string().optional(),
  DestinationAirport: z.string().optional(),
  DepartsAt: z.string().optional(),
  ArrivesAt: z.string().optional(),
  Cabin: z.string().optional(),
  MileageCost: z.number().optional(),
  TotalTaxes: z.number().optional(),
  RemainingSeats: z.number().optional()
}).passthrough();

const availabilitySchema = z.object({
  ID: z.string().optional(),
  Source: z.string().optional(),
  Airline: z.string().optional(),
  FlightNumber: z.string().optional(),
  OriginAirport: z.string().optional(),
  DestinationAirport: z.string().optional(),
  DepartureTime: z.string().optional(),
  ArrivalTime: z.string().optional(),
  Cabin: z.string().optional(),
  MileageCost: z.number().optional(),
  TotalTaxes: z.number().optional(),
  SeatsRemaining: z.number().optional(),
  AvailabilityTrips: z.array(availabilityTripSchema).optional(),
  Route: z.object({
    OriginAirport: z.string().optional(),
    DestinationAirport: z.string().optional(),
    Source: z.string().optional()
  }).passthrough().optional()
}).passthrough();

const searchResponseSchema = z.object({
  data: z.array(availabilitySchema).optional(),
  Data: z.array(availabilitySchema).optional()
}).passthrough();

const memoryCache = new Map<string, { expiresAt: number; results: AvailabilityResult[] }>();

function cacheKey(request: SearchRequest) {
  return JSON.stringify(request);
}

function normalizeCabin(value: unknown, fallback: AvailabilityResult["cabin"]) {
  const lower = String(value ?? fallback).toLowerCase();
  if (["economy", "premium", "business", "first"].includes(lower)) return lower as AvailabilityResult["cabin"];
  return fallback;
}

function normalizeResults(payload: unknown, request: SearchRequest): AvailabilityResult[] {
  const parsed = searchResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new SeatsAeroError("schema-mismatch", "seats.aero response did not match the expected envelope.");
  }
  const rows = parsed.data.data ?? parsed.data.Data ?? [];
  const fetchedAt = new Date().toISOString();

  return rows.flatMap((row, index): AvailabilityResult[] => {
    if (row.AvailabilityTrips?.length) {
      return row.AvailabilityTrips
        .filter((trip) => trip.DepartsAt && trip.ArrivesAt)
        .filter((trip) => (trip.RemainingSeats ?? request.seatCount) >= request.seatCount)
        .map((trip, tripIndex) => ({
          id: trip.ID ?? `${row.ID ?? "seats-aero"}-${tripIndex}`,
          program: trip.Source ?? row.Source ?? row.Route?.Source ?? "Unknown program",
          carrier: trip.Carriers ?? row.Airline ?? "Unknown",
          flightNumber: trip.FlightNumbers ?? row.FlightNumber ?? "TBA",
          originIata: trip.OriginAirport ?? row.Route?.OriginAirport ?? request.originIata,
          destinationIata: trip.DestinationAirport ?? row.Route?.DestinationAirport ?? request.destinationIata,
          departsAt: new Date(trip.DepartsAt!).toISOString(),
          arrivesAt: new Date(trip.ArrivesAt!).toISOString(),
          cabin: normalizeCabin(trip.Cabin, request.cabin),
          mileageCost: trip.MileageCost ?? row.MileageCost ?? 0,
          taxesCents: trip.TotalTaxes ?? row.TotalTaxes ?? 0,
          seatsRemaining: trip.RemainingSeats ?? request.seatCount,
          source: request.source,
          fetchedAt,
          rawPayload: { availability: row, trip }
        }));
    }

    if (!row.ArrivalTime || !row.DepartureTime) return [];
    return [{
      id: row.ID ?? `seats-aero-${index}`,
      program: row.Source ?? "Unknown program",
      carrier: row.Airline ?? "Unknown",
      flightNumber: row.FlightNumber ?? "TBA",
      originIata: row.OriginAirport ?? request.originIata,
      destinationIata: row.DestinationAirport ?? request.destinationIata,
      departsAt: new Date(row.DepartureTime).toISOString(),
      arrivesAt: new Date(row.ArrivalTime).toISOString(),
      cabin: normalizeCabin(row.Cabin, request.cabin),
      mileageCost: row.MileageCost ?? 0,
      taxesCents: row.TotalTaxes ?? 0,
      seatsRemaining: row.SeatsRemaining ?? request.seatCount,
      source: request.source,
      fetchedAt,
      rawPayload: row
    }];
  });
}

async function requestSeatsAero(request: SearchRequest): Promise<AvailabilityResult[]> {
  if (isDemoMode) return buildDemoResults(request);

  const headers = {
    "Partner-Authorization": env.SEATS_AERO_API_KEY!,
    "Content-Type": "application/json"
  };

  const response = request.source === "LIVE"
    ? await fetch("https://seats.aero/partnerapi/live", {
        method: "POST",
        headers,
        body: JSON.stringify({
          origin_airport: request.originIata,
          destination_airport: request.destinationIata,
          departure_date: request.departAfter.slice(0, 10),
          source: "aeroplan",
          seat_count: request.seatCount
        })
      })
    : await fetch(`https://seats.aero/partnerapi/search?${new URLSearchParams({
        origin_airport: request.originIata,
        destination_airport: request.destinationIata,
        start_date: request.departAfter.slice(0, 10),
        end_date: request.arriveBefore.slice(0, 10),
        cabins: request.cabin,
        take: "100",
        include_trips: "true"
      })}`, { headers });

  if (response.status === 429) {
    throw new SeatsAeroError("rate-limited", "seats.aero daily usage limit reached.", response.headers.get("retry-after") ?? undefined);
  }
  if (response.status >= 500) throw new SeatsAeroError("upstream-unavailable", "seats.aero is unavailable.");
  if (!response.ok) throw new SeatsAeroError("invalid-request", "seats.aero rejected the search request.");

  return normalizeResults(await response.json(), request);
}

export async function searchAvailability(request: SearchRequest): Promise<AvailabilityResult[]> {
  const key = cacheKey(request);
  const now = Date.now();
  const cached = memoryCache.get(key);
  if (request.source === "CACHED" && cached && cached.expiresAt > now) return cached.results;

  const results = await requestSeatsAero(request);
  memoryCache.set(key, { expiresAt: now + env.SEATS_AERO_CACHE_TTL_SECONDS * 1000, results });
  return results;
}

export const __test__ = {
  normalizeResults
};
