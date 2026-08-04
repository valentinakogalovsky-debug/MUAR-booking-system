import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["+7 900 123-45-67", "+79001234567"],
    ["8 (900) 123-45-67", "+79001234567"],
    ["9001234567", "+79001234567"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "123", "+1 202 555 0100", "790012345678"])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});
