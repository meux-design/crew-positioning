import { z } from "zod";

export const cabinSchema = z.enum(["economy", "premium", "business", "first"]);
export type Cabin = z.infer<typeof cabinSchema>;

export const sourceSchema = z.enum(["CACHED", "LIVE"]);
export type AwardSource = z.infer<typeof sourceSchema>;

export const onloadCategorySchema = z.enum(["A", "B", "C", "D"]);
export type OnloadCategory = z.infer<typeof onloadCategorySchema>;

const iataSchema = z.string().trim().length(3).transform((value) => value.toUpperCase());
const currencySchema = z.string().trim().length(3).transform((value) => value.toUpperCase());

const manualFareBaseSchema = z.object({
  id: z.string().optional(),
  carrier: z.string().trim().max(24).optional().default("User entered"),
  flightNumber: z.string().trim().max(16).optional().default("TBA"),
  departsAt: z.string().datetime(),
  arrivesAt: z.string().datetime(),
  cabin: cabinSchema,
  amountCents: z.coerce.number().int().nonnegative(),
  currency: currencySchema.default("AUD"),
  note: z.string().trim().max(180).optional().default("")
});

const timedManualFareBaseSchema = manualFareBaseSchema.refine((value) => new Date(value.arrivesAt) > new Date(value.departsAt), {
  path: ["arrivesAt"],
  message: "Arrival time must be after departure time."
});

export const staffFareInputSchema = manualFareBaseSchema.extend({
  bookByAt: z.string().datetime().optional()
}).refine((value) => new Date(value.arrivesAt) > new Date(value.departsAt), {
  path: ["arrivesAt"],
  message: "Arrival time must be after departure time."
});
export type StaffFareInput = z.infer<typeof staffFareInputSchema>;

export const cashFareInputSchema = timedManualFareBaseSchema;
export type CashFareInput = z.infer<typeof cashFareInputSchema>;

export const commuteSearchSchema = z.object({
  originIata: iataSchema,
  destinationIata: iataSchema,
  departAfter: z.string().datetime(),
  arriveBefore: z.string().datetime(),
  bufferMinutes: z.coerce.number().int().min(0).max(720).default(90),
  cabin: cabinSchema,
  seatCount: z.coerce.number().int().min(1).max(4),
  onloadCategory: onloadCategorySchema.default("C"),
  seniorityYears: z.coerce.number().int().min(0).max(50).default(3),
  source: sourceSchema.default("CACHED"),
  staffFares: z.array(staffFareInputSchema).max(6).default([]),
  cashFares: z.array(cashFareInputSchema).max(6).default([])
}).refine((value) => value.originIata !== value.destinationIata, {
  path: ["destinationIata"],
  message: "Destination must be different from origin."
}).refine((value) => new Date(value.arriveBefore) > new Date(value.departAfter), {
  path: ["arriveBefore"],
  message: "Arrival deadline must be after the departure window starts."
});

export type CommuteSearchRequest = z.infer<typeof commuteSearchSchema>;

export const searchRequestSchema = commuteSearchSchema;
export type SearchRequest = CommuteSearchRequest;

export type ClearanceBand = "LIKELY" | "UNCERTAIN" | "UNLIKELY";
export type CertaintyLabel = "confirmed" | "speculative" | "expired" | "seeded-estimated";
export type ProvenanceLabel = "seeded-demo" | "user-entered" | "seats-aero-cached" | "seats-aero-live";
export type CommuteOptionType = "standby" | "staffFare" | "cash" | "award";

export type RankingExplanation = {
  arrivalBufferMinutes: number;
  isTightBuffer: boolean;
  factors: string[];
  summary: string;
};

export type CommuteOptionBase = {
  id: string;
  type: CommuteOptionType;
  title: string;
  carrier: string;
  flightNumber: string;
  originIata: string;
  destinationIata: string;
  departsAt: string;
  arrivesAt: string;
  cabin: Cabin;
  certainty: CertaintyLabel;
  provenance: ProvenanceLabel;
  rank: number;
  ranking: RankingExplanation;
};

export type StandbyOption = CommuteOptionBase & {
  type: "standby";
  taxesCents: number;
  clearance: ClearanceBand;
  load: {
    capacity: number;
    bookedSeats: number;
    seatsLikelyOpen: number;
    nonRevsListed: number;
    adjustedNonRevsAhead: number;
    onloadCategory: OnloadCategory;
    seniorityYears: number;
    notes: string;
  };
};

export type StaffFareOption = CommuteOptionBase & {
  type: "staffFare";
  amountCents: number;
  currency: string;
  bookByAt?: string;
  isExpired: boolean;
  note?: string;
};

export type CashOption = CommuteOptionBase & {
  type: "cash";
  amountCents: number;
  currency: string;
  note?: string;
};

export type AwardOption = CommuteOptionBase & {
  type: "award";
  program: string;
  mileageCost: number;
  taxesCents: number;
  seatsRemaining: number;
  source: AwardSource;
  fetchedAt: string;
};

export type CommuteOption = StandbyOption | StaffFareOption | CashOption | AwardOption;
export type ComparisonColumnKey = CommuteOptionType;

export type ComparisonColumn<TOption extends CommuteOption = CommuteOption> = {
  key: ComparisonColumnKey;
  label: string;
  provenance: ProvenanceLabel;
  prompt?: string;
  options: TOption[];
};

export type CommuteComparisonResponse = {
  source: AwardSource;
  fetchedAt: string;
  state: "empty" | "populated" | "partial" | "zero";
  columns: {
    standby: ComparisonColumn<StandbyOption>;
    staffFare: ComparisonColumn<StaffFareOption>;
    cash: ComparisonColumn<CashOption>;
    award: ComparisonColumn<AwardOption>;
  };
  resultCount: number;
  notices: string[];
};

export type AwardAvailabilityResult = {
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
  source: AwardSource;
  fetchedAt: string;
  rawPayload: unknown;
};

export type AvailabilityResult = AwardAvailabilityResult;
