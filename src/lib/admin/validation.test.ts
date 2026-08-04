import { describe, expect, it } from "vitest";
import { addonInputSchema, serviceInputSchema, settingsInputSchema } from "./validation";

describe("admin validation", () => {
  it("converts a valid service price from form text", () => {
    const service = serviceInputSchema.parse({
      name: "Новая услуга",
      category: "MANICURE",
      durationMinutes: "90",
      priceRubles: "3500",
    });
    expect(service.durationMinutes).toBe(90);
    expect(service.priceRubles).toBe(3500);
  });

  it("rejects an invalid service duration", () => {
    expect(() =>
      serviceInputSchema.parse({
        name: "Новая услуга",
        category: "MANICURE",
        durationMinutes: "0",
        priceRubles: "3500",
      }),
    ).toThrow();
  });

  it("requires a price for a paid addon", () => {
    expect(() => addonInputSchema.parse({ name: "Дизайн", priceType: "FIXED" })).toThrow();
  });

  it("accepts an included addon without a price", () => {
    expect(addonInputSchema.parse({ name: "Снятие", priceType: "INCLUDED" }).priceType).toBe(
      "INCLUDED",
    );
  });

  it("rejects an empty booking horizon", () => {
    expect(() =>
      settingsInputSchema.parse({ minimumLeadMinutes: "120", bookingHorizonDays: "0" }),
    ).toThrow();
  });
});
