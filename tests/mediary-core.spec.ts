import { describe, expect, it } from "vitest";
import { runMediaryLoop } from "../src/agents/runMediaryLoop";
import { getRiskBucket } from "../src/modules/scoring/riskScore";

describe("Mediary core agent behavior", () => {
  it("baseline scenario completes with zero sustained-high routes", () => {
    const output = runMediaryLoop({ scenario: "baseline" });

    expect(output.workflowStatus).toBe("Autonomous org-wide workload diplomacy loop completed");
    expect(output.orgSummary.sustainedHighCount).toBe(0);
    expect(output.interventionQueue.some((item) => item.route === "Sustained High: HR Ops queue")).toBe(false);
  });

  it("sustained-high scenario routes Alex Johnson and Olivia Clark to HR Ops", () => {
    const output = runMediaryLoop({ scenario: "sustained-high" });
    const hrOpsIds = output.interventionQueue
      .filter((item) => item.route === "Sustained High: HR Ops queue")
      .map((item) => item.employeeId);

    expect(hrOpsIds).toContain("alex-johnson");
    expect(hrOpsIds).toContain("olivia-clark");
  });

  it("sustained-high scenario creates HR_OPS_CASE_TOOL invocations", () => {
    const output = runMediaryLoop({ scenario: "sustained-high" });
    const hrOpsInvocations = output.toolInvocations.filter(
      (item) => item.tool === "HR_OPS_CASE_TOOL",
    );

    expect(hrOpsInvocations.length).toBeGreaterThanOrEqual(2);
    expect(hrOpsInvocations.some((item) => item.targetEmployeeId === "alex-johnson")).toBe(true);
    expect(hrOpsInvocations.some((item) => item.targetEmployeeId === "olivia-clark")).toBe(true);
  });

  it("sustained-high scenario queues 48-hour HR Ops follow-up tasks", () => {
    const output = runMediaryLoop({ scenario: "sustained-high" });
    const hrOpsTasks = output.followUpTasks.filter(
      (task) => task.owner === "HR Ops" && task.dueIn === "48 hours",
    );

    expect(hrOpsTasks.length).toBeGreaterThanOrEqual(2);
    expect(hrOpsTasks.some((task) => task.employeeId === "alex-johnson")).toBe(true);
    expect(hrOpsTasks.some((task) => task.employeeId === "olivia-clark")).toBe(true);
  });

  it("risk bucket thresholds map 39/40/80 correctly", () => {
    expect(getRiskBucket(39)).toBe("Low");
    expect(getRiskBucket(40)).toBe("Medium");
    expect(getRiskBucket(80)).toBe("High");
  });
});
