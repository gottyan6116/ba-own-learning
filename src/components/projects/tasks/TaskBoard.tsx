"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
import {
  groupTasksForBoard,
  PROJECT_TASK_BOARD_COLUMNS,
  PROJECT_TASK_STATUS_LABEL,
  taskTitleOrFallback,
  type ProjectTask,
  type ProjectTaskStatus,
} from "@/lib/project-tasks/types";
import { formatShortDate } from "@/lib/project-tasks/dateUtils";
import { TaskCreateButton } from "./TaskCreateButton";

type DragData =
  | { type: "task"; status: ProjectTaskStatus }
  | { type: "column"; status: ProjectTaskStatus };

const COLUMN_STYLE: Record<ProjectTaskStatus, { surface: string; accent: string; empty: string }> = {
  todo: { surface: "border-stone-200 bg-stone-100/80", accent: "bg-stone-500", empty: "text-stone-500" },
  in_progress: { surface: "border-blue-100 bg-blue-50/80", accent: "bg-blue-500", empty: "text-blue-600" },
  blocked: { surface: "border-rose-100 bg-rose-50/80", accent: "bg-rose-500", empty: "text-rose-600" },
  done: { surface: "border-emerald-100 bg-emerald-50/80", accent: "bg-emerald-500", empty: "text-emerald-600" },
};

export function TaskBoard({ onOpenTask }: { onOpenTask: (taskId: string) => void }) {
  const { tasks, moveTask } = useProjectTasks();
  const grouped = groupTasksForBoard(tasks);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const activeData = event.active.data.current as DragData | undefined;
    const overData = event.over?.data.current as DragData | undefined;
    if (!event.over || activeData?.type !== "task" || !overData) return;

    const destinationStatus = overData.status;
    const destinationTasks = grouped[destinationStatus];
    const overIndex = overData.type === "task"
      ? destinationTasks.findIndex((task) => task.id === event.over?.id)
      : destinationTasks.length;
    void moveTask(String(event.active.id), destinationStatus, Math.max(0, overIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="scroll-area min-h-0 flex-1 overflow-auto bg-[#f7f6f4] p-4 sm:p-6 lg:p-8">
        <div className="grid min-w-[1040px] grid-cols-4 gap-5">
          {PROJECT_TASK_BOARD_COLUMNS.map((status) => (
            <TaskColumn key={status} status={status} tasks={grouped[status]} onOpenTask={onOpenTask} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function TaskColumn({
  status,
  tasks,
  onOpenTask,
}: {
  status: ProjectTaskStatus;
  tasks: ProjectTask[];
  onOpenTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status}`,
    data: { type: "column", status } satisfies DragData,
  });
  const style = COLUMN_STYLE[status];

  return (
    <section
      ref={setNodeRef}
      aria-label={`${PROJECT_TASK_STATUS_LABEL[status]}のタスク`}
      className={`min-h-[340px] rounded-2xl border p-3.5 shadow-[0_12px_28px_rgb(22_25_31_/_0.04)] transition-[background-color,border-color,box-shadow] ${
        isOver ? "border-[var(--color-zenith)] bg-white shadow-[0_16px_36px_rgb(37_99_235_/_0.13)]" : style.surface
      }`}
    >
      <div className="mb-3.5 flex items-center justify-between gap-2 px-0.5">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink)]">
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${style.accent}`} />
          {PROJECT_TASK_STATUS_LABEL[status]}
          <span className="tabular rounded-full bg-white/75 px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-ink-muted)]">
            {tasks.length}
          </span>
        </h3>
        {status === "todo" && <TaskCreateButton onCreated={onOpenTask} className="h-7 rounded-lg px-2.5 text-[12px] shadow-sm" />}
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5">
          {tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={() => onOpenTask(task.id)} />)}
        </div>
      </SortableContext>
      {tasks.length === 0 && <p className={`pt-8 text-center text-[12px] ${style.empty}`}>カードをここへ移動</p>}
    </section>
  );
}

function TaskCard({ task, onOpen }: { task: ProjectTask; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status } satisfies DragData,
  });
  const period = task.start_date || task.end_date
    ? `${formatShortDate(task.start_date) || "未定"} – ${formatShortDate(task.end_date) || "未定"}`
    : null;

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group rounded-xl border border-white/90 bg-white p-3.5 shadow-[0_5px_13px_rgb(22_25_31_/_0.09)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgb(22_25_31_/_0.13)] ${isDragging ? "scale-[0.98] opacity-45" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          aria-label="カードを移動"
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-[var(--color-ink-muted)] opacity-45 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left text-[14px] font-semibold leading-5 text-[var(--color-ink)] transition-colors hover:text-[var(--color-zenith)]"
        >
          {taskTitleOrFallback(task)}
        </button>
      </div>
      {(period || task.progress > 0) && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-ink-muted)]">
            <span className="truncate">{period ?? "期限未設定"}</span>
            {task.progress > 0 && <span className="tabular shrink-0 rounded-full bg-[var(--color-surface-sunken)] px-1.5 py-0.5 font-medium">{task.progress}%</span>}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--color-surface-sunken)]" aria-label={`進捗 ${task.progress}%`}>
            <div className="h-full rounded-full bg-[var(--color-zenith)] transition-[width] duration-300" style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      )}
    </article>
  );
}