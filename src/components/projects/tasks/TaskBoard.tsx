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
    const overIndex =
      overData.type === "task"
        ? destinationTasks.findIndex((task) => task.id === event.over?.id)
        : destinationTasks.length;
    // reorderTasksForBoard は対象カードを先に除去するため、同じ列でも
    // over の位置をそのまま渡す（+1 すると下方向移動が一つ先へずれる）。
    const destinationIndex = Math.max(0, overIndex);

    void moveTask(String(event.active.id), destinationStatus, destinationIndex);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="scroll-area min-h-0 flex-1 overflow-auto bg-[var(--color-surface-sunken)] p-4 sm:p-6">
        <div className="grid min-w-[960px] grid-cols-4 gap-4">
          {PROJECT_TASK_BOARD_COLUMNS.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              onOpenTask={onOpenTask}
            />
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

  return (
    <section
      ref={setNodeRef}
      aria-label={`${PROJECT_TASK_STATUS_LABEL[status]}のタスク`}
      className={`min-h-[260px] rounded-[6px] border p-3 transition-colors ${
        isOver
          ? "border-[var(--color-zenith)] bg-white"
          : "border-[var(--color-line)] bg-[rgb(255_255_255_/_0.72)]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">
          {PROJECT_TASK_STATUS_LABEL[status]}
          <span className="tabular ml-1.5 text-[12px] font-normal text-[var(--color-ink-muted)]">
            {tasks.length}
          </span>
        </h3>
        {status === "todo" && <TaskCreateButton onCreated={onOpenTask} className="h-7 rounded-[4px] px-2 text-[12px]" />}
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={() => onOpenTask(task.id)} />
          ))}
        </div>
      </SortableContext>
      {tasks.length === 0 && (
        <p className="pt-5 text-center text-[12px] text-[var(--color-ink-muted)]">カードをここへ移動</p>
      )}
    </section>
  );
}

function TaskCard({ task, onOpen }: { task: ProjectTask; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status } satisfies DragData,
  });
  const period =
    task.start_date || task.end_date
      ? `${formatShortDate(task.start_date) || "未定"} – ${formatShortDate(task.end_date) || "未定"}`
      : null;

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-[5px] border border-[var(--color-line)] bg-white p-3 shadow-[0_1px_1px_rgb(22_25_31_/_0.04)] ${
        isDragging ? "opacity-45" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="カードを移動"
          className="mt-0.5 cursor-grab touch-none text-[var(--color-ink-muted)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left text-[13px] font-medium leading-5 text-[var(--color-ink)] hover:text-[var(--color-zenith)]"
        >
          {taskTitleOrFallback(task)}
        </button>
      </div>
      {(period || task.progress > 0) && (
        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[var(--color-ink-muted)]">
          <span className="truncate">{period}</span>
          {task.progress > 0 && <span className="tabular shrink-0">{task.progress}%</span>}
        </div>
      )}
    </article>
  );
}
