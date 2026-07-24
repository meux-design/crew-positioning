import type { AvailabilityResult, SearchRequest } from "@/lib/search-schema";

const programs = ["Aeroplan", "Velocity", "MileagePlus", "Flying Club"];
const carriers = ["AX", "CT", "NV", "SU"];

export function buildDemoResults(request: SearchRequest): AvailabilityResult[] {
  const depart = new Date(request.departAfter);
  const fetchedAt = new Date().toISOString();

  return Array.from({ length: 10 }, (_, index) => {
    const departsAt = new Date(depart.getTime() + (index + 1) * 75 * 60000);
    const arrivesAt = new Date(departsAt.getTime() + (110 + (index % 4) * 55) * 60000);
    const cabin = index % 5 === 0 ? "first" : index % 3 === 0 ? "business" : request.cabin;
    return {
      id: `demo-${index + 1}`,
      program: programs[index % programs.length],
      carrier: carriers[index % carriers.length],
      flightNumber: `${carriers[index % carriers.length]}${240 + index}`,
      originIata: request.originIata,
      destinationIata: request.destinationIata,
      departsAt: departsAt.toISOString(),
      arrivesAt: arrivesAt.toISOString(),
      cabin,
      mileageCost: 15500 + index * 4200 + (index % 2) * 1800,
      taxesCents: 7800 + index * 525,
      seatsRemaining: Math.max(1, 4 - (index % 4)),
      source: request.source,
      fetchedAt,
      rawPayload: { demo: true, index }
    } satisfies AvailabilityResult;
  });
}
