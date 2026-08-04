import { describe, expect, it } from "vitest";
import { BLOCKING_BOOKING_STATUSES, generateAvailableStarts } from "./calculate";

const at = (time: string) => new Date(`2026-08-10T${time}:00.000Z`);

describe("available starts", () => {
  it("treats pending and confirmed bookings as blocking", () => {
    expect(BLOCKING_BOOKING_STATUSES).toEqual(["PENDING", "CONFIRMED"]);
  });
  it("generates starts every 15 minutes and keeps the break inside the shift", () => {
    const starts = generateAvailableStarts({
      workingIntervals: [{ startAt: at("06:00"), endAt: at("09:00") }],
      busyIntervals: [],
      durationMinutes: 60,
      technicalBreakMinutes: 15,
      slotStepMinutes: 15,
      earliestStart: at("06:00"),
    });
    expect(starts[0]).toEqual(at("06:00"));
    expect(starts.at(-1)).toEqual(at("07:45"));
    expect(starts).toHaveLength(8);
  });

  it("does not offer a service when procedure and break do not fit", () => {
    expect(
      generateAvailableStarts({
        workingIntervals: [{ startAt: at("06:00"), endAt: at("09:00") }],
        busyIntervals: [],
        durationMinutes: 180,
        technicalBreakMinutes: 15,
        slotStepMinutes: 15,
        earliestStart: at("06:00"),
      }),
    ).toHaveLength(0);
  });

  it("supports a three-hour visit with one shared break", () => {
    const starts = generateAvailableStarts({
      workingIntervals: [{ startAt: at("06:00"), endAt: at("10:00") }],
      busyIntervals: [],
      durationMinutes: 180,
      technicalBreakMinutes: 15,
      slotStepMinutes: 15,
      earliestStart: at("06:00"),
    });
    expect(starts.map((start) => start.toISOString().slice(11, 16))).toEqual([
      "06:00",
      "06:15",
      "06:30",
      "06:45",
    ]);
  });

  it("removes starts that overlap an active booking", () => {
    const starts = generateAvailableStarts({
      workingIntervals: [{ startAt: at("06:00"), endAt: at("10:00") }],
      busyIntervals: [{ startAt: at("07:00"), occupiedUntil: at("08:15") }],
      durationMinutes: 60,
      technicalBreakMinutes: 15,
      slotStepMinutes: 15,
      earliestStart: at("06:00"),
    });
    expect(starts.map((start) => start.toISOString().slice(11, 16))).toEqual([
      "08:15",
      "08:30",
      "08:45",
    ]);
  });

  it("rounds the minimum lead time up to the next step", () => {
    const starts = generateAvailableStarts({
      workingIntervals: [{ startAt: at("06:00"), endAt: at("10:00") }],
      busyIntervals: [],
      durationMinutes: 60,
      technicalBreakMinutes: 15,
      slotStepMinutes: 15,
      earliestStart: at("06:07"),
    });
    expect(starts[0]).toEqual(at("06:15"));
  });
});
