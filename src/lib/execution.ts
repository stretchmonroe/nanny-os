import type { TimeWindow } from "./activities";

export type ActivityStatus = "idle" | "active" | "done";

export interface ActivityExecution {
  status: ActivityStatus;
  startedAt?: number;
  completedAt?: number;
  note?: string;
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
