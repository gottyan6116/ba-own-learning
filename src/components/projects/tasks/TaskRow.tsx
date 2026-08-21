import { formatShortDate } from "@/lib/project-tasks/dateUtils";
import {
  PROJECT_TASK_STATUS_LABEL,
  taskTitleOrFallback,
  type ProjectTask,
} from "@/lib/project-tasks/types";

const STATUS_TONE: Record<ProjectTask["status"], string> = {
  todo: "text-[var(--color-ink-muted)]",
  in_progress: "text-[var(--color-zenith)]",
  blocked: "text-[var(--color-danger)]",
  done: "text-[var(--color-ink-secondary)]",
};

export function TaskRow({ task, onOpen }: { task: ProjectTask; onOpen: () => void }) {
  const period =
    task.start_date || task.end_date
      ? `${formatShortDate(task.start_date) || "未定"} - ${formatShortDate(task.end_date) || "未定"}`
      : "未スケジュール";

  return (
    <tr
      tabIndex={0}
      role="button"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer border-b border-[var(--color-line-faint)] transition-colors duration-150 hover:bg-[var(--color-surface-sunken)] focus-visible:bg-[var(--color-surface-sunken)]"
    >
      <th scope="row" className="max-w-0 px-3 py-2.5 text-left font-normal">
        <span className="block truncate text-[14px] text-[var(--color-ink)]">
          {taskTitleOrFallback(task)}
        </span>
      </th>
      <td className={`whitespace-nowrap px-3 py-2.5 text-[13px] ${STATUS_TONE[task.status]}`}>
        {PROJECT_TASK_STATUS_LABEL[task.status]}
      </td>
      <td className="tabular whitespace-nowrap px-3 py-2.5 text-[13px] text-[var(--color-ink-secondary)]">
        {period}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--color-line-faint)]">
            <div
              className="h-full rounded-full bg-[var(--color-zenith)]"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="tabular shrink-0 text-[12px] text-[var(--color-ink-muted)]">
            {task.progress}%
          </span>
        </div>
      </td>
    </tr>
  );
}
