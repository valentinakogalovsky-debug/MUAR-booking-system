const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseDate(value: string): string {
  if (!datePattern.test(value)) throw new Error("Некорректная дата");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Некорректная дата");
  }
  return value;
}

export function parseTimeToMinutes(value: string): number {
  const match = timePattern.exec(value);
  if (!match) throw new Error("Некорректное время");
  return Number(match[1]) * 60 + Number(match[2]);
}

export function addDays(date: string, days: number): string {
  const result = new Date(`${parseDate(date)}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function differenceInCalendarDays(left: string, right: string): number {
  return Math.round(
    (Date.parse(`${parseDate(left)}T00:00:00.000Z`) -
      Date.parse(`${parseDate(right)}T00:00:00.000Z`)) /
      86_400_000,
  );
}

export function isoWeekday(date: string): number {
  const weekday = new Date(`${parseDate(date)}T00:00:00.000Z`).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function studioDateTimeToUtc(date: string, minutes: number, timeZone: string): Date {
  parseDate(date);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
    throw new Error("Некорректные минуты смены");
  }
  const effectiveDate = minutes === 1440 ? addDays(date, 1) : date;
  const effectiveMinutes = minutes === 1440 ? 0 : minutes;
  const [year, month, day] = effectiveDate.split("-").map(Number);
  const desiredUtc = Date.UTC(
    year,
    month - 1,
    day,
    Math.floor(effectiveMinutes / 60),
    effectiveMinutes % 60,
  );
  const guess = new Date(desiredUtc);
  const zoned = partsAt(guess, timeZone);
  const representedUtc = Date.UTC(
    Number(zoned.year),
    Number(zoned.month) - 1,
    Number(zoned.day),
    Number(zoned.hour),
    Number(zoned.minute),
    Number(zoned.second),
  );
  return new Date(desiredUtc - (representedUtc - guess.getTime()));
}

export function studioDate(date: Date, timeZone: string): string {
  const parts = partsAt(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatStudioTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
