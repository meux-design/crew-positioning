import { findSeededStandbyLoads } from "@/lib/standby-data";
import type {
  AwardAvailabilityResult,
  AwardOption,
  Cabin,
  CashOption,
  ClearanceBand,
  CommuteComparisonResponse,
  CommuteOption,
  CommuteSearchRequest,
  OnloadCategory,
  StaffFareOption,
  StandbyOption
} from "@/lib/search-schema";

export type RankedResult = AwardOption;

const cabinOrder: Cabin[] = ["economy", "premium", "business", "first"];
const columnLabels = {
  standby: "Staff standby",
  staffFare: "Staff confirmed fare",
  cash: "Cash fare",
  award: "Award redemption"
} as const;

function cabinScore(requested: Cabin, offered: Cabin) {
  if (requested === offered) return 1;
  const delta = cabinOrder.indexOf(offered) - cabinOrder.indexOf(requested);
  if (delta > 0) return 0.72;
  return 0.35;
}

function cabinLabel(cabin: Cabin) {
  return cabin[0].toUpperCase() + cabin.slice(1);
}

function minutesUntil(arriveBefore: string, arrivesAt: string) {
  return Math.max(0, Math.round((new Date(arriveBefore).getTime() - new Date(arrivesAt).getTime()) / 60000));
}

function isArrivalEligible(option: { arrivesAt: string }, request: CommuteSearchRequest) {
  return new Date(option.arrivesAt).getTime() <= new Date(request.arriveBefore).getTime();
}

function withRanking<TOption extends CommuteOption>(
  options: Omit<TOption, "rank" | "ranking">[],
  request: CommuteSearchRequest,
  costOf: (option: Omit<TOption, "rank" | "ranking">) => number,
  extraFactors: (option: Omit<TOption, "rank" | "ranking">) => string[] = () => []
): TOption[] {
  if (options.length === 0) return [];
  const costs = options.map(costOf);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const costRange = Math.max(maxCost - minCost, 1);

  return options
    .map((option) => {
      const arrivalBufferMinutes = minutesUntil(request.arriveBefore, option.arrivesAt);
      const isTightBuffer = arrivalBufferMinutes < request.bufferMinutes;
      const arrivalScore = Math.min(1, Math.log1p(arrivalBufferMinutes / 60) / Math.log1p(6));
      const costScore = 1 - (costOf(option) - minCost) / costRange;
      const fit = arrivalScore * 0.5 + costScore * 0.3 + cabinScore(request.cabin, option.cabin) * 0.2;
      const factors = [
        `${Math.floor(arrivalBufferMinutes / 60)}h ${arrivalBufferMinutes % 60}m before report`,
        isTightBuffer ? `Inside ${request.bufferMinutes}m buffer` : `Meets ${request.bufferMinutes}m buffer`,
        `${cabinLabel(option.cabin)} cabin`,
        ...extraFactors(option)
      ];

      return {
        ...option,
        rank: Math.round(fit * 100),
        ranking: {
          arrivalBufferMinutes,
          isTightBuffer,
          factors,
          summary: factors.join(" · ")
        }
      } as TOption;
    })
    .sort((a, b) => b.rank - a.rank || new Date(a.arrivesAt).getTime() - new Date(b.arrivesAt).getTime())
    .map((option, index) => ({ ...option, rank: index + 1 }));
}

function categoryAdjustment(category: OnloadCategory) {
  return ({ A: -3, B: -1, C: 1, D: 3 } as const)[category];
}

export function deriveClearanceBand(input: {
  capacity: number;
  bookedSeats: number;
  nonRevsListed: number;
  onloadCategory: OnloadCategory;
  seniorityYears: number;
}): { clearance: ClearanceBand; seatsLikelyOpen: number; adjustedNonRevsAhead: number } {
  const seatsLikelyOpen = Math.max(0, input.capacity - input.bookedSeats);
  const seniorityOffset = Math.floor(input.seniorityYears / 5);
  const adjustedNonRevsAhead = Math.max(0, input.nonRevsListed + categoryAdjustment(input.onloadCategory) - seniorityOffset);
  const gap = seatsLikelyOpen - adjustedNonRevsAhead;
  const clearance: ClearanceBand = gap >= 4 ? "LIKELY" : gap >= -2 ? "UNCERTAIN" : "UNLIKELY";
  return { clearance, seatsLikelyOpen, adjustedNonRevsAhead };
}

