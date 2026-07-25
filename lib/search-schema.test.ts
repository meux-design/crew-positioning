import { describe, expect, it } from "vitest";
import { commuteSearchSchema } from "@/lib/search-schema";

const validPayload = {
  originIata: "syd",
  destinationIata: "mel",
  departAfter: "2026-08-01T00:00:00.000Z",
  arriveBefore: "2026-08-01T12:00:00.000Z",
  bufferMinutes: 90,
  cabin: "economy",
  seatCount: 1,
  onloadCategory: "C",
  seniorityYears: 3,
  source: "CACHED",
  staffFares: [],
  cashFares: []
};

describe("commuteSearchSchema", () => {
  it("normalizes IATA and accepts commute comparison inputs", () => {
    const parsed = commuteSearchSchema.parse(validPayload);
    expect(parsed.originIata).toBe("SYD");
    expect(parsed.destinationIata).toBe("MEL");
  });

  it("rejects impossible deadlines before calling upstream search", () => {
    const parsed = commuteSearchSchema.safeParse({
      ...validPayload,
      arriveBefore: "2026-07-31T12:00:00.000Z"
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.flatten().fieldErrors.arriveBefore).toBeDefined();
  });

  it("rejects invalid seat counts", () => {
    const parsed = commuteSearchSchema.safeParse({ ...validPayload, seatCount: 5 });
    expect(parsed.success).toBe(false);
  });

  it("validates manual fare timing", () => {
    const parsed = commuteSearchSchema.safeParse({
      ...validPayload,
      cashFares: [{
        amountCents: 12000,
        currency: "aud",
        carrier: "QF",
        flightNumber: "QF401",
        departsAt: "2026-08-01T10:00:00.000Z",
        arrivesAt: "2026-08-01T09:00:00.000Z",
        cabin: "economy",
        note: ""
      }]
    });
    expect(parsed.success).toBe(false);
  });
});
