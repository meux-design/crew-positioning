import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let database: "connected" | "not-configured" | "unavailable" = "not-configured";

  if (env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "unavailable";
    }
  }

  return NextResponse.json({
    status: database === "unavailable" ? "degraded" : "ok",
    database,
    seatsAero: env.SEATS_AERO_API_KEY ? "configured" : "demo-mode"
  }, { status: database === "unavailable" ? 503 : 200 });
}
