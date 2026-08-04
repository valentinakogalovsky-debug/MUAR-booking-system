import type { TimeInterval } from "@/lib/schedule/calculate";

export const BLOCKING_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

export interface BusyInterval {
  startAt: Date;
  occupiedUntil: Date;
}

export function generateAvailableStarts({
  workingIntervals,
  busyIntervals,
  durationMinutes,
  technicalBreakMinutes,
  slotStepMinutes,
  earliestStart,
}: {
  workingIntervals: TimeInterval[];
  busyIntervals: BusyInterval[];
  durationMinutes: number;
  technicalBreakMinutes: number;
  slotStepMinutes: number;
  earliestStart: Date;
}): Date[] {
  const stepMs = slotStepMinutes * 60_000;
  const occupiedMs = (durationMinutes + technicalBreakMinutes) * 60_000;
  const starts = new Map<number, Date>();

  for (const interval of workingIntervals) {
    const firstCandidate = Math.max(interval.startAt.getTime(), earliestStart.getTime());
    let candidateMs = Math.ceil(firstCandidate / stepMs) * stepMs;

    while (candidateMs + occupiedMs <= interval.endAt.getTime()) {
      const occupiedUntilMs = candidateMs + occupiedMs;
      const overlaps = busyIntervals.some(
        (busy) =>
          busy.startAt.getTime() < occupiedUntilMs && busy.occupiedUntil.getTime() > candidateMs,
      );
      if (!overlaps) starts.set(candidateMs, new Date(candidateMs));
      candidateMs += stepMs;
    }
  }

  return [...starts.values()].sort((left, right) => left.getTime() - right.getTime());
}
