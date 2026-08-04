export function scheduleDateUrl(date: string): string {
  return `/admin/schedule?date=${encodeURIComponent(date)}`;
}
