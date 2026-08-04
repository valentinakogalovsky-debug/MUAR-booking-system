import { describe, expect, it } from "vitest";
import type { AvailabilityException, SchedulePattern } from "@/generated/prisma/client";
import { calculateWorkingIntervals } from "./calculate";
import { studioDateTimeToUtc } from "./time";

function rotating(anchorDate: string): SchedulePattern {
  return {
    id: "pattern",
    organizationId: "organization",
    staffId: "staff",
    type: "ROTATING",
    dayOfWeek: null,
    anchorDate: new Date(`${anchorDate}T00:00:00.000Z`),
    cycleLengthDays: 4,
    workingCycleDays: [0, 1],
    startMinute: 540,
    endMinute: 1200,
    validFrom: new Date("2026-08-01T00:00:00.000Z"),
    validUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function weekly(dayOfWeek: number): SchedulePattern {
  return {
    ...rotating("2026-08-01"),
    type: "WEEKLY",
    dayOfWeek,
    anchorDate: null,
    cycleLengthDays: null,
    workingCycleDays: [],
    endMinute: 1080,
  };
}

function exception(type: "AVAILABLE" | "UNAVAILABLE", startAt: string, endAt: string) {
  return {
    id: `${type}-${startAt}`,
    organizationId: "organization",
    staffId: "staff",
    type,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    reason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies AvailabilityException;
}

describe("staff schedules", () => {
  it("converts 09:00 Moscow to 06:00 UTC", () => {
    expect(studioDateTimeToUtc("2026-08-01", 540, "Europe/Moscow").toISOString()).toBe(
      "2026-08-01T06:00:00.000Z",
    );
  });

  it("uses opposite 2/2 cycles", () => {
    expect(
      calculateWorkingIntervals("2026-08-01", "Europe/Moscow", [rotating("2026-08-01")], []),
    ).toHaveLength(1);
    expect(
      calculateWorkingIntervals("2026-08-01", "Europe/Moscow", [rotating("2026-08-03")], []),
    ).toHaveLength(0);
    expect(
      calculateWorkingIntervals("2026-08-03", "Europe/Moscow", [rotating("2026-08-03")], []),
    ).toHaveLength(1);
  });

  it("uses Monday-Friday weekly schedule", () => {
    expect(calculateWorkingIntervals("2026-08-03", "Europe/Moscow", [weekly(1)], [])).toHaveLength(
      1,
    );
    expect(calculateWorkingIntervals("2026-08-08", "Europe/Moscow", [weekly(1)], [])).toHaveLength(
      0,
    );
  });

  it("shows Tatiana working Friday, off on weekend and working Monday", () => {
    const weekdayPatterns = [1, 2, 3, 4, 5].map(weekly);
    expect(
      calculateWorkingIntervals("2026-08-07", "Europe/Moscow", weekdayPatterns, []),
    ).toHaveLength(1);
    expect(
      calculateWorkingIntervals("2026-08-08", "Europe/Moscow", weekdayPatterns, []),
    ).toHaveLength(0);
    expect(
      calculateWorkingIntervals("2026-08-09", "Europe/Moscow", weekdayPatterns, []),
    ).toHaveLength(0);
    expect(
      calculateWorkingIntervals("2026-08-10", "Europe/Moscow", weekdayPatterns, []),
    ).toHaveLength(1);
  });

  it("subtracts a partial-day block", () => {
    const intervals = calculateWorkingIntervals(
      "2026-08-01",
      "Europe/Moscow",
      [rotating("2026-08-01")],
      [exception("UNAVAILABLE", "2026-08-01T09:00:00.000Z", "2026-08-01T10:00:00.000Z")],
    );
    expect(intervals.map((item) => [item.startAt.toISOString(), item.endAt.toISOString()])).toEqual(
      [
        ["2026-08-01T06:00:00.000Z", "2026-08-01T09:00:00.000Z"],
        ["2026-08-01T10:00:00.000Z", "2026-08-01T17:00:00.000Z"],
      ],
    );
  });

  it("replaces regular hours with a shortened shift", () => {
    const intervals = calculateWorkingIntervals(
      "2026-08-01",
      "Europe/Moscow",
      [rotating("2026-08-01")],
      [exception("AVAILABLE", "2026-08-01T07:00:00.000Z", "2026-08-01T12:00:00.000Z")],
    );
    expect(intervals).toHaveLength(1);
    expect(intervals[0].startAt.toISOString()).toBe("2026-08-01T07:00:00.000Z");
    expect(intervals[0].endAt.toISOString()).toBe("2026-08-01T12:00:00.000Z");
  });
});
