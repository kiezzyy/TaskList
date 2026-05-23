export function durationSeconds(startedAt: Date, endedAt: Date) {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
}
