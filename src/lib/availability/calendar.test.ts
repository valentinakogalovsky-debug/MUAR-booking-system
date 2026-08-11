import { describe, expect, it } from "vitest";
import { datesInMonth } from "./calendar";

describe("availability calendar", () => {
  it("builds all dates for regular and leap months", () => {
    expect(datesInMonth("2026-08")).toHaveLength(31);
    expect(datesInMonth("2028-02")).toHaveLength(29);
  });

  it("rejects invalid months", () => {
    expect(() => datesInMonth("2026-13")).toThrow();
    expect(() => datesInMonth("August")).toThrow();
  });
});
