import type { AvailabilityResult, Cabin, SearchRequest } from "@/lib/search-schema";

export type RankedResult = AvailabilityResult & {
  fitScore: number;
  explanation: {
    arrivalBufferMinutes: number;
    arrivalScore: number;
    costScore: number;
    cabinScore: number;
    summary: string;
  };
};

const cabinOrder: Cabin[] = ["economy", "premium", "business", "first"];

function cabinScore(requested: Cabin, offered: Cabin) {
  if (requested === offered) return 1;
  const delta = cabinOrder.indexOf(offered) - cabinOrder.indexOf(requested);
  if (delta > 0) return 0.72;
  return 0.35;
}

export function rankResults(results: AvailabilityResult[], request: SearchRequest): RankedResult[] {
  const arriveBefore = new Date(request.arriveBefore).getTime();
  const eligible = results.filter((result) => new Date(result.arrivesAt).getTime() <= arriveBefore);
  if (eligible.length === 0) return [];

  const costs = eligible.map((result) => result.mileageCost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const costRange = Math.max(maxCost - minCost, 1);

  return eligible
    .map((result) => {
      const arrivalBufferMinutes = Math.max(0, Math.round((arriveBefore - new Date(result.arrivesAt).getTime()) / 60000));
      const bufferHours = arrivalBufferMinutes / 60;
      const arrivalScore = Math.min(1, Math.log1p(bufferHours) / Math.log1p(6));
      const costScore = 1 - (result.mileageCost - minCost) / costRange;
      const cabinMatchScore = cabinScore(request.cabin, result.cabin);
      const fitScore = Math.round((arrivalScore * 0.55 + costScore * 0.3 + cabinMatchScore * 0.15) * 100);

      return {
        ...result,
        fitScore,
        explanation: {
          arrivalBufferMinutes,
          arrivalScore: Math.round(arrivalScore * 100),
          costScore: Math.round(costScore * 100),
          cabinScore: Math.round(cabinMatchScore * 100),
          summary: `${Math.floor(arrivalBufferMinutes / 60)}h ${arrivalBufferMinutes % 60}m buffer, ${result.mileageCost.toLocaleString()} points, ${result.cabin} cabin`
        }
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore || a.mileageCost - b.mileageCost);
}
