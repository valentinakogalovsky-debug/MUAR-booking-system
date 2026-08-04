import type { AvailabilityException, SchedulePattern } from "@/generated/prisma/client";
import { differenceInCalendarDays, isoWeekday, studioDateTimeToUtc } from "./time";

export interface TimeInterval {
  startAt: Date;
  endAt: Date;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function patternWorks(pattern: SchedulePattern, date: string): boolean {
  const validFrom = dateOnly(pattern.validFrom);
  const validUntil = pattern.validUntil ? dateOnly(pattern.validUntil) : null;
  if (date < validFrom || (validUntil && date > validUntil)) return false;

  if (pattern.type === "WEEKLY") return pattern.dayOfWeek === isoWeekday(date);
  if (!pattern.anchorDate || !pattern.cycleLengthDays) return false;

  const day = differenceInCalendarDays(date, dateOnly(pattern.anchorDate));
  const cycleDay =
    ((day % pattern.cycleLengthDays) + pattern.cycleLengthDays) % pattern.cycleLengthDays;
  return pattern.workingCycleDays.includes(cycleDay);
}

function subtract(intervals: TimeInterval[], blocked: TimeInterval): TimeInterval[] {
  return intervals.flatMap((interval) => {
    if (blocked.endAt <= interval.startAt || blocked.startAt >= interval.endAt) return [interval];
    const result: TimeInterval[] = [];
    if (blocked.startAt > interval.startAt) {
      result.push({ startAt: interval.startAt, endAt: blocked.startAt });
    }
    if (blocked.endAt < interval.endAt) {
      result.push({ startAt: blocked.endAt, endAt: interval.endAt });
    }
    return result;
  });
}

export function calculateWorkingIntervals(
  date: string,
  timeZone: string,
  patterns: SchedulePattern[],
  exceptions: AvailabilityException[],
): TimeInterval[] {
  const dayStart = studioDateTimeToUtc(date, 0, timeZone);
  const dayEnd = studioDateTimeToUtc(date, 1440, timeZone);
  const clip = ({ startAt, endAt }: TimeInterval): TimeInterval => ({
    startAt: startAt < dayStart ? dayStart : startAt,
    endAt: endAt > dayEnd ? dayEnd : endAt,
  });
  let intervals = patterns
    .filter((pattern) => patternWorks(pattern, date))
    .map((pattern) => ({
      startAt: studioDateTimeToUtc(date, pattern.startMinute, timeZone),
      endAt: studioDateTimeToUtc(date, pattern.endMinute, timeZone),
    }));

  const available = exceptions
    .filter((exception) => exception.type === "AVAILABLE")
    .map(({ startAt, endAt }) => clip({ startAt, endAt }));
  if (available.length > 0) intervals = available;

  for (const exception of exceptions.filter((item) => item.type === "UNAVAILABLE")) {
    intervals = subtract(intervals, clip(exception));
  }

  return intervals
    .filter((interval) => interval.startAt < interval.endAt)
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
}
