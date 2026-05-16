import type { TimeWindow } from "./activities";

export type ActivityStatus = "idle" | "active" | "done" | "skipped";
export type ActivityOutcome = "great" | "okay" | "rough";

export interface ActivityExecution {
  status: ActivityStatus;
  startedAt?: number;
  completedAt?: number;
  skippedAt?: number;
  note?: string;
  outcome?: ActivityOutcome;
  replacedBy?: string;
}

export type ExecutionMap = Partial<Record<TimeWindow, ActivityExecution>>;

const storageKey = () =>
  `nannyos_exec_${new Date().toDateString()}`;

export function loadExecution(): ExecutionMap {
  try {
    const raw = sessionStorage.getItem(storageKey());
    return raw ? (JSON.parse(raw) as ExecutionMap) : {};
  } catch {
    return {};
  }
}

export function persistExecution(map: ExecutionMap): void {
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify(map));
  } catch {
    // storage unavailable — degrade silently
  }
}
