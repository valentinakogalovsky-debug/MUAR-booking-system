import { describe, expect, it } from "vitest";

const baseUrl = process.env.BOOKING_TEST_BASE_URL;

describe.skipIf(!baseUrl)("transactional booking API", () => {
  it("allows only one of two concurrent requests for the same slot", async () => {
    const servicesResponse = await fetch(`${baseUrl}/api/services`);
    const mastersResponse = await fetch(`${baseUrl}/api/masters`);
    const { services } = (await servicesResponse.json()) as {
      services: Array<{ id: string; name: string; durationMinutes: number; priceMinor: number }>;
    };
    const { staff } = (await mastersResponse.json()) as {
      staff: Array<{ id: string; slug: string }>;
    };
    const service = services.find((item) => item.name === "Маникюр с покрытием гель-лак");
    const master = staff.find((item) => item.slug === "tatyana-kravchenko");
    expect(service).toBeDefined();
    expect(master).toBeDefined();

    const now = new Date();
    const months = [0, 1].map((offset) =>
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1))
        .toISOString()
        .slice(0, 7),
    );
    let availableDate: string | undefined;
    for (const month of months) {
      const calendarResponse = await fetch(
        `${baseUrl}/api/availability/calendar?serviceId=${service!.id}&staffId=${master!.id}&month=${month}`,
      );
      const calendar = (await calendarResponse.json()) as { dates: Array<{ date: string }> };
      availableDate = calendar.dates[0]?.date;
      if (availableDate) break;
    }
    expect(availableDate).toBeDefined();

    const availabilityResponse = await fetch(
      `${baseUrl}/api/availability?serviceId=${service!.id}&staffId=${master!.id}&date=${availableDate}`,
    );
    const availability = (await availabilityResponse.json()) as {
      masters: Array<{ starts: string[] }>;
      constraints: { technicalBreakMinutes: number };
    };
    const startAt = availability.masters[0]?.starts[0];
    expect(startAt).toBeDefined();

    const runId = Date.now().toString(36);
    const request = (suffix: string) =>
      fetch(`${baseUrl}/api/booking-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `stage12-vitest-${runId}-${suffix}`,
        },
        body: JSON.stringify({
          serviceIds: [service!.id],
          staffId: master!.id,
          startAt,
          customer: {
            firstName: "Тест",
            lastName: suffix,
            phone: suffix === "first" ? "+79990000021" : "+79990000022",
          },
        }),
      });

    const responses = await Promise.all([request("first"), request("second")]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);

    const winnerIndex = responses.findIndex((response) => response.status === 201);
    const winner = (await responses[winnerIndex].json()) as {
      id: string;
      status: string;
      startAt: string;
      endAt: string;
      occupiedUntil: string;
      totalPriceMinor: number;
    };
    expect(winner.status).toBe("PENDING");
    expect(winner.totalPriceMinor).toBe(service!.priceMinor);
    expect(new Date(winner.endAt).getTime() - new Date(winner.startAt).getTime()).toBe(
      service!.durationMinutes * 60_000,
    );
    expect(new Date(winner.occupiedUntil).getTime() - new Date(winner.endAt).getTime()).toBe(
      availability.constraints.technicalBreakMinutes * 60_000,
    );

    const repeated = await request(winnerIndex === 0 ? "first" : "second");
    expect(repeated.status).toBe(200);
    expect(((await repeated.json()) as { id: string }).id).toBe(winner.id);
  });
});
