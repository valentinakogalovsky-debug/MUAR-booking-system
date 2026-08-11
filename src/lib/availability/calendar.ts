import { addDays, parseDate } from "../schedule/time";

const monthPattern = /^\d{4}-\d{2}$/;

export function datesInMonth(value: string) {
  if (!monthPattern.test(value)) throw new Error("Некорректный месяц");
  const firstDate = parseDate(`${value}-01`);
  const [year, month] = value.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7);
  const dates: string[] = [];
  for (let date = firstDate; date.startsWith(value); date = addDays(date, 1)) dates.push(date);
  if (addDays(dates.at(-1)!, 1).slice(0, 7) !== nextMonth) throw new Error("Некорректный месяц");
  return dates;
}