function buildStandbyOptions(request: CommuteSearchRequest): StandbyOption[] {
  const departStart = new Date(request.departAfter);
  const loads = findSeededStandbyLoads(request.originIata, request.destinationIata);
  const unranked = loads.map((load) => {
    const departsAt = new Date(departStart);
    departsAt.setUTCHours(load.departHour, 0, 0, 0);
    if (departsAt.getTime() < departStart.getTime()) departsAt.setUTCDate(departsAt.getUTCDate() + 1);
    const arrivesAt = new Date(departsAt.getTime() + load.durationMinutes * 60000);
    const derived = deriveClearanceBand({
      capacity: load.capacity,
      bookedSeats: load.bookedSeats,
      nonRevsListed: load.nonRevsListed,
      onloadCategory: request.onloadCategory,
      seniorityYears: request.seniorityYears
    });
    return {
      id: load.id,
      type: "standby" as const,
      title: `${load.carrier}${load.flightNumber.replace(/^\D+/, "")} standby`,
      carrier: load.carrier,
      flightNumber: load.flightNumber,
      originIata: load.originIata,
      destinationIata: load.destinationIata,
      departsAt: departsAt.toISOString(),
      arrivesAt: arrivesAt.toISOString(),
      cabin: load.cabin,
      certainty: "seeded-estimated" as const,
      provenance: "seeded-demo" as const,
      taxesCents: load.taxesCents,
      clearance: derived.clearance,
      load: {
        capacity: load.capacity,
        bookedSeats: load.bookedSeats,
        seatsLikelyOpen: derived.seatsLikelyOpen,
        nonRevsListed: load.nonRevsListed,
        adjustedNonRevsAhead: derived.adjustedNonRevsAhead,
        onloadCategory: request.onloadCategory,
        seniorityYears: request.seniorityYears,
        notes: load.notes
      }
    };
  }).filter((option) => isArrivalEligible(option, request));

  const clearanceScore = { LIKELY: 0, UNCERTAIN: 5000, UNLIKELY: 10000 };
  return withRanking<StandbyOption>(unranked, request, (option) => option.taxesCents + clearanceScore[option.clearance], (option) => [
    `${option.clearance.toLowerCase()} clearance band`,
    `${option.load.seatsLikelyOpen} likely open seats`,
    `${option.load.adjustedNonRevsAhead} adjusted non-revs ahead`
  ]);
}

function buildStaffFareOptions(request: CommuteSearchRequest, runAt: string): StaffFareOption[] {
  const unranked = request.staffFares
    .map((fare, index) => ({
      id: fare.id ?? `staff-${index + 1}`,
      type: "staffFare" as const,
      title: `${fare.carrier} staff fare`,
      carrier: fare.carrier,
      flightNumber: fare.flightNumber,
      originIata: request.originIata,
      destinationIata: request.destinationIata,
      departsAt: fare.departsAt,
      arrivesAt: fare.arrivesAt,
      cabin: fare.cabin,
      certainty: fare.bookByAt && new Date(fare.bookByAt).getTime() < new Date(runAt).getTime() ? "expired" as const : "confirmed" as const,
      provenance: "user-entered" as const,
      amountCents: fare.amountCents,
      currency: fare.currency,
      bookByAt: fare.bookByAt,
      isExpired: Boolean(fare.bookByAt && new Date(fare.bookByAt).getTime() < new Date(runAt).getTime()),
      note: fare.note
    }))
    .filter((option) => isArrivalEligible(option, request));

  return withRanking<StaffFareOption>(unranked, request, (option) => option.amountCents + (option.isExpired ? 1_000_000 : 0), (option) => [
    `${option.currency} ${(option.amountCents / 100).toFixed(0)}`,
    option.isExpired ? "booking deadline passed" : "booking window usable"
  ]);
}

