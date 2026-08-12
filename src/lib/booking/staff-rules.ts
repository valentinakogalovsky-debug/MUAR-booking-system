export function canStaffSetFinalStatus(currentStatus: string, nextStatus: string) {
  return currentStatus === "CONFIRMED" && (nextStatus === "COMPLETED" || nextStatus === "NO_SHOW");
}
