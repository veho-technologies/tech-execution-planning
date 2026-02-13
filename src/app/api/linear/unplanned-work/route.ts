import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/linear';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, sprintId, startDate, endDate, excludeProjectIds } = body;

    if (!teamId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'teamId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Get focus factor from quarter/team settings
    let focusFactor = 0.75; // Default fallback

    if (sprintId) {
      // Get sprint and quarter details
      const sprint = await db
        .selectFrom('sprints')
        .innerJoin('quarters', 'quarters.id', 'sprints.quarterId')
        .select([
          'sprints.quarterId',
          'quarters.meetingTimePercentage as quarterMeetingTime',
        ])
        .where('sprints.id', '=', sprintId)
        .executeTakeFirst();

      if (sprint) {
        // Try to get team-specific quarter settings first
        const teamSettings = await db
          .selectFrom('teamQuarterSettings')
          .select('meetingTimePercentage')
          .where('teamId', '=', teamId)
          .where('quarterId', '=', sprint.quarterId)
          .executeTakeFirst();

        const meetingTimePercentage = teamSettings?.meetingTimePercentage ?? sprint.quarterMeetingTime ?? 0.25;
        focusFactor = 1 - meetingTimePercentage;
      }
    }

    const client = getLinearClient();
    const team = await client.team(teamId);

    // Get all workflow states to find TODO state
    const workflowStates = await team.states();
    const todoStateIds = workflowStates.nodes
      .filter(state => state.name.toLowerCase().includes('todo') || state.name.toLowerCase().includes('backlog'))
      .map(state => state.id);

    // Query issues that were updated or completed during the sprint period
    const issuesQuery = await team.issues({
      filter: {
        // Exclude TODO/Backlog states
        state: { id: { nin: todoStateIds } },
        // Filter by completion or update date
        or: [
          { completedAt: { gte: new Date(startDate), lte: new Date(endDate) } },
          { updatedAt: { gte: new Date(startDate), lte: new Date(endDate) } },
        ],
      },
    });

    const issues = await issuesQuery;

    // Get holidays for business day calculation
    let holidayDates = new Set<string>();
    if (sprintId) {
      const sprint = await db
        .selectFrom('sprints')
        .select('quarterId')
        .where('id', '=', sprintId)
        .executeTakeFirst();

      if (sprint) {
        const holidays = await db
          .selectFrom('holidays')
          .select('holidayDate')
          .where('quarterId', '=', sprint.quarterId)
          .execute();

        holidayDates = new Set(holidays.map(h => h.holidayDate));
      }
    }

    const businessDays = getBusinessDays(
      new Date(startDate),
      new Date(endDate),
      holidayDates
    );

    // Process issues and group by project
    const unplannedWork: Record<string, {
      projectId: string | null;
      projectName: string;
      projectUrl: string | null;
      issues: Array<{
        id: string;
        identifier: string;
        title: string;
        assignee: { name: string; email: string } | null;
        state: string;
        completedAt: string | null;
        estimate: number | null;
        actualDays: number | null;
        priority: number;
        priorityLabel: string;
        labels: Array<{ name: string; color: string }>;
      }>;
      engineers: Set<string>;
      totalEstimate: number;
      totalActualDays: number;
    }> = {};

    for (const issue of issues.nodes) {
      const [state, assignee, project, labels] = await Promise.all([
        issue.state,
        issue.assignee,
        issue.project,
        issue.labels(),
      ]);

      const projectId = project?.id || null;
      const projectName = project?.name || 'No Project';
      const projectUrl = project?.url || null;

      // Skip if this project is already in the capacity planner
      if (projectId && excludeProjectIds && excludeProjectIds.includes(projectId)) {
        continue;
      }

      const key = projectId || 'no-project';

      if (!unplannedWork[key]) {
        unplannedWork[key] = {
          projectId,
          projectName,
          projectUrl,
          issues: [],
          engineers: new Set<string>(),
          totalEstimate: 0,
          totalActualDays: 0,
        };
      }

      const estimate = issue.estimate || null;
      if (estimate) {
        unplannedWork[key].totalEstimate += estimate;
      }

      // Calculate actual days from state history
      const actualDays = await calculateIssueActualDays(
        client,
        issue.id,
        businessDays,
        focusFactor
      );

      if (actualDays > 0) {
        unplannedWork[key].totalActualDays += actualDays;
      }

      unplannedWork[key].issues.push({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        url: issue.url,
        assignee: assignee ? {
          name: assignee.name,
          email: assignee.email,
        } : null,
        state: state?.name || 'Unknown',
        completedAt: issue.completedAt?.toISOString() || null,
        estimate,
        actualDays: actualDays > 0 ? actualDays : null,
        priority: issue.priority,
        priorityLabel: issue.priorityLabel,
        labels: labels.nodes.map(label => ({
          name: label.name,
          color: label.color,
        })),
      });

      if (assignee) {
        unplannedWork[key].engineers.add(assignee.name);
      }
    }

    // Convert engineers Set to Array and format response
    const result = Object.values(unplannedWork).map(item => ({
      projectId: item.projectId,
      projectName: item.projectName,
      projectUrl: item.projectUrl,
      issueCount: item.issues.length,
      totalEstimate: item.totalEstimate,
      totalActualDays: item.totalActualDays,
      engineers: Array.from(item.engineers),
      issues: item.issues,
    }));

    // Calculate overall metrics
    const totalIssues = result.reduce((sum, item) => sum + item.issueCount, 0);
    const totalEstimate = result.reduce((sum, item) => sum + item.totalEstimate, 0);
    const totalActualDays = result.reduce((sum, item) => sum + item.totalActualDays, 0);

    // Count by priority
    const priorityCounts = {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0,
      none: 0,
    };

    result.forEach(item => {
      item.issues.forEach(issue => {
        if (issue.priority === 1) priorityCounts.urgent++;
        else if (issue.priority === 2) priorityCounts.high++;
        else if (issue.priority === 3) priorityCounts.normal++;
        else if (issue.priority === 4) priorityCounts.low++;
        else priorityCounts.none++;
      });
    });

    return NextResponse.json({
      sprintPeriod: { startDate, endDate },
      unplannedWork: result,
      metrics: {
        totalIssues,
        totalEstimate,
        totalActualDays,
        priorityCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching unplanned work:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unplanned work from Linear' },
      { status: 500 }
    );
  }
}

/**
 * Calculate actual days for a single issue based on "In Progress" periods
 */
async function calculateIssueActualDays(
  client: any,
  issueId: string,
  sprintBusinessDays: Date[],
  focusFactor: number
): Promise<number> {
  try {
    const inProgressPeriods = await getIssueInProgressPeriods(client, issueId);

    if (inProgressPeriods.length === 0) {
      return 0;
    }

    // Count how many sprint business days fall within "In Progress" periods
    let daysInProgress = 0;

    for (const day of sprintBusinessDays) {
      const isInProgress = inProgressPeriods.some(period => {
        const start = period.start;
        const end = period.end || new Date();
        return day >= start && day <= end;
      });

      if (isInProgress) {
        daysInProgress += 1;
      }
    }

    // Apply focus factor
    return daysInProgress * focusFactor;
  } catch (error) {
    console.error(`Error calculating actual days for issue ${issueId}:`, error);
    return 0;
  }
}

/**
 * Get periods when an issue was "In Progress"
 */
async function getIssueInProgressPeriods(
  client: any,
  issueId: string
): Promise<Array<{ start: Date; end: Date | null }>> {
  try {
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
  } catch (error) {
    console.error(`Error fetching history for issue ${issueId}:`, error);
    return [];
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
