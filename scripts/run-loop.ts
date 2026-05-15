import { runMediaryLoop } from "@/src/agents/runMediaryLoop";
import { saveRun } from "@/src/modules/state/ledgerStore";
import { compareWeeks } from "@/src/modules/state/weekComparison";
import { consumeFollowUpTasks } from "@/src/modules/state/followUpConsumer";
import type { DemoScenario } from "@/src/types/mediary";

const scenario = (process.argv.find((a) => a.startsWith("--scenario="))?.split("=")[1] ?? "sustained-high") as DemoScenario;

console.error(`\n${"═".repeat(60)}`);
console.error(`  MEDIARY AUTONOMOUS LOOP — ${new Date().toISOString()}`);
console.error(`  Scenario: ${scenario}`);
console.error(`${"═".repeat(60)}\n`);

// ── Phase 1: Run the agent ──
console.error("▸ Phase 1: Running agent loop...");
const output = runMediaryLoop({ scenario });
console.error(`  ✓ ${output.orgSummary.totalEmployees} employees analyzed`);
console.error(`  ✓ ${output.interventionQueue.length} interventions routed`);
console.error(`  ✓ ${output.toolInvocations.length} tools executed`);
console.error(`  ✓ ${output.actionArtifacts.length} artifacts created`);

// ── Phase 2: Save run to ledger ──
console.error("\n▸ Phase 2: Persisting run ledger...");
const savedPath = saveRun(output);
console.error(`  ✓ Saved to ${savedPath}`);

// ── Phase 3: Compare with previous run ──
console.error("\n▸ Phase 3: Week-over-week comparison...");
const comparison = compareWeeks(output);
console.error(`  ✓ ${comparison.summary}`);
if (comparison.alerts.length > 0) {
  for (const alert of comparison.alerts) {
    console.error(`  ⚠ ${alert}`);
  }
}

// ── Phase 4: Consume follow-up tasks ──
console.error("\n▸ Phase 4: Processing follow-up tasks...");
const followUp = consumeFollowUpTasks(output);
console.error(`  ✓ ${followUp.summary}`);
if (followUp.overdueCount > 0) {
  const overdue = followUp.consumed.filter((t) => t.computedStatus === "overdue");
  for (const task of overdue) {
    console.error(`  ⚠ ESCALATE: ${task.employeeName} — ${task.reason}`);
  }
}

// ── Phase 5: Build loop report ──
console.error("\n▸ Phase 5: Loop report complete.");
const loopReport = {
  loopTimestamp: new Date().toISOString(),
  scenario,
  agentOutput: {
    orgSummary: output.orgSummary,
    runLedger: output.runLedger,
    hrMemo: output.hrMemo,
    orgHealth: output.orgHealth,
    workflowStatus: output.workflowStatus,
  },
  weekComparison: {
    hasPreviousRun: comparison.hasPreviousRun,
    summary: comparison.summary,
    alerts: comparison.alerts,
    orgDelta: comparison.orgDelta,
    employeeDeltas: comparison.employeeDeltas.filter((d) => d.signal !== "stable"),
  },
  followUpProcessing: {
    summary: followUp.summary,
    overdueCount: followUp.overdueCount,
    readyCount: followUp.readyCount,
    resolvedCount: followUp.resolvedCount,
    escalated: followUp.consumed.filter((t) => t.action === "escalate"),
    ready: followUp.consumed.filter((t) => t.action === "process_now"),
  },
  executionTrace: output.executionTrace,
  toolInvocations: output.toolInvocations,
  actionArtifacts: output.actionArtifacts,
  followUpTasks: output.followUpTasks,
};

// Print JSON to stdout for machine consumption
console.log(JSON.stringify(loopReport, null, 2));

console.error(`\n${"═".repeat(60)}`);
console.error(`  LOOP COMPLETE — ${loopReport.loopTimestamp}`);
console.error(`${"═".repeat(60)}\n`);
