import type { CalendarEvent, Employee, OrgDataset, Weekday } from "@/src/types/mediary";

const employeeSeeds = [
  ["maya-chen", "Maya Chen", "Product Operations Lead", "Platform Experience", "Lina Park"],
  ["alex-johnson", "Alex Johnson", "Engineering Manager", "Platform Experience", "Lina Park"],
  ["samira-khan", "Samira Khan", "Product Manager", "Core Product", "Victor Hale"],
  ["noah-lee", "Noah Lee", "Senior Engineer", "Core Product", "Alex Johnson"],
  ["priya-nair", "Priya Nair", "Design Lead", "Design Systems", "Victor Hale"],
  ["diego-santos", "Diego Santos", "Support Manager", "Customer Support", "Lina Park"],
  ["hana-kim", "Hana Kim", "Customer Success Lead", "Customer Success", "Lina Park"],
  ["liam-owens", "Liam Owens", "Solutions Engineer", "Customer Success", "Hana Kim"],
  ["amina-yusuf", "Amina Yusuf", "Operations Analyst", "Product Operations", "Maya Chen"],
  ["ben-turner", "Ben Turner", "Staff Engineer", "Platform Experience", "Alex Johnson"],
  ["charlotte-rivera", "Charlotte Rivera", "Program Manager", "Delivery Operations", "Maya Chen"],
  ["daniel-wu", "Daniel Wu", "Data Analyst", "Insights", "Victor Hale"],
  ["ella-foster", "Ella Foster", "QA Lead", "Quality", "Alex Johnson"],
  ["farid-hassan", "Farid Hassan", "Implementation Manager", "Customer Success", "Hana Kim"],
  ["grace-mills", "Grace Mills", "Product Designer", "Design Systems", "Priya Nair"],
  ["haruto-sato", "Haruto Sato", "Backend Engineer", "Core Product", "Alex Johnson"],
  ["isabella-rossi", "Isabella Rossi", "People Operations", "People Ops", "Lina Park"],
  ["jacob-nguyen", "Jacob Nguyen", "Sales Ops Partner", "Revenue Operations", "Victor Hale"],
  ["karina-silva", "Karina Silva", "Technical Writer", "Enablement", "Samira Khan"],
  ["leo-brooks", "Leo Brooks", "Frontend Engineer", "Core Product", "Alex Johnson"],
  ["marta-nowak", "Marta Nowak", "Release Manager", "Delivery Operations", "Charlotte Rivera"],
  ["niko-petrov", "Niko Petrov", "Security Engineer", "Platform Security", "Alex Johnson"],
  ["olivia-clark", "Olivia Clark", "Partnership Manager", "Partner Operations", "Lina Park"],
  ["paul-lam", "Paul Lam", "Finance Analyst", "Finance", "Victor Hale"],
];

const weekdays: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const baseBlueprint: Omit<CalendarEvent, "id" | "owner">[] = [
  { title: "Daily platform standup", day: "Monday", start: "09:00", end: "09:30", attendees: ["Platform"], isRecurring: true },
  { title: "Cross-team launch sync", day: "Monday", start: "09:30", end: "10:30", attendees: ["Ops", "Product", "Design"], isRecurring: true },
  { title: "Dependency review", day: "Monday", start: "14:00", end: "15:00", attendees: ["Product", "Engineering"], isRecurring: true },
  { title: "Support interruption triage", day: "Tuesday", start: "11:00", end: "12:00", attendees: ["Support", "Ops"], isRecurring: true },
  { title: "Sprint planning", day: "Tuesday", start: "13:00", end: "14:30", attendees: ["Engineering", "Product"], isRecurring: true },
  { title: "Stakeholder update", day: "Wednesday", start: "10:00", end: "11:00", attendees: ["Leadership", "Operations"], isRecurring: true },
  { title: "Workflow process review", day: "Wednesday", start: "15:00", end: "16:00", attendees: ["Operations", "Support"], isRecurring: true },
  { title: "Leadership readout", day: "Thursday", start: "10:00", end: "11:00", attendees: ["Leadership"], isRecurring: true },
  { title: "Support queue review", day: "Thursday", start: "11:00", end: "12:00", attendees: ["Support"], isRecurring: true },
  { title: "Weekly business review", day: "Friday", start: "09:30", end: "11:00", attendees: ["Revenue", "Operations"], isRecurring: true },
  { title: "Team retrospective", day: "Friday", start: "14:00", end: "15:00", attendees: ["Team"], isRecurring: true },
  { title: "Regional partner escalation", day: "Wednesday", start: "18:00", end: "18:45", attendees: ["Partners"], isRecurring: false },
];

function shiftTimeByQuarterHour(time: string, offsetSteps: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + offsetSteps * 15;
  const bounded = Math.min(Math.max(total, 8 * 60), 20 * 60 + 45);
  const h = Math.floor(bounded / 60)
    .toString()
    .padStart(2, "0");
  const m = (bounded % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function buildEmployeeCalendar(employee: Employee, seedIndex: number): CalendarEvent[] {
  const offset = (seedIndex % 3) - 1;
  const includeAfterHours = seedIndex % 4 !== 0;
  const includeTriage = seedIndex % 5 !== 0;

  return baseBlueprint
    .filter((event) => (event.title === "Regional partner escalation" ? includeAfterHours : true))
    .filter((event) => (event.title === "Support interruption triage" ? includeTriage : true))
    .map((event, idx) => {
      const start = shiftTimeByQuarterHour(event.start, idx % 2 === 0 ? offset : 0);
      const end = shiftTimeByQuarterHour(event.end, idx % 2 === 0 ? offset : 0);

      return {
        id: `${employee.id}-${event.day.toLowerCase()}-${idx}`,
        owner: employee.name,
        ...event,
        start,
        end,
      };
    });
}

function buildEmployees(): Employee[] {
  const normalizeTeam = (team: string): string => {
    if (["Platform Experience", "Core Product", "Platform Security"].includes(team)) {
      return "Product & Engineering";
    }
    if (["Customer Support", "Customer Success", "Partner Operations"].includes(team)) {
      return "Customer Operations";
    }
    if (["Design Systems", "Quality", "Enablement"].includes(team)) {
      return "Design & Quality";
    }
    if (["Product Operations", "Delivery Operations", "People Ops"].includes(team)) {
      return "People & Program Operations";
    }
    return "Business Operations";
  };

  return employeeSeeds.map(([id, name, role, team, manager], index) => ({
    id,
    name,
    role,
    team: normalizeTeam(team),
    manager,
    timezone: index % 2 === 0 ? "UTC+7" : "UTC+1",
  }));
}

function buildCalendarsByEmployee(employees: Employee[]): Record<string, CalendarEvent[]> {
  return Object.fromEntries(
    employees.map((employee, index) => [employee.id, buildEmployeeCalendar(employee, index)]),
  );
}

export const sampleOrgDataset: OrgDataset = (() => {
  const employees = buildEmployees();
  const calendarsByEmployee = buildCalendarsByEmployee(employees);
  return { employees, calendarsByEmployee };
})();

export const defaultEmployeeId = sampleOrgDataset.employees[0].id;
export const supportedWeekdays = weekdays;
