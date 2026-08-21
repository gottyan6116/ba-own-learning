/**
 * date 列（YYYY-MM-DD）専用の純粋な日付演算。
 *
 * `new Date("2026-08-20")` は UTC 深夜として解釈されるため、ローカル
 * タイムゾーンが UTC より進んでいると toISOString() 等で前日にずれる。
 * ここでは常に UTC のエポック日数だけで計算し、文字列⇄Date の変換点を
 * この1ファイルへ集約する。Gantt のドラッグ／リサイズもすべてこれを使う。
 */

export type ISODate = string; // "YYYY-MM-DD"

const MS_PER_DAY = 86_400_000;

/** "YYYY-MM-DD" → UTC 深夜の Date。不正な形式は null。 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → "YYYY-MM-DD"（UTC 基準）。 */
export function formatISODate(date: Date): ISODate {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function addDaysISO(value: ISODate, days: number): ISODate {
  const date = parseDate(value);
  if (!date) return value;
  return formatISODate(addDays(date, days));
}

/** a - b の日数。両方 UTC 深夜前提なので端数は出ない。 */
export function differenceInDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

export function todayISO(): ISODate {
  const now = new Date();
  return formatISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function minDate(...dates: Array<Date | null>): Date | null {
  const valid = dates.filter((d): d is Date => d !== null);
  if (valid.length === 0) return null;
  return valid.reduce((min, d) => (d.getTime() < min.getTime() ? d : min));
}

export function maxDate(...dates: Array<Date | null>): Date | null {
  const valid = dates.filter((d): d is Date => d !== null);
  if (valid.length === 0) return null;
  return valid.reduce((max, d) => (d.getTime() > max.getTime() ? d : max));
}

const MONTH_LABEL = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
] as const;

export function formatMonthLabel(date: Date): string {
  return `${date.getUTCFullYear()}年 ${MONTH_LABEL[date.getUTCMonth()]}`;
}

export function formatDayLabel(date: Date): string {
  return String(date.getUTCDate());
}

const WEEKDAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatWeekdayLabel(date: Date): string {
  return WEEKDAY_LABEL[date.getUTCDay()];
}

/** 表示用「8/20」形式。 */
export function formatShortDate(value: ISODate | null): string {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}
