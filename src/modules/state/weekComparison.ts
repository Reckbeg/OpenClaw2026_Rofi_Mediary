import type { MediaryLoopOutput, OrgSummary } from "@/src/types/mediary";
import { loadLatestRun } from "./ledgerStore";

export type EmployeeDelta = {
  employeeId: string;
  employeeName: string;
  team: string;
  previousRiskScore: number;
  currentRiskScore: number;
  delta: number;
  previousRoute: string;
  currentRoute: string;
  routeChanged: boolean;
  signal: "improving" | "stable" | "worsening" | "new_high" | "resolved";
};

export type WeekComparison = {
  hasPreviousRun: boolean;
  previousRunDate: string | null;
  orgDelta: {
    avgRiskScore: number;
    highRiskCount: number;
    sustainedHighCount: number;
    interventionQueueCount: number;
  };
  employeeDeltas: EmployeeDelta[];
  alerts: string[];
  summary: string;
};

export function compareWeeks(current: MediaryLoopOutput): WeekComparison {
  const previous = loadLatestRun(current.scenario);

  if (!previous) {
    return {
      hasPreviousRun: false,
      previousRunDate: null,
      orgDelta: { avgRiskScore: 0, highRiskCount: 0, sustainedHighCount: 0, interventionQueueCount: 0 },
      employeeDeltas: [],
      alerts: [],
      summary: "First run — no previous data to compare. Establishing baseline.",
    };
  }

  const prevQueue = previous.interventionQueue;
  const currQueue = current.interventionQueue;

  const employeeDeltas: EmployeeDelta[] = current.orgSummary.totalEmployees > 0
    ? current.teamHeatmap.flatMap((team) =>
        team.employeeCount > 0
          ? []
          : []
      )
    : [];

  // Build employee-level deltas from intervention queues
  const allEmployeeIds = new Set([
    ...prevQueue.map((e) => e.employeeId),
    ...currQueue.map((e) => e.employeeId),
  ]);

  const deltas: EmployeeDelta[] = [];

  for (const id of allEmployeeIds) {
    const prev = prevQueue.find((e) => e.employeeId === id);
    const curr = currQueue.find((e) => e.employeeId === id);

    if (curr && prev) {
      const delta = curr.riskScore - prev.riskScore;
      deltas.push({
        employeeId: id,
        employeeName: curr.employeeName,
        team: curr.team,
        previousRiskScore: prev.riskScore,
        currentRiskScore: curr.riskScore,
        delta,
        previousRoute: prev.route,
        currentRoute: curr.route,
        routeChanged: prev.route !== curr.route,
        signal: delta >= 6 ? "worsening" : delta <= -6 ? "improving" : "stable",
      });
    } else if (curr && !prev) {
      deltas.push({
        employeeId: id,
        employeeName: curr.employeeName,
        team: curr.team,
        previousRiskScore: 0,
        currentRiskScore: curr.riskScore,
        delta: curr.riskScore,
        previousRoute: "none",
        currentRoute: curr.route,
        routeChanged: true,
        signal: curr.riskScore >= 80 ? "new_high" : "stable",
      });
    } else if (prev && !curr) {
      deltas.push({
        employeeId: id,
        employeeName: prev.employeeName,
        team: prev.team,
        previousRiskScore: prev.riskScore,
        currentRiskScore: 0,
        delta: -prev.riskScore,
        previousRoute: prev.route,
        currentRoute: "Low: no action or monitor",
        routeChanged: true,
        signal: "resolved",
      });
    }
  }

  // Generate alerts
  const alerts: string[] = [];

  const newHighs = deltas.filter((d) => d.signal === "new_high");
  if (newHighs.length > 0) {
    alerts.push(`${newHighs.length} employee(s) newly entered high-risk: ${newHighs.map((d) => d.employeeName).join(", ")}`);
  }

  const worsened = deltas.filter((d) => d.signal === "worsening");
  if (worsened.length > 0) {
    alerts.push(`${worsened.length} employee(s) worsened by 6+ points: ${worsened.map((d) => `${d.employeeName} (${d.delta > 0 ? "+" : ""}${d.delta})`).join(", ")}`);
  }

  const routeEscalations = deltas.filter((d) => d.routeChanged && d.currentRiskScore > d.previousRiskScore);
  if (routeEscalations.length > 0) {
    alerts.push(`${routeEscalations.length} route escalation(s) detected.`);
  }

  const orgDelta = {
    avgRiskScore: current.orgSummary.avgRiskScore - previous.orgSummary.avgRiskScore,
    highRiskCount: current.orgSummary.highRiskCount - previous.orgSummary.highRiskCount,
    sustainedHighCount: current.orgSummary.sustainedHighCount - previous.orgSummary.sustainedHighCount,
    interventionQueueCount: currQueue.length - prevQueue.length,
  };

  const summaryParts: string[] = [];
  summaryParts.push(`Compared to ${previous.savedAt.split("T")[0]}.`);
  if (orgDelta.avgRiskScore > 0) summaryParts.push(`Org avg risk +${orgDelta.avgRiskScore}.`);
  if (orgDelta.avgRiskScore < 0) summaryParts.push(`Org avg risk ${orgDelta.avgRiskScore}.`);
  if (orgDelta.highRiskCount > 0) summaryParts.push(`High-risk count +${orgDelta.highRiskCount}.`);
  if (orgDelta.highRiskCount < 0) summaryParts.push(`High-risk count ${orgDelta.highRiskCount}.`);
  if (alerts.length > 0) summaryParts.push(`${alerts.length} alert(s).`);
  if (alerts.length === 0) summaryParts.push("No alerts.");

  return {
    hasPreviousRun: true,
    previousRunDate: previous.savedAt,
    orgDelta,
    employeeDeltas: deltas.sort((a, b) => b.delta - a.delta),
    alerts,
    summary: summaryParts.join(" "),
  };
}
