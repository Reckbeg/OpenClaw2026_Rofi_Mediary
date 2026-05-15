import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { RunLedger, MediaryLoopOutput } from "@/src/types/mediary";

const STATE_DIR = join(process.cwd(), ".mediary", "state");
const LEDGER_DIR = join(STATE_DIR, "ledgers");

function ensureDirs(): void {
  mkdirSync(LEDGER_DIR, { recursive: true });
}

export function saveRun(output: MediaryLoopOutput): string {
  ensureDirs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `run-${output.scenario}-${timestamp}.json`;
  const filepath = join(LEDGER_DIR, filename);

  const record = {
    savedAt: new Date().toISOString(),
    runLedger: output.runLedger,
    orgSummary: output.orgSummary,
    monthlyTrendOrgSummary: output.monthlyTrendOrgSummary,
    interventionQueue: output.interventionQueue.map((item) => ({
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      team: item.team,
      riskScore: item.riskScore,
      riskBucket: item.riskBucket,
      route: item.route,
      previousWeekRiskScore: item.previousWeekRiskScore,
    })),
    followUpTasks: output.followUpTasks,
    teamHeatmap: output.teamHeatmap,
  };

  writeFileSync(filepath, JSON.stringify(record, null, 2));
  return filepath;
}

export function loadLatestRun(scenario?: string): {
  savedAt: string;
  runLedger: RunLedger;
  orgSummary: MediaryLoopOutput["orgSummary"];
  monthlyTrendOrgSummary: MediaryLoopOutput["monthlyTrendOrgSummary"];
  interventionQueue: Array<{
    employeeId: string;
    employeeName: string;
    team: string;
    riskScore: number;
    riskBucket: string;
    route: string;
    previousWeekRiskScore?: number;
  }>;
  followUpTasks: MediaryLoopOutput["followUpTasks"];
  teamHeatmap: MediaryLoopOutput["teamHeatmap"];
} | null {
  ensureDirs();
  const files = readdirSync(LEDGER_DIR)
    .filter((f) => f.endsWith(".json"))
    .filter((f) => !scenario || f.includes(scenario))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  const latest = files[0];
  const content = readFileSync(join(LEDGER_DIR, latest), "utf-8");
  return JSON.parse(content);
}

export function loadRunHistory(limit = 4): Array<{
  savedAt: string;
  runLedger: RunLedger;
  orgSummary: MediaryLoopOutput["orgSummary"];
}> {
  ensureDirs();
  const files = readdirSync(LEDGER_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse()
    .slice(0, limit);

  return files.map((f) => {
    const content = readFileSync(join(LEDGER_DIR, f), "utf-8");
    const data = JSON.parse(content);
    return {
      savedAt: data.savedAt,
      runLedger: data.runLedger,
      orgSummary: data.orgSummary,
    };
  });
}
