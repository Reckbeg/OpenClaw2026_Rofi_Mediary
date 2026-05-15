import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const STATE_DIR = join(process.cwd(), ".mediary", "state");
const LEDGER_DIR = join(STATE_DIR, "ledgers");
const ACK_DIR = join(STATE_DIR, "acknowledgments");

function ensureDirs(): void {
  mkdirSync(LEDGER_DIR, { recursive: true });
  mkdirSync(ACK_DIR, { recursive: true });
}

type FollowUpTask = {
  id: string;
  employeeId: string;
  employeeName: string;
  owner: string;
  dueIn: string;
  trigger: string;
  task: string;
  status: string;
};

type Acknowledgment = {
  followUpId: string;
  employeeId: string;
  employeeName: string;
  owner: string;
  task: string;
  trigger: string;
  outcome: string;
  acknowledgedAt: string;
  previousStatus: string;
  newStatus: "acknowledged";
};

function parseArgs(): { taskId: string; outcome: string } {
  const args = process.argv.slice(2);
  const taskId = args.find((a) => !a.startsWith("--"));
  if (!taskId) {
    console.error("Usage: npx tsx scripts/run-ack.ts <follow-up-id> --outcome='description of outcome'");
    console.error("Example: npx tsx scripts/run-ack.ts follow-up-3 --outcome='reduced meetings by 3h'");
    process.exit(1);
  }

  const outcomeArg = args.find((a) => a.startsWith("--outcome="));
  const outcome = outcomeArg?.split("=").slice(1).join("=") ?? "";
  if (!outcome) {
    console.error("Error: --outcome='...' is required.");
    console.error("Example: npx tsx scripts/run-ack.ts follow-up-3 --outcome='reduced meetings by 3h'");
    process.exit(1);
  }

  // Strip surrounding quotes if present
  const cleanOutcome = outcome.replace(/^['"]|['"]$/g, "");
  return { taskId, outcome: cleanOutcome };
}

function findFollowUpInLedgers(taskId: string): { task: FollowUpTask; ledgerFile: string } | null {
  ensureDirs();
  const files = readdirSync(LEDGER_DIR).filter((f) => f.endsWith(".json")).sort().reverse();

  for (const file of files) {
    const content = readFileSync(join(LEDGER_DIR, file), "utf-8");
    const data = JSON.parse(content);
    const tasks: FollowUpTask[] = data.followUpTasks ?? [];
    const match = tasks.find((t) => t.id === taskId);
    if (match) {
      return { task: match, ledgerFile: file };
    }
  }

  return null;
}

function updateFollowUpStatusInLedger(ledgerFile: string, taskId: string, newStatus: string): void {
  const filepath = join(LEDGER_DIR, ledgerFile);
  const content = readFileSync(filepath, "utf-8");
  const data = JSON.parse(content);

  const tasks: FollowUpTask[] = data.followUpTasks ?? [];
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = newStatus;
  }

  writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function writeAcknowledgment(ack: Acknowledgment): string {
  ensureDirs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `ack-${ack.followUpId}-${timestamp}.json`;
  const filepath = join(ACK_DIR, filename);
  writeFileSync(filepath, JSON.stringify(ack, null, 2));
  return filepath;
}

// ── Main ──

const { taskId, outcome } = parseArgs();

console.error(`\n${"═".repeat(60)}`);
console.error(`  MEDIARY ACKNOWLEDGE — ${new Date().toISOString()}`);
console.error(`  Task: ${taskId}`);
console.error(`${"═".repeat(60)}\n`);

// Phase 1: Find the follow-up task in ledgers
console.error("▸ Phase 1: Searching ledgers for follow-up task...");
const found = findFollowUpInLedgers(taskId);

if (!found) {
  console.error(`  ✗ Task "${taskId}" not found in any ledger file.`);
  console.error("  Available ledger files:");
  const files = readdirSync(LEDGER_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const content = readFileSync(join(LEDGER_DIR, file), "utf-8");
    const data = JSON.parse(content);
    const tasks: FollowUpTask[] = data.followUpTasks ?? [];
    for (const t of tasks) {
      console.error(`    - ${t.id} (${t.employeeName}, status: ${t.status})`);
    }
  }
  process.exit(1);
}

const { task, ledgerFile } = found;
console.error(`  ✓ Found in ${ledgerFile}`);
console.error(`    Employee: ${task.employeeName} (${task.employeeId})`);
console.error(`    Owner: ${task.owner}`);
console.error(`    Task: ${task.task}`);
console.error(`    Current status: ${task.status}`);

if (task.status === "acknowledged") {
  console.error(`  ⚠ Task is already acknowledged. Skipping.`);
  process.exit(0);
}

// Phase 2: Write acknowledgment record
console.error("\n▸ Phase 2: Writing acknowledgment...");
const now = new Date().toISOString();
const ack: Acknowledgment = {
  followUpId: task.id,
  employeeId: task.employeeId,
  employeeName: task.employeeName,
  owner: task.owner,
  task: task.task,
  trigger: task.trigger,
  outcome,
  acknowledgedAt: now,
  previousStatus: task.status,
  newStatus: "acknowledged",
};

const ackPath = writeAcknowledgment(ack);
console.error(`  ✓ Acknowledgment saved to ${ackPath}`);

// Phase 3: Update follow-up status in ledger
console.error("\n▸ Phase 3: Updating follow-up status in ledger...");
updateFollowUpStatusInLedger(ledgerFile, taskId, "acknowledged");
console.error(`  ✓ Status updated from "${task.status}" to "acknowledged"`);

// Print confirmation
const result = {
  status: "acknowledged",
  followUpId: task.id,
  employeeName: task.employeeName,
  employeeId: task.employeeId,
  owner: task.owner,
  task: task.task,
  trigger: task.trigger,
  outcome,
  acknowledgedAt: now,
  ledgerUpdated: ledgerFile,
  acknowledgmentFile: ackPath,
};

console.error(`\n${"═".repeat(60)}`);
console.error(`  ✓ ACKNOWLEDGED`);
console.error(`  Follow-up: ${task.id}`);
console.error(`  Employee:  ${task.employeeName}`);
console.error(`  Owner:     ${task.owner}`);
console.error(`  Outcome:   ${outcome}`);
console.error(`  At:        ${now}`);
console.error(`${"═".repeat(60)}\n`);

console.log(JSON.stringify(result, null, 2));
