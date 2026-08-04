import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const services = await getDb().service.findMany({
    where: { organization: { slug: "muare" }, isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      durationMinutes: true,
      priceMinor: true,
      currency: true,
    },
  });
  return NextResponse.json({ services });
}
