import { Quarter, Team, Holiday, PTOEntry, CapacityCalculation, Sprint, SprintAllocation } from '@/types';
import { differenceInBusinessDays, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';

export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  holidays: Date[] = []
): number {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.filter(day => {
    if (isWeekend(day)) return false;
    if (holidays.some(holiday => holiday.getTime() === day.getTime())) return false;
    return true;
  }).length;
}

export function calculateQuarterCapacity(
  quarter: Quarter,
  team: Team,
  holidays: Holiday[] = [],
  ptoEntries: PTOEntry[] = [],
  totalEngineers?: number,
  ktloEngineers?: number,
  meetingTimePercentage?: number,
  ptoDaysPerEngineer?: number
): CapacityCalculation {
  const startDate = parseISO(quarter.startDate);
  const endDate = parseISO(quarter.endDate);

  const holidayDates = holidays.map(h => parseISO(h.holidayDate));
  const workingDays = calculateWorkingDays(startDate, endDate, holidayDates);

  // Use per-quarter settings if provided, otherwise fall back to team/quarter defaults
  const totalEngineersValue = totalEngineers ?? team.totalEngineers;
  const ktloEngineersValue = ktloEngineers ?? team.ktloEngineers;
  const meetingTimePercentageValue = meetingTimePercentage ?? quarter.meetingTimePercentage;
  const ptoDaysPerEngineerValue = ptoDaysPerEngineer ?? team.ptoDaysPerEngineer;

  const roadmapEngineers = Math.max(0, totalEngineersValue - ktloEngineersValue);
  const devFocusFactor = 1 - meetingTimePercentageValue;

  const hypotheticalMaxDays = roadmapEngineers * workingDays;

  const basePtoDays = ptoDaysPerEngineerValue * roadmapEngineers;
  const actualPtoDays = ptoEntries.reduce((sum, pto) => sum + pto.daysCount, 0);
  const totalPto = actualPtoDays || basePtoDays;

  const roadmapPlanningDays = Math.max(
    0,
    (workingDays - ptoDaysPerEngineerValue) * roadmapEngineers * devFocusFactor
  );

  const adjustedCapacityDays = Math.max(
    0,
    (workingDays * roadmapEngineers - totalPto) * devFocusFactor
  );

  const roadmapPlanningWeeks = quarter.workDaysPerWeek > 0
    ? roadmapPlanningDays / quarter.workDaysPerWeek
    : 0;

  return {
    quarter,
    team,
    workingDays,
    roadmapEngineers,
    devFocusFactor,
    hypotheticalMaxDays,
    roadmapPlanningDays,
    roadmapPlanningWeeks,
    ptoAdjustments: totalPto,
    adjustedCapacityDays,
  };
}

export function calculateSprintCapacity(
  sprintStartDate: Date,
  sprintEndDate: Date,
  team: Team,
  meetingPercentage: number,
  holidays: Date[] = []
): number {
  const workingDays = calculateWorkingDays(sprintStartDate, sprintEndDate, holidays);
  const roadmapEngineers = Math.max(0, team.totalEngineers - team.ktloEngineers);
  const devFocusFactor = 1 - meetingPercentage;

  return workingDays * roadmapEngineers * devFocusFactor;
}

export function isOverCapacity(
  allocatedDays: number,
  totalCapacity: number,
  threshold: number = 1.0
): boolean {
  return allocatedDays > totalCapacity * threshold;
}

export function calculateUtilization(
  allocatedDays: number,
  totalCapacity: number
): number {
  if (totalCapacity === 0) return 0;
  return (allocatedDays / totalCapacity) * 100;
}

export function distributePTOAcrossSprints(
  ptoEntry: PTOEntry,
  sprints: { startDate: string; endDate: string; id: string }[]
): Map<string, number> {
  const distribution = new Map<string, number>();
  const ptoStart = parseISO(ptoEntry.startDate);
  const ptoEnd = parseISO(ptoEntry.endDate);

  sprints.forEach(sprint => {
    const sprintStart = parseISO(sprint.startDate);
    const sprintEnd = parseISO(sprint.endDate);

    const overlapStart = new Date(Math.max(ptoStart.getTime(), sprintStart.getTime()));
    const overlapEnd = new Date(Math.min(ptoEnd.getTime(), sprintEnd.getTime()));

    if (overlapStart <= overlapEnd) {
      const overlapDays = calculateWorkingDays(overlapStart, overlapEnd);
      if (overlapDays > 0) {
        distribution.set(sprint.id, overlapDays);
      }
    }
  });

  return distribution;
}

/**
 * Calculate allocation days for a sprint using existing capacity logic
 * Reuses: calculateWorkingDays(), dev_focus_factor from quarter
 */
export function calculateSprintAllocationDays(
  numEngineers: number,
  sprint: Sprint,
  quarter: Quarter,
  holidays: Holiday[] = [],
  ptoDaysPerEngineer: number = 0
): number {
  const startDate = parseISO(sprint.startDate);
  const endDate = parseISO(sprint.endDate);

  const holidayDates = holidays
    .filter(h => {
      const hDate = parseISO(h.holidayDate);
      return hDate >= startDate && hDate <= endDate;
    })
    .map(h => parseISO(h.holidayDate));

  const workingDays = calculateWorkingDays(startDate, endDate, holidayDates);
  const devFocusFactor = 1 - quarter.meetingTimePercentage;

  // Calculate PTO impact for this sprint
  // Prorate PTO across the quarter based on sprint length
  const quarterStart = parseISO(quarter.startDate);
  const quarterEnd = parseISO(quarter.endDate);
  const quarterWorkingDays = calculateWorkingDays(quarterStart, quarterEnd, []);
  const ptoDaysThisSprint = quarterWorkingDays > 0
    ? (ptoDaysPerEngineer / quarterWorkingDays) * workingDays
    : 0;

  // Adjust working days for PTO
  const adjustedWorkingDays = Math.max(0, workingDays - ptoDaysThisSprint);

  // Formula: engineers × (working_days - pto) × dev_focus_factor
  return numEngineers * adjustedWorkingDays * devFocusFactor;
}

/**
 * Get previous sprint in sequence for comparison
 */
export function getPreviousSprint(
  currentSprint: Sprint,
  allSprints: Sprint[]
): Sprint | null {
  const sorted = allSprints
    .filter(s => s.quarterId === currentSprint.quarterId)
    .sort((a, b) => a.sprintNumber - b.sprintNumber);

  const currentIndex = sorted.findIndex(s => s.id === currentSprint.id);
  return currentIndex > 0 ? sorted[currentIndex - 1] : null;
}

/**
 * Calculate total allocated capacity per sprint for a team
 */
export function calculateSprintAllocatedCapacity(
  sprintId: string,
  allocations: SprintAllocation[]
): number {
  return allocations
    .filter(a => a.sprintId === sprintId)
    .reduce((sum, a) => sum + a.plannedDays, 0);
}
