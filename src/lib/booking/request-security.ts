interface RequestWindow {
  count: number;
  resetAt: number;
}

const requests = new Map<string, RequestWindow>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const MAX_TRACKED_CLIENTS = 10_000;
export const MAX_BOOKING_BODY_BYTES = 8_192;

export function bookingRequestClientKey(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

export function consumeBookingRequest(key: string, now = Date.now()) {
  if (requests.size >= MAX_TRACKED_CLIENTS && !requests.has(key)) {
    for (const [clientKey, value] of requests) {
      if (value.resetAt <= now) requests.delete(clientKey);
    }
    if (requests.size >= MAX_TRACKED_CLIENTS) {
      return { allowed: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1_000) };
    }
  }
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function requestBodyIsTooLarge(headers: Headers) {
  const value = headers.get("content-length");
  if (!value) return false;
  const length = Number(value);
  return Number.isFinite(length) && length > MAX_BOOKING_BODY_BYTES;
}

export function resetBookingRequestLimitForTests() {
  requests.clear();
}
