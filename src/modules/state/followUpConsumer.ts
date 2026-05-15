import type { FollowUpTask, MediaryLoopOutput } from "@/src/types/mediary";
import { loadLatestRun } from "./ledgerStore";

export type TaskStatus = "pending" | "overdue" | "ready" | "resolved";

export type ConsumedTask = FollowUpTask & {
  computedStatus: TaskStatus;
  daysSinceQueued: number;
  action: "process_now" | "wait" | "escalate" | "skip";
  reason: string;
};

function parseDueIn(dueIn: string): number {
  if (dueIn.includes("48 hours")) return 2;
  if (dueIn.includes("3 working days")) return 3;
  if (dueIn.includes("7 days")) return 7;
  return 7;
}

export function consumeFollowUpTasks(current: MediaryLoopOutput): {
  consumed: ConsumedTask[];
  overdueCount: number;
  readyCount: number;
  resolvedCount: number;
  summary: string;
} {
  const previous = loadLatestRun(current.scenario);

  if (!previous) {
    return {
      consumed: [],
      overdueCount: 0,
      readyCount: 0,
      resolvedCount: 0,
      summary: "No previous run — all tasks are new.",
    };
  }

  const prevTasks = previous.followUpTasks ?? [];
  const currQueue = current.interventionQueue;

  const consumed: ConsumedTask[] = prevTasks.map((task) => {
    const dueDays = parseDueIn(task.dueIn);
    const stillInQueue = currQueue.some((item) => item.employeeId === task.employeeId);
    const currentEntry = currQueue.find((item) => item.employeeId === task.employeeId);
    const currentRoute = currentEntry?.route;

    // Check if employee resolved (no longer in queue or dropped to Low)
    if (!currentEntry) {
      return {
        ...task,
        computedStatus: "resolved" as TaskStatus,
        daysSinceQueued: dueDays,
        action: "skip" as const,
        reason: "Employee no longer in intervention queue — risk resolved.",
      };
    }

    // Check if route escalated (task needs upgrading)
    if (currentRoute && currentRoute.includes("Sustained High") && task.owner !== "HR Ops") {
      return {
        ...task,
        computedStatus: "overdue" as TaskStatus,
        daysSinceQueued: dueDays,
        action: "escalate" as const,
        reason: `Route escalated to ${currentRoute}. Previous follow-up insufficient.`,
      };
    }

    // Normal overdue check
    return {
      ...task,
      computedStatus: "ready" as TaskStatus,
      daysSinceQueued: dueDays,
      action: "process_now" as const,
      reason: `Follow-up due (${task.dueIn}). Task: ${task.task}`,
    };
  });

  const overdueCount = consumed.filter((t) => t.computedStatus === "overdue").length;
  const readyCount = consumed.filter((t) => t.computedStatus === "ready").length;
  const resolvedCount = consumed.filter((t) => t.computedStatus === "resolved").length;

  const summaryParts: string[] = [];
  summaryParts.push(`${consumed.length} follow-up tasks from previous run.`);
  if (readyCount > 0) summaryParts.push(`${readyCount} ready to process.`);
  if (overdueCount > 0) summaryParts.push(`${overdueCount} overdue — escalation needed.`);
  if (resolvedCount > 0) summaryParts.push(`${resolvedCount} resolved (employee improved).`);
  if (readyCount === 0 && overdueCount === 0) summaryParts.push("All clear — no action needed.");

  return {
    consumed,
    overdueCount,
    readyCount,
    resolvedCount,
    summary: summaryParts.join(" "),
  };
}
