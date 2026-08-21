"use client";

import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";

export function TaskCreateButton({
  onCreated,
  className,
}: {
  onCreated: (taskId: string) => void;
  className?: string;
}) {
  const { createTask } = useProjectTasks();

  const handleClick = async () => {
    const created = await createTask({ title: "", status: "todo", progress: 0 });
    if (created) onCreated(created.id);
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={
        className ??
        "h-9 shrink-0 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-3 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)]"
      }
    >
      ＋ タスク
    </button>
  );
}
