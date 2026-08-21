"use client";

import { useState } from "react";
import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
import { sortTasks } from "@/lib/project-tasks/types";
import { TaskRow } from "./TaskRow";
import { TaskCreateButton } from "./TaskCreateButton";
import { TaskEditor } from "./TaskEditor";

const COLUMN_HEADERS = ["Task", "Status", "Start – End", "Progress"];

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

  const sorted = sortTasks(tasks);
  const openTask = sorted.find((task) => task.id === openTaskId) ?? null;

  return (
    <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[900px] px-5 py-6 sm:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">タスク</h2>
          <TaskCreateButton onCreated={setOpenTaskId} />
        </div>

        {sorted.length === 0 ? (
          <div className="border-t border-[var(--color-line-faint)] py-8 text-center">
            <p className="text-[14px] leading-7 text-[var(--color-ink-secondary)]">
              まだタスクがありません。
            </p>
            <p className="mx-auto mt-1 max-w-[36ch] text-[13px] leading-6 text-[var(--color-ink-muted)]">
              最初のタスクを追加すると、ガントチャート上でスケジュールを管理できます。
            </p>
            <div className="mt-4 flex justify-center">
              <TaskCreateButton onCreated={setOpenTaskId} />
            </div>
          </div>
        ) : (
          <div className="scroll-area scroll-shadow-x -mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[540px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-[var(--color-rule)]">
                  {COLUMN_HEADERS.map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((task) => (
                  <TaskRow key={task.id} task={task} onOpen={() => setOpenTaskId(task.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
