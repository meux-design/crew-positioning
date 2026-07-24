import { z } from "zod";

export const cabinSchema = z.enum(["economy", "premium", "business", "first"]);
export type Cabin = z.infer<typeof cabinSchema>;

export const searchRequestSchema = z.object({
  originIata: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  destinationIata: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  departAfter: z.string().datetime(),
  arriveBefore: z.string().datetime(),
  cabin: cabinSchema,
  seatCount: z.coerce.number().int().min(1).max(4),
  source: z.enum(["CACHED", "LIVE"]).default("CACHED")
}).refine((value) => new Date(value.arriveBefore) > new Date(value.departAfter), {
  path: ["arriveBefore"],
  message: "Arrival deadline must be after the departure window starts."
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export type AvailabilityResult = {
  id: string;
  program: string;
  carrier: string;
  flightNumber: string;
  originIata: string;
  destinationIata: string;
  departsAt: string;
  arrivesAt: string;
  cabin: Cabin;
  mileageCost: number;
  taxesCents: number;
  seatsRemaining: number;
  source: "CACHED" | "LIVE";
  fetchedAt: string;
  rawPayload: unknown;
};
