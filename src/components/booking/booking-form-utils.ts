export interface AvailableSlot {
  startAt: string;
  staffIds: string[];
}

export function formatStudioSlot(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function studioToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addCalendarDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export function isValidBookingPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return (
    (digits.length === 10 && digits.startsWith("9")) ||
    (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8")))
  );
}
