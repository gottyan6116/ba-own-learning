/** Gantt の複数コンポーネントで共有する寸法定数。 */

export type GanttZoom = "standard" | "compact";

export const ZOOM_DAY_WIDTH: Record<GanttZoom, number> = {
  standard: 32,
  compact: 20,
};

export const ROW_HEIGHT = 44;
export const MONTH_ROW_HEIGHT = 28;
export const DAY_ROW_HEIGHT = 28;
export const HEADER_HEIGHT = MONTH_ROW_HEIGHT + DAY_ROW_HEIGHT;

/** 左列（タスク名）の幅。Desktop / Mobile で responsive に変える。 */
export const LEFT_COL_CLASS = "w-[112px] sm:w-[220px]";
