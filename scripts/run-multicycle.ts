import { runMediaryLoop } from "@/src/agents/runMediaryLoop";
import { sampleOrgDataset } from "@/src/data/sampleOrg";
import { saveRun } from "@/src/modules/state/ledgerStore";
import { consumeFollowUpTasks } from "@/src/modules/state/followUpConsumer";
import type { CalendarEvent, DemoScenario, MediaryLoopOutput } from "@/src/types/mediary";

// ── CLI argument parsing ──

function parseArgs(): { cycles: number; scenario: DemoScenario } {
  const cyclesArg = process.argv.find((a) => a.startsWith("--cycles="));
  const scenarioArg = process.argv.find((a) => a.startsWith("--scenario="));

  const cycles = cyclesArg ? Math.max(1, parseInt(cyclesArg.split("=")[1], 10)) : 8;
  const scenario: DemoScenario = scenarioArg?.split("=")[1] === "baseline" ? "baseline" : "sustained-high";

  return { cycles, scenario };
}

// ── Drift mechanism: mutate calendar data between cycles ──

function applyOrgDrift(cycle: number): void {
  const employees = sampleOrgDataset.employees;

  for (const employee of employees) {
    const events = sampleOrgDataset.calendarsByEmployee[employee.id];
    if (!events) continue;

    // Seeded pseudo-random based on cycle and employee id length
    const seed = (cycle * 7 + employee.id.length * 13) % 100;

    // 30% chance to add a meeting, 20% chance to remove one
    if (seed < 30 && events.length < 20) {
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
      const day = weekdays[cycle % 5];
      const startHour = 9 + (seed % 8);
      const newEvent: CalendarEvent = {
        id: `drift-${cycle}-${employee.id}-${events.length}`,
        title: cycle % 3 === 0 ? "Ad-hoc sync" : cycle % 3 === 1 ? "Cross-team check-in" : "Status update",
        day,
        start: `${startHour.toString().padStart(2, "0")}:00`,
        end: `${startHour.toString().padStart(2, "0")}:30`,
        owner: employee.name,
        attendees: [employee.team],
        isRecurring: false,
      };
      events.push(newEvent);
    } else if (seed >= 80 && events.length > 3) {
      // Remove a non-recurring event if available
      const nonRecurring = events.findIndex((e) => !e.isRecurring);
      if (nonRecurring >= 0) {
        events.splice(nonRecurring, 1);
      }
    }
  }

  // Also drift the weekly history for baseline employees
  for (const employee of employees) {
    const history = sampleOrgDataset.weeklyHistoryByEmployee[employee.id];
    if (!history || history.length === 0) continue;

    const seed = (cycle * 11 + employee.id.length * 7) % 100;
    const drift = seed < 50 ? Math.min(cycle, 3) : -Math.min(cycle, 2);

    for (const week of history) {
      week.riskScore = Math.max(0, Math.min(100, week.riskScore + drift));
      week.riskBucket = week.riskScore >= 80 ? "High" : week.riskScore >= 40 ? "Medium" : "Low";
    }
  }
}

// ── Summary types ──

type CycleRecord = {
  cycle: number;
  date: string;
  orgHealth: string;
  orgHealthScore: number;
  avgRiskScore: number;
  highRiskCount: number;
  sustainedHighCount: number;
  interventions: number;
  followUpsQueued: number;
  followUpConsumed: number;
  alexRoute: string;
  alexRisk: number;
  oliviaRoute: string;
  oliviaRisk: number;
};

// ── Main ──

const { cycles, scenario } = parseArgs();

console.error(`\n${"═".repeat(60)}`);
console.error(`  MEDIARY MULTI-CYCLE DEMO`);
console.error(`  Cycles: ${cycles} | Scenario: ${scenario}`);
console.error(`  Started: ${new Date().toISOString()}`);
console.error(`${"═".repeat(60)}\n`);

const records: CycleRecord[] = [];