function buildCashOptions(request: CommuteSearchRequest): CashOption[] {
  const unranked = request.cashFares
    .map((fare, index) => ({
      id: fare.id ?? `cash-${index + 1}`,
      type: "cash" as const,
      title: `${fare.carrier} cash fare`,
      carrier: fare.carrier,
      flightNumber: fare.flightNumber,
      originIata: request.originIata,
      destinationIata: request.destinationIata,
      departsAt: fare.departsAt,
      arrivesAt: fare.arrivesAt,
      cabin: fare.cabin,
      certainty: "confirmed" as const,
      provenance: "user-entered" as const,
      amountCents: fare.amountCents,
      currency: fare.currency,
      note: fare.note
    }))
    .filter((option) => isArrivalEligible(option, request));

  return withRanking<CashOption>(unranked, request, (option) => option.amountCents, (option) => [
    `${option.currency} ${(option.amountCents / 100).toFixed(0)}`,
    "user-entered fare"
  ]);
}

function buildAwardOptions(availability: AwardAvailabilityResult[], request: CommuteSearchRequest): AwardOption[] {
  const unranked = availability
    .filter((result) => isArrivalEligible(result, request))
    .map((result) => ({
      id: result.id,
      type: "award" as const,
      title: `${result.program} award`,
      program: result.program,
      carrier: result.carrier,
      flightNumber: result.flightNumber,
      originIata: result.originIata,
      destinationIata: result.destinationIata,
      departsAt: result.departsAt,
      arrivesAt: result.arrivesAt,
      cabin: result.cabin,
      certainty: "confirmed" as const,
      provenance: result.source === "LIVE" ? "seats-aero-live" as const : "seats-aero-cached" as const,
      mileageCost: result.mileageCost,
      taxesCents: result.taxesCents,
      seatsRemaining: result.seatsRemaining,
      source: result.source,
      fetchedAt: result.fetchedAt
    }));

  return withRanking<AwardOption>(unranked, request, (option) => option.mileageCost, (option) => [
    `${option.mileageCost.toLocaleString()} points`,
    `${option.seatsRemaining} seats remaining`
  ]);
}

export function buildCommuteComparison(
  request: CommuteSearchRequest,
  awardAvailability: AwardAvailabilityResult[],
  runAt = new Date().toISOString()
): CommuteComparisonResponse {
  const standby = buildStandbyOptions(request);
  const staffFare = buildStaffFareOptions(request, runAt);
  const cash = buildCashOptions(request);
  const award = buildAwardOptions(awardAvailability, request);
  const resultCount = standby.length + staffFare.length + cash.length + award.length;
  const manualMissing = request.staffFares.length === 0 || request.cashFares.length === 0;
  const state = resultCount === 0 ? "zero" : manualMissing ? "partial" : "populated";

  return {
    source: request.source,
    fetchedAt: runAt,
    state,
    resultCount,
    notices: [
      "Standby load figures are seeded demo data, not live airline-system data.",
      request.source === "CACHED" ? "Award availability uses cached seats.aero search by default." : "Award availability was requested from seats.aero live search."
    ],
    columns: {
      standby: {
        key: "standby",
        label: columnLabels.standby,
        provenance: "seeded-demo",
        options: standby
      },
      staffFare: {
        key: "staffFare",
        label: columnLabels.staffFare,
        provenance: "user-entered",
        prompt: "Enter a staff confirmed fare to compare a bookable staff option.",
        options: staffFare
      },
      cash: {
        key: "cash",
        label: columnLabels.cash,
        provenance: "user-entered",
        prompt: "Enter a cash fare to compare a fully public confirmed option.",
        options: cash
      },
      award: {
        key: "award",
        label: columnLabels.award,
        provenance: request.source === "LIVE" ? "seats-aero-live" : "seats-aero-cached",
        options: award
      }
    }
  };
}

export function rankResults(results: AwardAvailabilityResult[], request: CommuteSearchRequest): AwardOption[] {
  return buildAwardOptions(results, request);
}
