import { EXECUTOR_IDENTITY } from "@/src/agents/identity";
import { loadMemory, saveMemory, updateExecutorMemory } from "@/src/modules/state/agentMemory";
import type {
  ActionArtifact,
  AnalystOutput,
  DemoScenario,
  ExecutorOutput,
  FollowUpTask,
  InterventionQueueItem,
  RunLedger,
  ToolInvocation,
} from "@/src/types/mediary";

function buildToolInvocations(queue: InterventionQueueItem[]): ToolInvocation[] {
  const invocations: ToolInvocation[] = [];
  queue.forEach((item) => {
    const pushTool = (tool: ToolInvocation["tool"], summary: string) => {
      invocations.push({
        id: `tool-${invocations.length + 1}`,
        tool,
        targetEmployeeId: item.employeeId,
        targetEmployeeName: item.employeeName,
        route: item.route,
        status: "executed",
        summary,
      });
    };

    if (item.route === "Medium: employee nudge") {
      pushTool("EMPLOYEE_NUDGE_TOOL", "Prepared employee nudge action draft and execution checklist.");
      return;
    }
    if (item.route === "High: employee nudge + manager brief") {
      pushTool("EMPLOYEE_NUDGE_TOOL", "Prepared employee nudge action draft and execution checklist.");
      pushTool("MANAGER_BRIEF_TOOL", "Prepared manager brief with route rationale and next-step expectations.");
      pushTool("FOCUS_BLOCK_PLANNER", "Prepared focus-block plan for meeting density reduction.");
      return;
    }
    if (item.route === "Sustained High: HR Ops queue") {
      pushTool("HR_OPS_CASE_TOOL", "Prepared HR Ops case packet with sustained-load evidence.");
      pushTool("MANAGER_BRIEF_TOOL", "Prepared manager brief with sustained-load route rationale.");
      pushTool("FOCUS_BLOCK_PLANNER", "Prepared focus-block plan for recovery and workload stabilization.");
      pushTool("FOLLOW_UP_SCHEDULER", "Prepared deterministic follow-up schedule for HR Ops review.");
      return;
    }
    pushTool("FOLLOW_UP_SCHEDULER", "Prepared monitor-only weekly review task.");
  });
  return invocations;
}

function buildActionArtifacts(queue: InterventionQueueItem[]): ActionArtifact[] {
  const artifacts: ActionArtifact[] = [];
  const pushArtifact = (item: InterventionQueueItem, type: ActionArtifact["type"], owner: ActionArtifact["owner"], title: string, body: string) => {
    artifacts.push({ id: `artifact-${artifacts.length + 1}`, type, employeeId: item.employeeId, employeeName: item.employeeName, owner, title, body });
  };

  queue.forEach((item) => {
    if (item.route === "Medium: employee nudge") {
      pushArtifact(item, "employee_nudge", "Employee", `Employee nudge for ${item.employeeName}`, item.nextStep);
      return;
    }
    if (item.route === "High: employee nudge + manager brief") {
      pushArtifact(item, "employee_nudge", "Employee", `Employee nudge for ${item.employeeName}`, item.nextStep);
      pushArtifact(item, "manager_brief", "Manager", `Manager brief for ${item.employeeName}`, `${item.decisionRationale} Follow-up cadence: ${item.followUpCadence}`);
      pushArtifact(item, "focus_block_plan", "Manager", `Focus block plan for ${item.employeeName}`, "Protect two deterministic deep-work windows and reduce dense meeting clusters this cycle.");
      return;
    }
    if (item.route === "Sustained High: HR Ops queue") {
      pushArtifact(item, "hr_ops_case", "HR Ops", `HR Ops case for ${item.employeeName}`, `${item.decisionRationale} ${item.nextStep}`);
      pushArtifact(item, "manager_brief", "Manager", `Manager brief for ${item.employeeName}`, `${item.decisionRationale} Follow-up cadence: ${item.followUpCadence}`);
      pushArtifact(item, "focus_block_plan", "HR Ops", `Focus block plan for ${item.employeeName}`, "Protect deterministic recovery and focus blocks while reducing recurring meeting pressure.");
      return;
    }
    pushArtifact(item, "employee_nudge", "Employee", `Monitor memo for ${item.employeeName}`, "Maintain current operating pattern and reassess at next cycle.");
  });
  return artifacts;
}

