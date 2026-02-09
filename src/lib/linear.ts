import { LinearClient } from '@linear/sdk';

let linearClient: LinearClient | null = null;

export function getLinearClient(): LinearClient {
  if (!linearClient) {
    const apiKey = process.env.LINEAR_API_KEY;
    if (!apiKey) {
      throw new Error('LINEAR_API_KEY environment variable is not set');
    }
    linearClient = new LinearClient({ apiKey });
  }
  return linearClient;
}

export async function fetchLinearTeams() {
  const client = getLinearClient();
  const teams = await client.teams();
  return teams.nodes.map(team => ({
    id: team.id,
    name: team.name,
    key: team.key,
  }));
}

export async function fetchLinearProjects(teamId: string) {
  const client = getLinearClient();
  const team = await client.team(teamId);

  const projectsQuery = await team.projects();

  return Promise.all(projectsQuery.nodes.map(async (project) => {
    const lead = await project.lead;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      state: project.state,
      priority: project.priority,
      targetDate: project.targetDate,
      startDate: project.startDate,
      lead: lead ? {
        id: lead.id,
        name: lead.name,
        email: lead.email,
      } : null,
      url: project.url,
      progress: project.progress,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }));
}

export async function fetchLinearCycles(teamId: string) {
  const client = getLinearClient();
  const team = await client.team(teamId);

  const cyclesQuery = await team.cycles();

  return cyclesQuery.nodes.map((cycle) => ({
    id: cycle.id,
    name: cycle.name,
    number: cycle.number,
    startsAt: cycle.startsAt,
    endsAt: cycle.endsAt,
    completedAt: cycle.completedAt,
    progress: cycle.progress,
  }));
}

export async function fetchLinearIssue(issueId: string) {
  const client = getLinearClient();
  const issue = await client.issue(issueId);

  const [state, assignee, project, cycle, parent, labels] = await Promise.all([
    issue.state,
    issue.assignee,
    issue.project,
    issue.cycle,
    issue.parent,
    issue.labels(),
  ]);

  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    priorityLabel: issue.priorityLabel,
    estimate: issue.estimate,
    state: state ? {
      id: state.id,
      name: state.name,
      type: state.type,
      color: state.color,
    } : null,
    assignee: assignee ? {
      id: assignee.id,
      name: assignee.name,
      email: assignee.email,
    } : null,
    project: project ? {
      id: project.id,
      name: project.name,
    } : null,
    cycle: cycle ? {
      id: cycle.id,
      name: cycle.name,
      number: cycle.number,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
    } : null,
    parent: parent ? {
      id: parent.id,
      identifier: parent.identifier,
      title: parent.title,
    } : null,
    labels: labels.nodes.map(label => ({
      id: label.id,
      name: label.name,
      color: label.color,
    })),
    url: issue.url,
    dueDate: issue.dueDate,
    startedAt: issue.startedAt,
    completedAt: issue.completedAt,
    canceledAt: issue.canceledAt,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}

export async function fetchLinearIssuesByIds(issueIds: string[]) {
  const client = getLinearClient();
  const issues = await Promise.all(issueIds.map(id => fetchLinearIssue(id)));
  return issues;
}

export async function fetchLinearIssues(teamId: string, filters?: {
  state?: string[];
  priority?: number[];
  labels?: string[];
  projectsOnly?: boolean;
}) {
  const client = getLinearClient();
  const team = await client.team(teamId);

  const issuesQuery = team.issues({
    filter: {
      state: filters?.state ? { name: { in: filters.state } } : undefined,
      priority: filters?.priority ? { in: filters.priority } : undefined,
      // Only include issues that have a project if projectsOnly is true
      project: filters?.projectsOnly ? { null: false } : undefined,
    },
  });

  const issues = await issuesQuery;

  return Promise.all(issues.nodes.map(async (issue) => {
    const state = await issue.state;
    const assignee = await issue.assignee;
    const project = await issue.project;
    const cycle = await issue.cycle;

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      priorityLabel: issue.priorityLabel,
      estimate: issue.estimate,
      state: state ? {
        id: state.id,
        name: state.name,
        type: state.type,
      } : null,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
      } : null,
      project: project ? {
        id: project.id,
        name: project.name,
      } : null,
      cycle: cycle ? {
        id: cycle.id,
        name: cycle.name,
        number: cycle.number,
        startsAt: cycle.startsAt,
        endsAt: cycle.endsAt,
      } : null,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      dueDate: issue.dueDate,
      url: issue.url,
    };
  }));
}

export async function searchLinearIssues(query: string, teamId?: string) {
  const client = getLinearClient();

  const issues = await client.issueSearch(query, {
    teamId,
  });

  return Promise.all(issues.nodes.map(async (issue) => {
    const state = await issue.state;
    const assignee = await issue.assignee;

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      estimate: issue.estimate,
      state: state ? {
        id: state.id,
        name: state.name,
      } : null,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
      } : null,
    };
  }));
}

// Helper to get priority label
export function getLinearPriorityLabel(priority: number): string {
  const labels: Record<number, string> = {
    0: 'None',
    1: 'Urgent',
    2: 'High',
    3: 'Normal',
    4: 'Low',
  };
  return labels[priority] || 'None';
}
