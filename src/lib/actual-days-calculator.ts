import { getLinearClient } from './linear';
import db from './db';

interface StateTransition {
  issueId: string;
  fromState: string | null;
  toState: string | null;
  changedAt: Date;
  assigneeIds: string[];
}

interface IssueTimeEntry {
  issueId: string;
  assigneeId: string;
  actualDays: number;
}

/**
 * Calculate actual days spent on issues based on Linear state history
 *
 * Algorithm:
 * 1. Fetch all issues in sprint with their state history
 * 2. For each business day in sprint:
 *    - Find issues that were "In Progress" on that day
 *    - For each engineer, distribute 1.0 day across their active issues
 * 3. Normalize by focus factor (account for meetings/KTLO)
 * 4. Update sprint_allocations.actual_days
 */
export async function calculateActualDaysForSprint(
  sprintId: string,
  teamId: string,
  focusFactor: number = 0.75
): Promise<Map<string, IssueTimeEntry[]>> {
  // 1. Get sprint details
  const sprint = await db
    .selectFrom('sprints')
    .selectAll()
    .where('id', '=', sprintId)
    .executeTakeFirstOrThrow();

  // 2. Get holidays for this sprint
  const holidays = await db
    .selectFrom('holidays')
    .select('holidayDate')
    .where('quarterId', '=', sprint.quarterId)
    .execute();

  const holidayDates = new Set(holidays.map(h => h.holidayDate));

  // 3. Get all business days in sprint (excluding weekends and holidays)
  const businessDays = getBusinessDays(
    new Date(sprint.startDate),
    new Date(sprint.endDate),
    holidayDates
  );

  // 4. Get all projects in this sprint
  const allocations = await db
    .selectFrom('sprintAllocations')
    .innerJoin('projects', 'projects.id', 'sprintAllocations.projectId')
    .select([
      'projects.id as projectId',
      'projects.linearIssueId',
    ])
    .where('sprintAllocations.sprintId', '=', sprintId)
    .where('projects.linearIssueId', 'is not', null)
    .execute();

  if (allocations.length === 0) {
    console.log('No Linear issues found in this sprint');
    return new Map();
  }

  // 5. Fetch state history for all issues
  const issueStateTimelines = await Promise.all(
    allocations.map(async (alloc) => {
      if (!alloc.linearIssueId) return null;

      try {
        const timeline = await getIssueStateTimeline(alloc.linearIssueId);
        return {
          projectId: alloc.projectId,
          linearIssueId: alloc.linearIssueId,
          timeline,
        };
      } catch (error) {
        console.error(`Failed to fetch history for ${alloc.linearIssueId}:`, error);
        return null;
      }
    })
  );

  const validTimelines = issueStateTimelines.filter(t => t !== null);

  // 6. Build engineer -> issues map for each day
  const engineerDailyIssues = buildEngineerDailyIssueMap(
    businessDays,
    validTimelines,
    sprint.startDate,
    sprint.endDate
  );

  // 7. Calculate actual days per engineer per issue
  const issueTimeEntries = calculateDistributedTime(engineerDailyIssues, focusFactor);

  return issueTimeEntries;
}

/**
 * Fetch state history for an issue and build timeline of states
 */
async function getIssueStateTimeline(issueId: string): Promise<{
  assigneeIds: string[];
  transitions: Array<{ state: string; startDate: Date; endDate: Date | null }>;
}> {
  const client = getLinearClient();
  const issue = await client.issue(issueId);

  // Get current assignee
  const assignee = await issue.assignee;
  const assigneeIds = assignee ? [assignee.id] : [];

  // Fetch state history
  const history = await issue.history({
    first: 200, // Get last 200 changes (should be enough)
    orderBy: 'createdAt' as any,
  });

  // Get current state
  const currentState = await issue.state;

  // Build state transitions
  const transitions: StateTransition[] = [];

  for (const entry of history.nodes) {
    const fromState = await entry.fromState;
    const toState = await entry.toState;

    if (toState) {
      transitions.push({
        issueId,
        fromState: fromState?.name || null,
        toState: toState.name,
        changedAt: entry.createdAt,
        assigneeIds,
      });
    }
  }

  // Sort by date ascending
  transitions.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

  // Build timeline: when did issue enter/leave "In Progress"
  const timeline: Array<{ state: string; startDate: Date; endDate: Date | null }> = [];
  let currentStateEntry: { state: string; startDate: Date } | null = null;

  for (const trans of transitions) {
    // Close previous state
    if (currentStateEntry) {
      timeline.push({
        ...currentStateEntry,
        endDate: trans.changedAt,
      });
    }

    // Start new state
    if (trans.toState) {
      currentStateEntry = {
        state: trans.toState,
        startDate: trans.changedAt,
      };
    }
  }

  // Add current state (no end date)
  if (currentStateEntry) {
    timeline.push({
      ...currentStateEntry,
      endDate: null, // Still in this state
    });
  } else if (currentState) {
    // If no history, use created date as start
    timeline.push({
      state: currentState.name,
      startDate: issue.createdAt,
      endDate: null,
    });
  }

  return {
    assigneeIds,
    transitions: timeline,
  };
}

