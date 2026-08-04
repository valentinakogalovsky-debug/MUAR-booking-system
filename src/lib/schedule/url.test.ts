import { describe, expect, it } from "vitest";
import { scheduleDateUrl } from "./url";

describe("schedule date URL", () => {
  it("makes the selected date the server source of truth", () => {
    expect(scheduleDateUrl("2026-08-08")).toBe("/admin/schedule?date=2026-08-08");
  });
});
