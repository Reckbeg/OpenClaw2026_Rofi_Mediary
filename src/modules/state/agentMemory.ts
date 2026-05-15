import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  AgentRole,
  AnalystMemory,
  ExecutorMemory,
  SupervisorMemory,
  AgentMemoryMap,
  RiskBucket,
} from "@/src/types/mediary";

const STATE_DIR = join(process.cwd(), ".mediary", "state");
const MEMORY_DIR = join(STATE_DIR, "memory");

function memoryPath(role: AgentRole): string {
  return join(MEMORY_DIR, `${role}-memory.json`);
}

function ensureDir(): void {
  mkdirSync(MEMORY_DIR, { recursive: true });
}

function emptyAnalystMemory(): AnalystMemory {
  return {
    lastRunDate: null,
    runCount: 0,
    employeeRiskHistory: {},
    thresholdAdjustments: [],
    trendPatternsDetected: [],
    scoringConfidence: 1.0,
    notes: [],
  };
}

function emptyExecutorMemory(): ExecutorMemory {
  return {
    lastRunDate: null,
    runCount: 0,
    toolsInvokedTotal: 0,
    artifactsDeliveredTotal: 0,
    followUpsCompleted: 0,
    followUpsMissed: 0,
    deliveryLog: [],
    toolPerformance: {},
    notes: [],
  };
}

function emptySupervisorMemory(): SupervisorMemory {
  return {
    lastRunDate: null,
    runCount: 0,
    anomaliesSeen: [],
    orgHealthTrend: [],
    escalationLog: [],
    agentPerformance: {
      analyst: { runs: 0, avgConfidence: 1.0 },
      executor: { runs: 0, deliveryRate: 1.0 },
    },
    notes: [],
  };
}

const EMPTY_MEMORIES: AgentMemoryMap = {
  analyst: emptyAnalystMemory(),
  executor: emptyExecutorMemory(),
  supervisor: emptySupervisorMemory(),
};

export function loadMemory<T extends AgentRole>(role: T): AgentMemoryMap[T] {
  ensureDir();
  const path = memoryPath(role);
  if (!existsSync(path)) return EMPTY_MEMORIES[role];
  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return EMPTY_MEMORIES[role];
  }
}

export function saveMemory<T extends AgentRole>(role: T, memory: AgentMemoryMap[T]): void {
  ensureDir();
  writeFileSync(memoryPath(role), JSON.stringify(memory, null, 2));
}

export function updateAnalystMemory(
  prev: AnalystMemory,
  updates: {
    date: string;
    employeeScores: Array<{ employeeId: string; score: number; bucket: RiskBucket }>;
    newPatterns?: AnalystMemory["trendPatternsDetected"];
    note?: string;
  },
): AnalystMemory {
  const history = { ...prev.employeeRiskHistory };
  for (const emp of updates.employeeScores) {
    const existing = history[emp.employeeId] ?? [];
    existing.push({ date: updates.date, score: emp.score, bucket: emp.bucket });
    history[emp.employeeId] = existing.slice(-12); // keep last 12 runs
  }

  const patterns = [
    ...prev.trendPatternsDetected.map((p) =>
      updates.employeeScores.some((e) => e.employeeId === p.employeeId && e.bucket !== "High")
        ? { ...p, stillActive: false }
        : p,
    ),
    ...(updates.newPatterns ?? []),
  ];

  return {
    lastRunDate: updates.date,
    runCount: prev.runCount + 1,
    employeeRiskHistory: history,
    thresholdAdjustments: prev.thresholdAdjustments,
    trendPatternsDetected: patterns.slice(-50),
    scoringConfidence: prev.scoringConfidence,
    notes: updates.note ? [...prev.notes, `[${updates.date}] ${updates.note}`].slice(-20) : prev.notes,
  };
}

export function updateExecutorMemory(
  prev: ExecutorMemory,
  updates: {
    date: string;
    toolsInvoked: number;
    artifactsDelivered: number;
    followUpsCompleted: number;
    followUpsMissed: number;
    deliveryEntries: ExecutorMemory["deliveryLog"];
    toolCounts: Record<string, number>;
    note?: string;
  },
): ExecutorMemory {
  const toolPerformance = { ...prev.toolPerformance };
  for (const [tool, count] of Object.entries(updates.toolCounts)) {
    const existing = toolPerformance[tool] ?? { invoked: 0, successRate: 1.0 };
    toolPerformance[tool] = {
      invoked: existing.invoked + count,
      successRate: existing.successRate,
    };
  }

  return {
    lastRunDate: updates.date,
    runCount: prev.runCount + 1,
    toolsInvokedTotal: prev.toolsInvokedTotal + updates.toolsInvoked,
    artifactsDeliveredTotal: prev.artifactsDeliveredTotal + updates.artifactsDelivered,
    followUpsCompleted: prev.followUpsCompleted + updates.followUpsCompleted,
    followUpsMissed: prev.followUpsMissed + updates.followUpsMissed,
    deliveryLog: [...prev.deliveryLog, ...updates.deliveryEntries].slice(-100),
    toolPerformance,
    notes: updates.note ? [...prev.notes, `[${updates.date}] ${updates.note}`].slice(-20) : prev.notes,
  };
}

export function updateSupervisorMemory(
  prev: SupervisorMemory,
  updates: {
    date: string;
    newAnomalies: SupervisorMemory["anomaliesSeen"];
    healthScore: number;
    healthStatus: string;
    escalations: SupervisorMemory["escalationLog"];
    analystConfidence: number;
    executorDeliveryRate: number;
    note?: string;
  },
): SupervisorMemory {
  return {
    lastRunDate: updates.date,
    runCount: prev.runCount + 1,
    anomaliesSeen: [...prev.anomaliesSeen, ...updates.newAnomalies].slice(-100),
    orgHealthTrend: [...prev.orgHealthTrend, { date: updates.date, score: updates.healthScore, status: updates.healthStatus }].slice(-52),
    escalationLog: [...prev.escalationLog, ...updates.escalations].slice(-50),
    agentPerformance: {
      analyst: {
        runs: prev.agentPerformance.analyst.runs + 1,
        avgConfidence: (prev.agentPerformance.analyst.avgConfidence * prev.agentPerformance.analyst.runs + updates.analystConfidence) / (prev.agentPerformance.analyst.runs + 1),
      },
      executor: {
        runs: prev.agentPerformance.executor.runs + 1,
        deliveryRate: (prev.agentPerformance.executor.deliveryRate * prev.agentPerformance.executor.runs + updates.executorDeliveryRate) / (prev.agentPerformance.executor.runs + 1),
      },
    },
    notes: updates.note ? [...prev.notes, `[${updates.date}] ${updates.note}`].slice(-20) : prev.notes,
  };
}