for (let i = 1; i <= cycles; i++) {
  console.error(`\n${"─".repeat(50)}`);
  console.error(`  CYCLE ${i} / ${cycles}`);
  console.error(`${"─".repeat(50)}`);

  // Apply drift before cycles 2+ (first cycle is baseline)
  if (i > 1) {
    console.error(`  ▸ Applying org data drift (cycle ${i})...`);
    applyOrgDrift(i);
  }

  // Run the agent loop
  console.error(`  ▸ Running agent loop...`);
  const output: MediaryLoopOutput = runMediaryLoop({ scenario });

  // Persist ledger
  console.error(`  ▸ Persisting ledger...`);
  const savedPath = saveRun(output);
  console.error(`    ✓ ${savedPath}`);

  // Process follow-ups from previous cycle
  let consumedCount = 0;
  if (i > 1) {
    console.error(`  ▸ Processing follow-up tasks from previous cycle...`);
    const followUp = consumeFollowUpTasks(output);
    consumedCount = followUp.consumed.length;
    console.error(`    ✓ ${followUp.summary}`);
    if (followUp.overdueCount > 0) {
      for (const task of followUp.consumed.filter((t) => t.computedStatus === "overdue")) {
        console.error(`    ⚠ ESCALATE: ${task.employeeName} — ${task.reason}`);
      }
    }
  }

  // Extract key metrics
  const alex = output.interventionQueue.find((q) => q.employeeId === "alex-johnson");
  const olivia = output.interventionQueue.find((q) => q.employeeId === "olivia-clark");

  const record: CycleRecord = {
    cycle: i,
    date: output.runLedger.startedAt.split("T")[0],
    orgHealth: output.orgHealth.status,
    orgHealthScore: output.orgHealth.score,
    avgRiskScore: output.orgSummary.avgRiskScore,
    highRiskCount: output.orgSummary.highRiskCount,
    sustainedHighCount: output.orgSummary.sustainedHighCount,
    interventions: output.interventionQueue.length,
    followUpsQueued: output.followUpTasks.length,
    followUpConsumed: consumedCount,
    alexRoute: alex?.route ?? "Low: no action or monitor",
    alexRisk: alex?.riskScore ?? 0,
    oliviaRoute: olivia?.route ?? "Low: no action or monitor",
    oliviaRisk: olivia?.riskScore ?? 0,
  };
  records.push(record);

  console.error(`  ✓ Org health: ${record.orgHealth} (${record.orgHealthScore}/100)`);
  console.error(`  ✓ High-risk: ${record.highRiskCount} | Sustained-high: ${record.sustainedHighCount}`);
  console.error(`  ✓ Interventions: ${record.interventions} | Follow-ups queued: ${record.followUpsQueued}`);
}

// ── Summary output ──

console.error(`\n${"═".repeat(60)}`);
console.error(`  MULTI-CYCLE SUMMARY — ${cycles} cycles`);
console.error(`${"═".repeat(60)}\n`);

// Build text table
const header = [
  "Cycle",
  "Date",
  "Health",
  "Score",
  "AvgRisk",
  "High",
  "SustHigh",
  "Interv",
  "FollowUps",
  "Consumed",
];
const rows = records.map((r) => [
  String(r.cycle),
  r.date,
  r.orgHealth,
  String(r.orgHealthScore),
  String(r.avgRiskScore),
  String(r.highRiskCount),
  String(r.sustainedHighCount),
  String(r.interventions),
  String(r.followUpsQueued),
  String(r.followUpConsumed),
]);

// Column widths
const colWidths = header.map((h, i) =>
  Math.max(h.length, ...rows.map((r) => r[i].length)),
);

function padRow(cells: string[]): string {
  return cells.map((c, i) => c.padEnd(colWidths[i])).join(" | ");
}

console.error(padRow(header));
console.error(colWidths.map((w) => "─".repeat(w)).join("─┼─"));
for (const row of rows) {
  console.error(padRow(row));
}

// Alex & Olivia trajectory
console.error(`\n${"─".repeat(60)}`);
console.error(`  TRAJECTORY: Alex Johnson`);
console.error(`${"─".repeat(60)}`);
for (const r of records) {
  const bar = "█".repeat(Math.round(r.alexRisk / 5));
  console.error(`  Cycle ${String(r.cycle).padStart(2)}: ${String(r.alexRisk).padStart(3)} ${bar} ${r.alexRoute}`);
}

console.error(`\n${"─".repeat(60)}`);
console.error(`  TRAJECTORY: Olivia Clark`);
console.error(`${"─".repeat(60)}`);
for (const r of records) {
  const bar = "█".repeat(Math.round(r.oliviaRisk / 5));
  console.error(`  Cycle ${String(r.cycle).padStart(2)}: ${String(r.oliviaRisk).padStart(3)} ${bar} ${r.oliviaRoute}`);
}

// Follow-up consumption demo
console.error(`\n${"─".repeat(60)}`);
console.error(`  FOLLOW-UP CONSUMPTION`);
console.error(`${"─".repeat(60)}`);
const totalQueued = records.reduce((sum, r) => sum + r.followUpsQueued, 0);
const totalConsumed = records.reduce((sum, r) => sum + r.followUpConsumed, 0);
console.error(`  Total follow-ups queued across all cycles: ${totalQueued}`);
console.error(`  Total follow-ups consumed from prior cycles: ${totalConsumed}`);
console.error(`  Cycles with follow-up processing: ${records.filter((r) => r.followUpConsumed > 0).length}/${cycles}`);
if (totalConsumed > 0) {
  console.error(`  ✓ Follow-up tasks from earlier cycles ARE consumed in later cycles.`);
} else {
  console.error(`  ℹ No follow-up consumption detected (first run — no prior ledgers).`);
}

console.error(`\n${"═".repeat(60)}`);
console.error(`  DEMO COMPLETE — ${new Date().toISOString()}`);
console.error(`${"═".repeat(60)}\n`);

// JSON output for machine consumption
const summary = {
  config: { cycles, scenario },
  records,
  trajectory: {
    alexJohnson: records.map((r) => ({ cycle: r.cycle, risk: r.alexRisk, route: r.alexRoute })),
    oliviaClark: records.map((r) => ({ cycle: r.cycle, risk: r.oliviaRisk, route: r.oliviaRoute })),
  },
  followUpDemo: {
    totalQueued,
    totalConsumed,
    cyclesWithProcessing: records.filter((r) => r.followUpConsumed > 0).length,
  },
};

console.log(JSON.stringify(summary, null, 2));
