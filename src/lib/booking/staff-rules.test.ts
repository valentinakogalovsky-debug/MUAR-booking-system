import { describe, expect, it } from "vitest";
import { canStaffSetFinalStatus } from "./staff-rules";

describe("staff booking status rules", () => {
  it("allows a master to finish a confirmed booking", () => {
    expect(canStaffSetFinalStatus("CONFIRMED", "COMPLETED")).toBe(true);
    expect(canStaffSetFinalStatus("CONFIRMED", "NO_SHOW")).toBe(true);
  });

  it("rejects pending, cancelled and already final bookings", () => {
    expect(canStaffSetFinalStatus("PENDING", "COMPLETED")).toBe(false);
    expect(canStaffSetFinalStatus("CANCELLED", "NO_SHOW")).toBe(false);
    expect(canStaffSetFinalStatus("COMPLETED", "NO_SHOW")).toBe(false);
  });
});
