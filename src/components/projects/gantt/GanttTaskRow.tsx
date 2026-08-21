import { isWeekend } from "@/lib/project-tasks/dateUtils";
import { taskTitleOrFallback, type ProjectTask } from "@/lib/project-tasks/types";
import { GanttTaskBar } from "./GanttTaskBar";
import { GanttTodayMarker } from "./GanttTodayMarker";
import { LEFT_COL_CLASS, ROW_HEIGHT } from "./ganttLayout";

export function GanttTaskRow({
  task,
  days,
  dayWidth,
  rangeStart,
  todayIndex,
  onOpenEditor,
}: {
  task: ProjectTask;
  days: Date[];
  dayWidth: number;
  rangeStart: Date;
  todayIndex: number | null;
  onOpenEditor: (taskId: string) => void;
}) {
  const totalWidth = days.length * dayWidth;

  return (
    <div
      className="flex border-b border-[var(--color-line-faint)]"
      style={{ height: ROW_HEIGHT }}
    >
      <div
        className={`${LEFT_COL_CLASS} sticky left-0 z-10 flex shrink-0 items-center border-r border-[var(--color-line)] bg-white px-2`}
      >
        <button
          type="button"
          onClick={() => onOpenEditor(task.id)}
          className="w-full cursor-pointer truncate text-left text-[13px] text-[var(--color-ink)] transition-colors duration-150 hover:text-[var(--color-zenith)]"
        >
          {taskTitleOrFallback(task)}
        </button>
      </div>
      <div className="relative" style={{ width: totalWidth }}>
        {days.map((day, index) =>
          isWeekend(day) ? (
            <div
              key={day.toISOString()}
              aria-hidden="true"
              className="absolute inset-y-0 bg-[var(--color-surface-sunken)]"
              style={{ left: index * dayWidth, width: dayWidth }}
            />
          ) : null,
        )}
        {todayIndex !== null && (
          <GanttTodayMarker offsetPx={todayIndex * dayWidth + dayWidth / 2} />
        )}
        <GanttTaskBar
          task={task}
          dayWidth={dayWidth}
          rangeStart={rangeStart}
          onOpenEditor={onOpenEditor}
        />
      </div>
    </div>
  );
}
