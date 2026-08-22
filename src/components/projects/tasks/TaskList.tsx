"use client";

import { useState } from "react";
import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
import { TaskEditor } from "./TaskEditor";
import { TaskBoard } from "./TaskBoard";

export function TaskList() {
  const { status, tasks, errorMessage } = useProjectTasks();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  if (status === "loading") {
    return <Message>タスクを取得しています。</Message>;
  }
  if (status === "error") {
    return (
      <Message>
        タスクを取得できませんでした。{errorMessage && `（${errorMessage}）`}
      </Message>
    );
  }

  const openTask = tasks.find((task) => task.id === openTaskId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-3 sm:px-6">
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">タスクボード</h2>
        <span className="text-[12px] text-[var(--color-ink-muted)]">カードをドラッグして状態と順序を変更</span>
      </div>
      <TaskBoard onOpenTask={setOpenTaskId} />
      <TaskEditor
        task={openTask}
        open={openTask !== null}
        onOpenChange={(open) => !open && setOpenTaskId(null)}
      />
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">{children}</div>
  );
}
