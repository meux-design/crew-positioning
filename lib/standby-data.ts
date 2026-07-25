import type { Cabin } from "@/lib/search-schema";

export type SeededStandbyLoad = {
  id: string;
  originIata: string;
  destinationIata: string;
  carrier: string;
  flightNumber: string;
  departHour: number;
  durationMinutes: number;
  cabin: Cabin;
  capacity: number;
  bookedSeats: number;
  nonRevsListed: number;
  taxesCents: number;
  notes: string;
};

const seededLoads: SeededStandbyLoad[] = [
  {
    id: "qf-syd-mel-401",
    originIata: "SYD",
    destinationIata: "MEL",
    carrier: "QF",
    flightNumber: "QF401",
    departHour: 6,
    durationMinutes: 95,
    cabin: "economy",
    capacity: 174,
    bookedSeats: 151,
    nonRevsListed: 8,
    taxesCents: 4900,
    notes: "Morning trunk route demo load with several open seats."
  },
  {
    id: "va-syd-mel-824",
    originIata: "SYD",
    destinationIata: "MEL",
    carrier: "VA",
    flightNumber: "VA824",
    departHour: 9,
    durationMinutes: 100,
    cabin: "economy",
    capacity: 176,
    bookedSeats: 168,
    nonRevsListed: 11,
    taxesCents: 5200,
    notes: "Seeded peak-period load with more non-revs than likely open seats."
  },
  {
    id: "ua-sfo-lhr-901",
    originIata: "SFO",
    destinationIata: "LHR",
    carrier: "UA",
    flightNumber: "UA901",
    departHour: 13,
    durationMinutes: 620,
    cabin: "economy",
    capacity: 252,
    bookedSeats: 236,
    nonRevsListed: 14,
    taxesCents: 18400,
    notes: "Long-haul seeded demo load for portfolio verification."
  },
  {
    id: "ba-lhr-sfo-285",
    originIata: "LHR",
    destinationIata: "SFO",
    carrier: "BA",
    flightNumber: "BA285",
    departHour: 11,
    durationMinutes: 650,
    cabin: "economy",
    capacity: 275,
    bookedSeats: 249,
    nonRevsListed: 12,
    taxesCents: 21100,
    notes: "Return long-haul seeded load with a wider standby gap."
  },
  {
    id: "ek-mel-dxb-407",
    originIata: "MEL",
    destinationIata: "DXB",
    carrier: "EK",
    flightNumber: "EK407",
    departHour: 21,
    durationMinutes: 850,
    cabin: "economy",
    capacity: 360,
    bookedSeats: 338,
    nonRevsListed: 19,
    taxesCents: 16300,
    notes: "Overnight seeded load for base-commute demos."
  },
  {
    id: "sq-sin-syd-231",
    originIata: "SIN",
    destinationIata: "SYD",
    carrier: "SQ",
    flightNumber: "SQ231",
    departHour: 0,
    durationMinutes: 470,
    cabin: "economy",
    capacity: 303,
    bookedSeats: 286,
    nonRevsListed: 10,
    taxesCents: 12600,
    notes: "Seeded redeye load with enough slack for report-time examples."
  }
];

export function findSeededStandbyLoads(originIata: string, destinationIata: string) {
  return seededLoads.filter((load) => load.originIata === originIata && load.destinationIata === destinationIata);
}

export const __test__ = {
  seededLoads
};
