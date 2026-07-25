import { NextResponse } from "next/server";
import { buildCommuteComparison } from "@/lib/ranking";
import { searchAvailability, SeatsAeroError } from "@/lib/seats-aero/client";
import { commuteSearchSchema } from "@/lib/search-schema";

export async function POST(request: Request) {
  const parsed = commuteSearchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({
      error: "invalid-input",
      message: "Check the search fields and try again.",
      issues: parsed.error.flatten().fieldErrors
    }, { status: 400 });
  }

  try {
    const availability = await searchAvailability(parsed.data);
    return NextResponse.json(buildCommuteComparison(parsed.data, availability));
  } catch (error) {
    if (error instanceof SeatsAeroError) {
      return NextResponse.json({
        error: error.kind,
        message: error.message,
        retryAfter: error.retryAfter
      }, { status: error.kind === "rate-limited" ? 429 : error.kind === "invalid-request" ? 400 : 502 });
    }
    return NextResponse.json({ error: "upstream-unavailable", message: "Search is unavailable right now." }, { status: 502 });
  }
}