function buildFollowUpTasks(queue: InterventionQueueItem[]): FollowUpTask[] {
  return queue.map((item, index) => {
    if (item.route === "Sustained High: HR Ops queue") {
      return {
        id: `follow-up-${index + 1}`,
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        owner: "HR Ops" as const,
        dueIn: "48 hours" as const,
        trigger: "Sustained high route with multi-week overload evidence.",
        task: "Review HR Ops case packet, confirm manager alignment, and validate focus-block execution.",
        status: "queued" as const,
      };
    }
    if (item.route === "High: employee nudge + manager brief") {
      return {
        id: `follow-up-${index + 1}`,
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        owner: "Manager" as const,
        dueIn: "3 working days" as const,
        trigger: "High route requiring manager brief and execution check.",
        task: "Check action artifact adoption and confirm meeting-load reduction progress.",
        status: "queued" as const,
      };
    }
    return {
      id: `follow-up-${index + 1}`,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      owner: "Employee" as const,
      dueIn: "7 days" as const,
      trigger: "Medium route employee nudge checkpoint.",
      task: "Review nudge actions and report next-cycle coordination and focus improvements.",
      status: "queued" as const,
    };
  });
}

function buildRunLedger({
  scenario,
  analystOutput,
  toolInvocations,
  actionArtifacts,
  followUpTasks,
}: {
  scenario: DemoScenario;
  analystOutput: AnalystOutput;
  toolInvocations: ToolInvocation[];
  actionArtifacts: ActionArtifact[];
  followUpTasks: FollowUpTask[];
}): RunLedger {
  return {
    runId: `run-${scenario}-${analystOutput.orgSummary.totalEmployees}-${analystOutput.interventionQueue.length}`,
    scenario,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    employeesAnalyzed: analystOutput.orgSummary.totalEmployees,
    decisionsMade: analystOutput.interventionQueue.length,
    toolsExecuted: toolInvocations.length,
    actionArtifactsCreated: actionArtifacts.length,
    followUpsQueued: followUpTasks.length,
  };
}

/**
 * EXECUTOR AGENT
 *
 * Owns: tool invocations, action artifact generation, follow-up task queuing, run ledger
 * Does NOT: score employees, decide routing, assess org health
 * The only agent that produces external-facing execution artifacts
 */
export function runExecutorAgent(analystOutput: AnalystOutput, scenario: DemoScenario): ExecutorOutput {
  const toolInvocations = buildToolInvocations(analystOutput.interventionQueue);
  const actionArtifacts = buildActionArtifacts(analystOutput.interventionQueue);
  const followUpTasks = buildFollowUpTasks(analystOutput.interventionQueue);
  const runLedger = buildRunLedger({ scenario, analystOutput, toolInvocations, actionArtifacts, followUpTasks });

  // ── Memory: load, update, persist ──
  const prevMemory = loadMemory("executor");
  const now = new Date().toISOString();
  const toolCounts: Record<string, number> = {};
  for (const inv of toolInvocations) {
    toolCounts[inv.tool] = (toolCounts[inv.tool] ?? 0) + 1;
  }
  const updatedMemory = updateExecutorMemory(prevMemory, {
    date: now,
    toolsInvoked: toolInvocations.length,
    artifactsDelivered: actionArtifacts.length,
    followUpsCompleted: 0,
    followUpsMissed: 0,
    deliveryEntries: actionArtifacts.map((a) => ({ date: now, employeeId: a.employeeId, artifactType: a.type, status: "delivered" as const })),
    toolCounts,
    note: `Run ${prevMemory.runCount + 1}: ${toolInvocations.length} tools, ${actionArtifacts.length} artifacts, ${followUpTasks.length} follow-ups`,
  });
  saveMemory("executor", updatedMemory);

  return { identity: EXECUTOR_IDENTITY, memory: updatedMemory, toolInvocations, actionArtifacts, followUpTasks, runLedger };
}
