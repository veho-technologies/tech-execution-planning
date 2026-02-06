import { getLinearClient } from './linear';
import db from './db';

interface IssueActualDays {
  issueId: string;
  projectId: string | null;
  actualDays: number;
}

/**
 * Calculate actual days spent on issues based on Linear state history
 *
 * NEW ALGORITHM:
 * 1. Fetch ALL issues in the Linear cycle for this sprint
 * 2. For each issue, calculate actual days from state history
 * 3. Group by Linear project
 * 4. Map to our system projects and update sprint_allocations
 */
export async function calculateActualDaysForSprint(
  sprintId: string,
  teamId: string,
  focusFactor: number = 0.75
): Promise<void> {
  console.log(`\n=== Starting Actual Days Calculation ===`);
  console.log(`Sprint ID: ${sprintId}`);
  console.log(`Team ID: ${teamId}`);
  console.log(`Focus Factor: ${focusFactor}`);

  // 1. Get sprint details
  const sprint = await db
    .selectFrom('sprints')
    .select(['id', 'name', 'startDate', 'endDate', 'quarterId'])
    .where('id', '=', sprintId)
    .executeTakeFirstOrThrow();

  console.log(`Sprint: ${sprint.name} (${sprint.startDate} to ${sprint.endDate})`);

  // 2. Get Linear cycle for this sprint (sprint name should match cycle name)
  const client = getLinearClient();
  const team = await client.team(teamId);
  const cycles = await team.cycles();

  // Find cycle by name matching sprint name (flexible matching)
  let cycle = cycles.nodes.find(c => c.name === sprint.name);

  // Try alternative matches if exact match fails
  if (!cycle) {
    // Try matching by number (e.g., "Cycle 88" -> "88")
    const numberMatch = sprint.name.match(/\d+/);
    if (numberMatch) {
      const number = parseInt(numberMatch[0]);
      cycle = cycles.nodes.find(c => c.number === number);
    }
  }

  if (!cycle) {
    console.log(`No Linear cycle found matching sprint "${sprint.name}"`);
    console.log(`Available cycles: ${cycles.nodes.map(c => `${c.name} (#${c.number})`).join(', ')}`);
    return;
  }

  console.log(`Found Linear cycle: ${cycle.name} (${cycle.id})`);

  // 3. Get holidays for business day calculation
  const holidays = await db
    .selectFrom('holidays')
    .select('holidayDate')
    .where('quarterId', '=', sprint.quarterId)
    .execute();

  const holidayDates = new Set(holidays.map(h => h.holidayDate));

  // 4. Get business days in sprint
  const businessDays = getBusinessDays(
    new Date(sprint.startDate),
    new Date(sprint.endDate),
    holidayDates
  );

  console.log(`Business days in sprint: ${businessDays.length}`);

  // 5. Fetch ALL issues in this cycle
  const issues = await cycle.issues();
  console.log(`Found ${issues.nodes.length} issues in cycle`);

  // 6. Build issue timelines with assignees
  const issueTimelines: Array<{
    issueId: string;
    identifier: string;
    projectId: string | null;
    assigneeId: string | null;
    inProgressPeriods: Array<{ start: Date; end: Date | null }>;
  }> = [];

  for (const issue of issues.nodes) {
    try {
      const assignee = await issue.assignee;
      const project = await issue.project;
      const inProgressPeriods = await getIssueInProgressPeriods(issue.id);

      issueTimelines.push({
        issueId: issue.id,
        identifier: issue.identifier,
        projectId: project?.id || null,
        assigneeId: assignee?.id || null,
        inProgressPeriods,
      });
    } catch (error) {
      console.error(`Error fetching timeline for issue ${issue.id}:`, error);
    }
  }

  console.log(`Built timelines for ${issueTimelines.length} issues`);

  // 7. Distribute time per engineer per day
  const issueActuals: IssueActualDays[] = [];

  // Group issues by assignee
  const issuesByAssignee = new Map<string, typeof issueTimelines>();

  for (const timeline of issueTimelines) {
    if (!timeline.assigneeId) continue;

    if (!issuesByAssignee.has(timeline.assigneeId)) {
      issuesByAssignee.set(timeline.assigneeId, []);
    }
    issuesByAssignee.get(timeline.assigneeId)!.push(timeline);
  }

  console.log(`Distributing time across ${issuesByAssignee.size} engineers`);

  // For each engineer, distribute their time across their active issues each day
  for (const [assigneeId, assigneeIssues] of issuesByAssignee.entries()) {
    const issueActualDays = new Map<string, number>();

    for (const day of businessDays) {
      // Find all issues this engineer had "In Progress" on this day
      const activeIssues = assigneeIssues.filter(issue =>
        issue.inProgressPeriods.some(period => {
          const start = period.start;
          const end = period.end || new Date();
          return day >= start && day <= end;
        })
      );

      if (activeIssues.length === 0) continue;

      // Distribute 1.0 day across all active issues
      const timePerIssue = 1.0 / activeIssues.length;

      for (const issue of activeIssues) {
        const current = issueActualDays.get(issue.issueId) || 0;
        issueActualDays.set(issue.issueId, current + timePerIssue);
      }
    }

    // Create issue actuals with normalized time
    for (const issue of assigneeIssues) {
      const rawDays = issueActualDays.get(issue.issueId) || 0;
      const normalizedDays = rawDays * focusFactor;

      if (normalizedDays > 0) {
        issueActuals.push({
          issueId: issue.issueId,
          projectId: issue.projectId,
          actualDays: normalizedDays,
        });

        console.log(`Issue ${issue.identifier}: ${rawDays.toFixed(2)} days (${normalizedDays.toFixed(2)} normalized)`);
      }
    }
  }

  // 7. Group by Linear project and sum actual days
  const projectActuals = new Map<string, number>();

  for (const issueActual of issueActuals) {
    if (!issueActual.projectId) continue;

    const current = projectActuals.get(issueActual.projectId) || 0;
    projectActuals.set(issueActual.projectId, current + issueActual.actualDays);
  }

  console.log(`\nGrouped into ${projectActuals.size} projects:`);
  for (const [projectId, days] of projectActuals.entries()) {
    console.log(`  Linear Project ${projectId}: ${days.toFixed(2)} days`);
  }

  // 8. Update our system's sprint allocations
  await updateSprintAllocationsFromLinearProjects(
    sprintId,
    projectActuals
  );

  console.log(`=== Calculation Complete ===\n`);
}

/**
 * Get periods when an issue was "In Progress"
 */
async function getIssueInProgressPeriods(
  issueId: string
): Promise<Array<{ start: Date; end: Date | null }>> {
  const client = getLinearClient();
  const issue = await client.issue(issueId);

  // Fetch state history
  const history = await issue.history({
    first: 200,
    orderBy: 'createdAt' as any,
  });

  // Build state timeline
  const transitions: Array<{ state: string; timestamp: Date }> = [];

  for (const entry of history.nodes) {
    const toState = await entry.toState;
    if (toState) {
      transitions.push({
        state: toState.name,
        timestamp: entry.createdAt,
      });
    }
  }

  // Sort by timestamp
  transitions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Build timeline: when was issue in "In Progress"?
  const inProgressPeriods: Array<{ start: Date; end: Date | null }> = [];
  let currentPeriod: { start: Date; state: string } | null = null;

  for (const trans of transitions) {
    if (trans.state === 'In Progress') {
      // Start new period
      currentPeriod = {
        start: trans.timestamp,
        state: trans.state,
      };
    } else if (currentPeriod && currentPeriod.state === 'In Progress') {
      // End current period
      inProgressPeriods.push({
        start: currentPeriod.start,
        end: trans.timestamp,
      });
      currentPeriod = { start: trans.timestamp, state: trans.state };
    } else {
      currentPeriod = { start: trans.timestamp, state: trans.state };
    }
  }

  // If still in progress, end period is now
  if (currentPeriod && currentPeriod.state === 'In Progress') {
    inProgressPeriods.push({
      start: currentPeriod.start,
      end: null, // Still in progress
    });
  }

  return inProgressPeriods;
}

/**
 * Update sprint allocations based on Linear project actuals
 */
async function updateSprintAllocationsFromLinearProjects(
  sprintId: string,
  linearProjectActuals: Map<string, number>
): Promise<void> {
  // Get mapping of Linear project IDs to our system project IDs
  const projects = await db
    .selectFrom('projects')
    .select(['id', 'linearIssueId'])
    .where('linearIssueId', 'in', Array.from(linearProjectActuals.keys()))
    .execute();

  console.log(`\nFound ${projects.length} matching projects in our system`);

  for (const project of projects) {
    const actualDays = linearProjectActuals.get(project.linearIssueId);
    if (!actualDays) continue;

    // Check if allocation exists
    const existingAlloc = await db
      .selectFrom('sprintAllocations')
      .select('id')
      .where('projectId', '=', project.id)
      .where('sprintId', '=', sprintId)
      .executeTakeFirst();

    if (existingAlloc) {
      // Update existing allocation
      await db
        .updateTable('sprintAllocations')
        .set({ actualDays: Math.round(actualDays * 100) / 100 })
        .where('projectId', '=', project.id)
        .where('sprintId', '=', sprintId)
        .execute();

      console.log(`  Updated project ${project.id}: ${actualDays.toFixed(2)} days`);
    } else {
      // Create new allocation with just actuals
      await db
        .insertInto('sprintAllocations')
        .values({
          projectId: project.id,
          sprintId: sprintId,
          plannedDays: 0,
          actualDays: Math.round(actualDays * 100) / 100,
        })
        .execute();

      console.log(`  Created allocation for project ${project.id}: ${actualDays.toFixed(2)} days`);
    }
  }
}

/**
 * Get all business days between start and end (excluding weekends and holidays)
 */
function getBusinessDays(
  startDate: Date,
  endDate: Date,
  holidays: Set<string>
): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateStr)) {
      days.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Export for backwards compatibility
 */
export async function updateSprintAllocationsActualDays(
  sprintId: string,
  issueTimeEntries: Map<string, any[]>
): Promise<void> {
  // This function is no longer used with the new algorithm
  console.log('updateSprintAllocationsActualDays called but not needed with new algorithm');
}
