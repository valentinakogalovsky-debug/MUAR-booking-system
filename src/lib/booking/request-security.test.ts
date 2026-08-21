import { beforeEach, describe, expect, it } from "vitest";
import {
  bookingRequestClientKey,
  consumeBookingRequest,
  requestBodyIsTooLarge,
  resetBookingRequestLimitForTests,
} from "./request-security";

describe("public booking request protection", () => {
  beforeEach(resetBookingRequestLimitForTests);

  it("allows ten requests and blocks the eleventh", () => {
    for (let index = 0; index < 10; index += 1) {
      expect(consumeBookingRequest("client", 1_000).allowed).toBe(true);
    }
    const blocked = consumeBookingRequest("client", 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(600);
  });

  it("uses the first forwarded address and rejects oversized declared bodies", () => {
    expect(
      bookingRequestClientKey(new Headers({ "x-forwarded-for": "203.0.113.4, 10.0.0.1" })),
    ).toBe("203.0.113.4");
    expect(requestBodyIsTooLarge(new Headers({ "content-length": "9000" }))).toBe(true);
  });
});