/**
 * Build a map of: businessDay -> engineer -> list of active issue IDs
 */
function buildEngineerDailyIssueMap(
  businessDays: Date[],
  issueTimelines: Array<{
    projectId: string;
    linearIssueId: string;
    timeline: { assigneeIds: string[]; transitions: Array<{ state: string; startDate: Date; endDate: Date | null }> };
  }>,
  sprintStart: string,
  sprintEnd: string
): Map<string, Map<string, string[]>> {
  const map = new Map<string, Map<string, string[]>>();

  for (const day of businessDays) {
    const dayKey = day.toISOString().split('T')[0];
    const engineerIssues = new Map<string, string[]>();

    for (const issueTimeline of issueTimelines) {
      // Check if issue was "In Progress" on this day
      const wasInProgress = issueTimeline.timeline.transitions.some(t => {
        if (t.state !== 'In Progress') return false;

        const start = t.startDate;
        const end = t.endDate || new Date(sprintEnd);

        return day >= start && day <= end;
      });

      if (wasInProgress) {
        // Add this issue to each assignee's list for this day
        for (const assigneeId of issueTimeline.timeline.assigneeIds) {
          const issues = engineerIssues.get(assigneeId) || [];
          issues.push(issueTimeline.projectId);
          engineerIssues.set(assigneeId, issues);
        }
      }
    }

    map.set(dayKey, engineerIssues);
  }

  return map;
}

/**
 * Calculate distributed time per engineer per issue
 * Then normalize by focus factor
 */
function calculateDistributedTime(
  engineerDailyIssues: Map<string, Map<string, string[]>>,
  focusFactor: number
): Map<string, IssueTimeEntry[]> {
  const engineerIssueTime = new Map<string, Map<string, number>>();

  // For each day
  for (const [dayKey, engineerIssues] of engineerDailyIssues.entries()) {
    // For each engineer on that day
    for (const [engineerId, issueIds] of engineerIssues.entries()) {
      if (issueIds.length === 0) continue;

      // Distribute 1.0 day across all their active issues
      const timePerIssue = 1.0 / issueIds.length;

      // Track time for this engineer
      if (!engineerIssueTime.has(engineerId)) {
        engineerIssueTime.set(engineerId, new Map());
      }
      const issueTimeMap = engineerIssueTime.get(engineerId)!;

      for (const issueId of issueIds) {
        const currentTime = issueTimeMap.get(issueId) || 0;
        issueTimeMap.set(issueId, currentTime + timePerIssue);
      }
    }
  }

  // Normalize by focus factor and convert to IssueTimeEntry format
  const result = new Map<string, IssueTimeEntry[]>();

  for (const [engineerId, issueTimeMap] of engineerIssueTime.entries()) {
    const entries: IssueTimeEntry[] = [];

    for (const [issueId, rawDays] of issueTimeMap.entries()) {
      entries.push({
        issueId,
        assigneeId: engineerId,
        actualDays: rawDays * focusFactor, // Normalize
      });
    }

    result.set(engineerId, entries);
  }

  return result;
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
 * Update actual days in sprint_allocations table
 */
export async function updateSprintAllocationsActualDays(
  sprintId: string,
  issueTimeEntries: Map<string, IssueTimeEntry[]>
): Promise<void> {
  // Aggregate actual days per project (sum across all engineers)
  const projectActualDays = new Map<string, number>();

  for (const entries of issueTimeEntries.values()) {
    for (const entry of entries) {
      const current = projectActualDays.get(entry.issueId) || 0;
      projectActualDays.set(entry.issueId, current + entry.actualDays);
    }
  }

  // Update database
  for (const [projectId, actualDays] of projectActualDays.entries()) {
    await db
      .updateTable('sprintAllocations')
      .set({ actualDays: Math.round(actualDays * 100) / 100 }) // Round to 2 decimals
      .where('projectId', '=', projectId)
      .where('sprintId', '=', sprintId)
      .execute();
  }
}
