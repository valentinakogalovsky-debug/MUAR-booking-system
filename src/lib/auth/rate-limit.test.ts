import { beforeEach, describe, expect, it } from "vitest";
import { consumeLoginAttempt, resetLoginRateLimitForTests } from "./rate-limit";

describe("login rate limit", () => {
  beforeEach(resetLoginRateLimitForTests);

  it("allows five attempts and blocks the sixth", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(consumeLoginAttempt("client", 1_000)).toBe(true);
    }
    expect(consumeLoginAttempt("client", 1_000)).toBe(false);
  });

  it("opens a new window after fifteen minutes", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) consumeLoginAttempt("client", 1_000);
    expect(consumeLoginAttempt("client", 901_000)).toBe(true);
  });
});
