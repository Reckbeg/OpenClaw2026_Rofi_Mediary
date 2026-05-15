import { runAnalystAgent } from "@/src/agents/analystAgent";
import { runExecutorAgent } from "@/src/agents/executorAgent";
import { runSupervisorAgent } from "@/src/agents/supervisorAgent";
import { defaultEmployeeId } from "@/src/data/sampleOrg";
import { defaultSelfAssessmentAnswers } from "@/src/modules/scoring/selfAssessment";
import type { AgentStreamEvent, DemoScenario, MediaryLoopOutput } from "@/src/types/mediary";

export const runtime = "nodejs";

const encoder = new TextEncoder();
const EVENT_PACE_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function toSseEvent(event: AgentStreamEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function parseScenario(value: string | null): DemoScenario | null {
  if (value === "baseline" || value === "sustained-high") return value;
  return null;
}

export async function GET(request: Request) {
  const scenario = parseScenario(new URL(request.url).searchParams.get("scenario") ?? "baseline");

  if (!scenario) {
    return new Response(
      JSON.stringify({ error: "Invalid scenario. Use ?scenario=baseline or ?scenario=sustained-high." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const writeEvent = async (event: AgentStreamEvent, withPacing = true) => {
        controller.enqueue(toSseEvent(event));
        if (withPacing) {
          await sleep(EVENT_PACE_MS);
        }
      };

      void (async () => {
        try {
          await writeEvent({
            type: "run.started",
            title: "Run started",
            detail: `Starting Mediary ${scenario} cycle with deterministic internal execution adapters.`,
          });

          await writeEvent({
            type: "analyst.started",
            agent: "Aria Analyst",
            title: "Aria Analyst started",
            detail: "Reasoning over workload strain signals and route policy thresholds.",
          });

          const analyst = runAnalystAgent({
            employeeId: defaultEmployeeId,
            scenario,
            selfAssessmentAnswers: defaultSelfAssessmentAnswers,
          });

          await writeEvent({
            type: "analyst.completed",
            agent: "Aria Analyst",
            title: "Aria Analyst completed",
            detail: `Org summary ${analyst.orgSummary.lowRiskCount} low, ${analyst.orgSummary.mediumRiskCount} medium, ${analyst.orgSummary.highRiskCount} high. ${analyst.interventionQueue.length} interventions queued.`,
            payload: {
              orgSummary: analyst.orgSummary,
              monthlyTrendOrgSummary: analyst.monthlyTrendOrgSummary,
              interventionQueueCount: analyst.interventionQueue.length,
            },
          });

          await writeEvent({
            type: "executor.started",
            agent: "Ethan Executor",
            title: "Ethan Executor started",
            detail: "Invoking internal execution adapters and producing action artifacts.",
          });

          const executor = runExecutorAgent(analyst, scenario);

          for (const toolInvocation of executor.toolInvocations.slice(0, 8)) {
            await writeEvent({
              type: "executor.tool_invoked",
              agent: "Ethan Executor",
              title: `${toolInvocation.tool} invoked`,
              detail: `${toolInvocation.targetEmployeeName}: ${toolInvocation.summary}`,
              payload: toolInvocation,
            });
          }

          for (const artifact of executor.actionArtifacts.slice(0, 6)) {
            await writeEvent({
              type: "executor.artifact_created",
              agent: "Ethan Executor",
              title: `${artifact.type} created`,
              detail: `${artifact.employeeName}: ${artifact.title}`,
              payload: artifact,
            });
          }

          for (const followUpTask of executor.followUpTasks.slice(0, 6)) {
            await writeEvent({
              type: "executor.followup_queued",
              agent: "Ethan Executor",
              title: "Follow-up queued",
              detail: `${followUpTask.employeeName}: ${followUpTask.owner} owner due in ${followUpTask.dueIn}.`,
              payload: followUpTask,
            });
          }

          await writeEvent({
            type: "executor.completed",
            agent: "Ethan Executor",
            title: "Ethan Executor completed",
            detail: `${executor.toolInvocations.length} tools, ${executor.actionArtifacts.length} action artifacts, ${executor.followUpTasks.length} follow-up queue entries.`,
            payload: {
              toolInvocations: executor.toolInvocations.length,
              actionArtifacts: executor.actionArtifacts.length,
              followUpTasks: executor.followUpTasks.length,
              runLedger: executor.runLedger,
            },
          });

          await writeEvent({
            type: "supervisor.started",
            agent: "Sol Supervisor",
            title: "Sol Supervisor started",
            detail: "Validating execution consistency and org health signals.",
          });

          const supervisor = runSupervisorAgent(analyst, executor, scenario);

          await writeEvent({
            type: "supervisor.completed",
            agent: "Sol Supervisor",
            title: "Sol Supervisor completed",
            detail: `Org health ${supervisor.orgHealth.status} (${supervisor.orgHealth.score}/100) with ${supervisor.orgHealth.anomalies.length} anomalies.`,
            payload: supervisor.orgHealth,
          });

          const selectedEmployeeDetail =
            analyst.employeeDetails.find((detail) => detail.employee.id === defaultEmployeeId) ??
            analyst.employeeDetails[0];

          const finalOutput: MediaryLoopOutput = {
            scenario,
            orgSummary: analyst.orgSummary,
            monthlyTrendOrgSummary: analyst.monthlyTrendOrgSummary,
            monthlyTrendByEmployee: analyst.monthlyTrendByEmployee,
            teamHeatmap: analyst.teamHeatmap,
            interventionQueue: analyst.interventionQueue,
            hrMemo: analyst.hrMemo,
            impactSimulation: analyst.impactSimulation,
            selectedEmployeeDetail,
            toolInvocations: executor.toolInvocations,
            actionArtifacts: executor.actionArtifacts,
            followUpTasks: executor.followUpTasks,
            runLedger: executor.runLedger,
            orgHealth: supervisor.orgHealth,
            executionTrace: supervisor.executionTrace,
            workflowStatus: "Autonomous org-wide workload diplomacy loop completed",
          };

          await writeEvent(
            {
              type: "run.completed",
              title: "Operator dispatch ready",
              detail: "Mediary completed Analyst → Executor → Supervisor cycle. Final output is ready.",
              payload: finalOutput,
            },
            false,
          );

          controller.close();
        } catch (error) {
          const detail =
            error instanceof Error ? error.message : "Unknown stream failure during agent cycle execution.";
          await writeEvent(
            {
              type: "run.failed",
              title: "Run failed",
              detail,
            },
            false,
          );
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
