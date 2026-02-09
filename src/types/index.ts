export interface Team {
  id: string;
  name: string;
  linearTeamId: string | null;
  totalEngineers: number;
  ktloEngineers: number;
  ptoDaysPerEngineer: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quarter {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  meetingTimePercentage: number;
  workDaysPerWeek: number;
  createdAt: string;
  updatedAt: string;
}

export interface Holiday {
  id: number;
  quarterId: string;
  holidayDate: string;
  description: string | null;
}

export interface Sprint {
  id: string;
  quarterId: string;
  name: string;
  startDate: string;
  endDate: string;
  sprintNumber: number;
  createdAt: string;
}

export interface Project {
  id: string;
  linearIssueId: string; // Link to Linear project (required)
  teamId: string;
  quarterId: string;
  // Local planning fields only - everything else comes from Linear
  plannedWeeks: number; // YOUR planned capacity in weeks
  internalTimeline: string | null;
  hasFrm: boolean;
  notes: string | null;
  dependencies: string | null;
  displayOrder: number; // Custom row ordering
  createdAt: string;
  updatedAt: string;
}

export type ProjectPhase = 'Tech Spec' | 'Execution' | 'UAT' | 'Rollout';

export interface SprintAllocation {
  id: number;
  projectId: string;
  sprintId: string;
  plannedDays: number;
  actualDays: number;
  plannedDescription: string | null;
  engineersAssigned: string | null;
  phase: ProjectPhase;
  sprintGoal: string | null;
  numEngineers: number;
  isManualOverride: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CapacitySnapshot {
  id: number;
  teamId: string;
  quarterId: string;
  sprintId: string | null;
  snapshotDate: string;
  totalCapacityDays: number | null;
  allocatedDays: number | null;
  availableDays: number | null;
  ptoAdjustments: number;
  notes: string | null;
}

export interface SprintSnapshot {
  id: number;
  sprintId: string;
  snapshotDate: string;
  snapshotData: string;
  notes: string | null;
  createdBy: string | null;
}

export interface PTOEntry {
  id: number;
  teamId: string;
  engineerName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  quarterId: string;
  notes: string | null;
  createdAt: string;
}

export interface TeamQuarterSettings {
  id: number;
  teamId: string;
  quarterId: string;
  totalEngineers: number;
  ktloEngineers: number;
  meetingTimePercentage: number;
  ptoDaysPerEngineer: number;
  createdAt: string;
  updatedAt: string;
}

export interface CapacityCalculation {
  quarter: Quarter;
  team: Team;
  workingDays: number;
  roadmapEngineers: number;
  devFocusFactor: number;
  hypotheticalMaxDays: number;
  roadmapPlanningDays: number;
  roadmapPlanningWeeks: number;
  ptoAdjustments: number;
  adjustedCapacityDays: number;
}

export interface ProjectWithAllocations extends Project {
  allocations: SprintAllocation[];
  totalPlannedDays: number;
  totalActualDays: number;
  remainingEffort: number;
}

export interface ExecutionPlanRow {
  project: ProjectWithAllocations;
  sprints: Map<string, SprintAllocation>;
}

export interface QuarterCapacitySummary {
  quarter: Quarter;
  team: Team;
  totalCapacity: number;
  allocatedCapacity: number;
  availableCapacity: number;
  utilizationPercentage: number;
  isOverCapacity: boolean;
}
