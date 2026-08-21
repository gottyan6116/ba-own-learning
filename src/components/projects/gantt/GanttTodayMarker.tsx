/** 今日を示す細い縦線。派手な色は使わず、差し色の水色をごく薄く。 */
export function GanttTodayMarker({ offsetPx }: { offsetPx: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 w-px bg-[var(--color-zenith)] opacity-40"
      style={{ left: offsetPx }}
    />
  );
}
