import { NextResponse } from "next/server";
import { rankResults } from "@/lib/ranking";
import { searchAvailability, SeatsAeroError } from "@/lib/seats-aero/client";
import { searchRequestSchema } from "@/lib/search-schema";

export async function POST(request: Request) {
  const parsed = searchRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({
      error: "invalid-input",
      message: "Check the search fields and try again.",
      issues: parsed.error.flatten().fieldErrors
    }, { status: 400 });
  }

  try {
    const availability = await searchAvailability(parsed.data);
    const ranked = rankResults(availability, parsed.data);
    return NextResponse.json({
      source: parsed.data.source,
      resultCount: ranked.length,
      fetchedAt: new Date().toISOString(),
      results: ranked
    });
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
