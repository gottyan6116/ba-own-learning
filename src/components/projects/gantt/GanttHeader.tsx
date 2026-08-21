import { formatDayLabel, formatMonthLabel, isWeekend } from "@/lib/project-tasks/dateUtils";
import { GanttTodayMarker } from "./GanttTodayMarker";
import { DAY_ROW_HEIGHT, LEFT_COL_CLASS, MONTH_ROW_HEIGHT } from "./ganttLayout";

interface MonthGroup {
  label: string;
  days: Date[];
}

function groupByMonth(days: Date[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const day of days) {
    const label = formatMonthLabel(day);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.days.push(day);
    } else {
      groups.push({ label, days: [day] });
    }
  }
  return groups;
}

/** 最低2階層（月・日）のヘッダー。sticky で常に見える。 */
export function GanttHeader({
  days,
  dayWidth,
  todayIndex,
}: {
  days: Date[];
  dayWidth: number;
  todayIndex: number | null;
}) {
  const months = groupByMonth(days);
  const totalWidth = days.length * dayWidth;

  return (
    <div className="sticky top-0 z-30 bg-white">
      <div
        className="flex border-b border-[var(--color-line-faint)]"
        style={{ height: MONTH_ROW_HEIGHT }}
      >
        <div
          className={`${LEFT_COL_CLASS} sticky left-0 z-10 shrink-0 border-r border-[var(--color-line)] bg-white`}
        />
        <div className="flex" style={{ width: totalWidth }}>
          {months.map((month, index) => (
            <div
              key={`${month.label}-${index}`}
              className="shrink-0 truncate border-r border-[var(--color-line-faint)] px-2 text-[12px] font-medium leading-[28px] text-[var(--color-ink-secondary)] last:border-r-0"
              style={{ width: month.days.length * dayWidth }}
            >
              {month.label}
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative flex border-b-2 border-[var(--color-rule)]"
        style={{ height: DAY_ROW_HEIGHT }}
      >
        <div
          className={`${LEFT_COL_CLASS} sticky left-0 z-10 shrink-0 border-r border-[var(--color-line)] bg-white`}
        />
        <div className="relative flex" style={{ width: totalWidth }}>
          {days.map((day, index) => (
            <div
              key={day.toISOString()}
              className={`tabular flex shrink-0 items-center justify-center border-r border-[var(--color-line-faint)] text-[11px] last:border-r-0 ${
                isWeekend(day) ? "bg-[var(--color-surface-sunken)]" : ""
              } ${
                index === todayIndex
                  ? "font-semibold text-[var(--color-zenith)]"
                  : "text-[var(--color-ink-muted)]"
              }`}
              style={{ width: dayWidth }}
            >
              {formatDayLabel(day)}
            </div>
          ))}
          {todayIndex !== null && (
            <GanttTodayMarker offsetPx={todayIndex * dayWidth + dayWidth / 2} />
          )}
        </div>
      </div>
    </div>
  );
}
