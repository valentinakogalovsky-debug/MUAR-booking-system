import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  formatStudioSlot,
  isValidBookingPhone,
  studioToday,
} from "./booking-form-utils";

describe("public booking form helpers", () => {
  it("formats booking dates in the studio timezone", () => {
    expect(formatStudioSlot("2026-08-10T06:15:00.000Z")).toBe("09:15");
    expect(studioToday(new Date("2026-08-09T22:30:00.000Z"))).toBe("2026-08-10");
  });

  it("adds days across month boundaries", () => {
    expect(addCalendarDays("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("accepts supported Russian phone formats", () => {
    expect(isValidBookingPhone("+7 900 000-00-00")).toBe(true);
    expect(isValidBookingPhone("9000000000")).toBe(true);
    expect(isValidBookingPhone("12345")).toBe(false);
  });
});
