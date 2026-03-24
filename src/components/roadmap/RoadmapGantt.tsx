'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Project, Sprint, SprintAllocation, Quarter, ProjectPhase, parsePhases } from '@/types';
import { parseISO, format, startOfWeek, addWeeks, isWithinInterval, getISOWeek, differenceInBusinessDays } from 'date-fns';
import { getStatusColor } from '@/lib/status-colors';

interface RoadmapGanttProps {
  projects: Project[];
  allProjectInstances: Project[]; // non-deduplicated, for allocation lookups across quarters
  sprints: Sprint[];
  allocations: SprintAllocation[];
  linearData: Record<string, any>;
  startDate: string;
  endDate: string;
  quarters: Quarter[];
}

const WEEK_COL_WIDTH = 56;
const LEFT_PANEL_WIDTH = 300;

const PHASE_CONFIG: Record<ProjectPhase, { bar: string; text: string; indicator: string }> = {
  'Tech Spec': { bar: 'bg-purple-500', text: 'text-white', indicator: 'bg-purple-100 text-purple-800' },
  'Execution': { bar: 'bg-blue-500', text: 'text-white', indicator: 'bg-blue-100 text-blue-800' },
  'Developer Testing': { bar: 'bg-yellow-500', text: 'text-gray-900', indicator: 'bg-yellow-100 text-yellow-800' },
  'UAT': { bar: 'bg-orange-500', text: 'text-white', indicator: 'bg-orange-100 text-orange-800' },
  'Rollout': { bar: 'bg-green-500', text: 'text-white', indicator: 'bg-green-100 text-green-800' },
};



interface WeekColumn {
  weekStart: Date;
  weekEnd: Date;
  isoWeek: number;
  month: string;
  year: string;
  dateLabel: string;
  isCurrent: boolean;
  quarterLabel?: string; // set on first week of each quarter
}

interface PhaseBar {
  phase: ProjectPhase;
  startWeekIdx: number;
  endWeekIdx: number;
}

function generateWeeks(startDate: string, endDate: string, quarters: Quarter[]): WeekColumn[] {
  const start = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
  const end = parseISO(endDate);
  const today = new Date();
  const weeks: WeekColumn[] = [];

  // Build quarter boundary map
  const quarterBoundaries = quarters.map(q => ({
    label: q.name,
    start: parseISO(q.startDate),
  })).sort((a, b) => a.start.getTime() - b.start.getTime());

  let current = start;
  while (current <= end) {
    const weekEnd = addWeeks(current, 1);

    // Check if this week contains a quarter start
    let quarterLabel: string | undefined;
    for (const qb of quarterBoundaries) {
      if (current <= qb.start && weekEnd > qb.start) {
        quarterLabel = qb.label;
        break;
      }
    }

    weeks.push({
      weekStart: current,
      weekEnd,
      isoWeek: getISOWeek(current),
      month: format(current, 'MMM'),
      year: format(current, 'yy'),
      dateLabel: format(current, 'M/d'),
      isCurrent: isWithinInterval(today, { start: current, end: weekEnd }),
      quarterLabel,
    });
    current = weekEnd;
  }

  return weeks;
}

function getProjectData(project: Project, linearData: Record<string, any>) {
  const ld = linearData[project.linearIssueId];
  if (!ld) return { title: 'Untitled Project', status: null, assignee: null, linearUrl: null };
  return {
    title: ld.name || 'Untitled',
    status: ld.state || ld.status || null,
    assignee: (typeof ld.lead === 'object' ? ld.lead?.name : ld.lead) || null,
    linearUrl: ld.url || null,
  };
}

function computePhaseBars(
  linearIssueId: string,
  projectIdsByLinearId: Map<string, string[]>,
  allocations: SprintAllocation[],
  sprints: Sprint[],
  weeks: WeekColumn[],
): PhaseBar[] {
  const projectIds = projectIdsByLinearId.get(linearIssueId) || [];

  const sprintMap = new Map(sprints.map(s => [s.id, s]));

  const projectAllocs = allocations
    .filter(a => projectIds.includes(a.projectId))
    .slice()
    .sort((a, b) => {
      const sprintA = sprintMap.get(a.sprintId);
      const sprintB = sprintMap.get(b.sprintId);
      return (sprintA?.startDate || '').localeCompare(sprintB?.startDate || '');
    });

  if (projectAllocs.length === 0 || weeks.length === 0) return [];

  const DAYS_PER_WEEK = 5;
  const timelineStart = weeks[0].weekStart;

  // Convert a Date to a working-day offset from timeline start
  function toWorkingDay(date: Date): number {
    return Math.max(0, differenceInBusinessDays(date, timelineStart));
  }

  // Phase segments: each has a start (working day) and duration (working days)
  interface PhaseSegment {
    phase: ProjectPhase;
    startDay: number;
    durationDays: number;
  }

  const segments: PhaseSegment[] = [];
  let runningDay = 0; // tracks where the next segment starts for this project

  for (const alloc of projectAllocs) {
    const sprint = sprintMap.get(alloc.sprintId);
    if (!sprint) continue;

    const sprintStartDay = toWorkingDay(parseISO(sprint.startDate));
    const phases = parsePhases(alloc.phase);
    const totalDays = Math.max(1, alloc.plannedDays); // use planned_days directly as working days

    // Start from sprint start or where previous segment ended, whichever is later
    let currentDay = Math.max(sprintStartDay, runningDay);

    if (phases.length === 1) {
      segments.push({ phase: phases[0], startDay: currentDay, durationDays: totalDays });
      currentDay += totalDays;
    } else {
      // Split days among phases proportionally
      // For "Execution,Rollout" with 4 days → Execution gets 2, Rollout gets 2
      // For "Tech Spec,Execution" with 10 days → Tech Spec gets 5, Execution gets 5
      let remaining = totalDays;
      for (let pi = 0; pi < phases.length; pi++) {
        const isLast = pi === phases.length - 1;
        const phaseDays = isLast ? remaining : Math.max(1, Math.round(totalDays / phases.length));
        segments.push({ phase: phases[pi], startDay: currentDay, durationDays: phaseDays });
        currentDay += phaseDays;
        remaining -= phaseDays;
      }
    }

    runningDay = currentDay;
  }

  if (segments.length === 0) return [];

  // Merge adjacent segments with the same phase (e.g., Execution from end of one sprint + Execution at start of next)
  const merged: PhaseSegment[] = [{ ...segments[0] }];
  for (let i = 1; i < segments.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = segments[i];
    // Merge if same phase and contiguous (gap <= 1 day)
    if (curr.phase === prev.phase && curr.startDay <= prev.startDay + prev.durationDays + 1) {
      prev.durationDays = (curr.startDay + curr.durationDays) - prev.startDay;
    } else {
      merged.push({ ...curr });
    }
  }

  // Convert day-based segments to week-index PhaseBars
  const bars: PhaseBar[] = [];
  for (const seg of merged) {
    const startWeekIdx = Math.floor(Math.round(seg.startDay) / DAYS_PER_WEEK);
    const endDay = Math.round(seg.startDay + seg.durationDays - 1);
    const endWeekIdx = Math.max(startWeekIdx, Math.floor(endDay / DAYS_PER_WEEK));

    const clampedStart = Math.max(0, Math.min(startWeekIdx, weeks.length - 1));
    const clampedEnd = Math.max(0, Math.min(endWeekIdx, weeks.length - 1));

    bars.push({ phase: seg.phase, startWeekIdx: clampedStart, endWeekIdx: clampedEnd });
  }

  return bars;
}

export default function RoadmapGantt({ projects, allProjectInstances, sprints, allocations, linearData, startDate, endDate, quarters }: RoadmapGanttProps) {
  const weeks = useMemo(() => generateWeeks(startDate, endDate, quarters), [startDate, endDate, quarters]);

  // Group weeks by month+year for the header
  const monthGroups = useMemo(() => {
    const groups: { label: string; startIdx: number; count: number }[] = [];
    for (let i = 0; i < weeks.length; i++) {
      const label = `${weeks[i].month} '${weeks[i].year}`;
      if (groups.length > 0 && groups[groups.length - 1].label === label) {
        groups[groups.length - 1].count++;
      } else {
        groups.push({ label, startIdx: i, count: 1 });
      }
    }
    return groups;
  }, [weeks]);

  // Find quarter boundaries for vertical lines
  const quarterBoundaryIndices = useMemo(() => {
    return weeks
      .map((w, i) => w.quarterLabel ? i : -1)
      .filter(i => i >= 0);
  }, [weeks]);

  // Pre-build linearIssueId → projectId[] map once
  const projectIdsByLinearId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of allProjectInstances) {
      const existing = map.get(p.linearIssueId);
      if (existing) {
        existing.push(p.id);
      } else {
        map.set(p.linearIssueId, [p.id]);
      }
    }
    return map;
  }, [allProjectInstances]);

  // Compute phase bars for all projects (using pre-built map)
  const projectBars = useMemo(() => {
    const map = new Map<string, PhaseBar[]>();
    for (const project of projects) {
      map.set(
        project.id,
        computePhaseBars(project.linearIssueId, projectIdsByLinearId, allocations, sprints, weeks)
      );
    }
    return map;
  }, [projects, projectIdsByLinearId, allocations, sprints, weeks]);

  // Current phase per project
  const projectPhases = useMemo(() => {
    const map = new Map<string, ProjectPhase[]>();
    for (const project of projects) {
      const projectIds = projectIdsByLinearId.get(project.linearIssueId) || [];
      const projectAllocs = allocations.filter(a => projectIds.includes(a.projectId));
      const phases = new Set<ProjectPhase>();
      for (const alloc of projectAllocs) {
        for (const p of parsePhases(alloc.phase)) phases.add(p);
      }
      map.set(project.id, Array.from(phases));
    }
    return map;
  }, [projects, projectIdsByLinearId, allocations]);

  const totalGridWidth = weeks.length * WEEK_COL_WIDTH;

  // Find current week index for auto-scroll
  const currentWeekIdx = weeks.findIndex(w => w.isCurrent);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && currentWeekIdx > 0) {
      const scrollTarget = Math.max(0, currentWeekIdx * WEEK_COL_WIDTH - 200);
      scrollRef.current.scrollLeft = scrollTarget;
    }
  }, [currentWeekIdx, weeks]);

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto" ref={scrollRef}>
        <div className="inline-flex min-w-full">
          {/* Left panel - sticky */}
          <div
            className="sticky left-0 z-20 bg-white border-r-2 border-gray-200 flex-shrink-0"
            style={{ width: LEFT_PANEL_WIDTH }}
          >
            {/* Header */}
            <div className="border-b-2 border-gray-200">
              <div className="h-7 bg-gray-50 border-b border-gray-100 px-3 flex items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Project</span>
              </div>
              <div className="h-7 bg-gray-50 px-3 flex items-center gap-8">
                <span className="text-[10px] text-gray-400 font-medium">Lead</span>
                <span className="text-[10px] text-gray-400 font-medium">Status</span>
                <span className="text-[10px] text-gray-400 font-medium">Phase</span>
              </div>
            </div>

            {/* Project rows */}
            {projects.map(project => {
              const data = getProjectData(project, linearData);
              const phases = projectPhases.get(project.id) || [];
              return (
                <div
                  key={project.id}
                  className="h-11 px-3 flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {data.linearUrl ? (
                        <a
                          href={data.linearUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-gray-900 truncate hover:text-blue-700 hover:underline"
                          title={data.title}
                        >
                          {data.title}
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-gray-900 truncate">{data.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {data.assignee && (
                        <span className="text-[10px] text-gray-500">{data.assignee}</span>
                      )}
                      {data.status && (
                        <span className={`text-[9px] px-1 py-0 rounded font-medium leading-3 ${getStatusColor(data.status)}`}>
                          {data.status}
                        </span>
                      )}
                      {phases.length > 0 && (
                        <span className={`text-[9px] px-1 py-0 rounded font-medium leading-3 ${PHASE_CONFIG[phases[phases.length - 1]]?.indicator || 'bg-gray-100 text-gray-800'}`}>
                          {phases[phases.length - 1]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right panel - scrollable timeline */}
          <div className="flex-1" style={{ minWidth: totalGridWidth }}>
            {/* Header - Month row */}
            <div className="border-b-2 border-gray-200">
              <div className="flex h-7 bg-gray-50 border-b border-gray-100">
                {monthGroups.map((group, idx) => (
                  <div
                    key={`${group.label}-${idx}`}
                    className="flex items-center justify-center text-[11px] font-bold text-gray-600 border-r border-gray-200"
                    style={{ width: group.count * WEEK_COL_WIDTH }}
                  >
                    {group.label}
                  </div>
                ))}
              </div>

              {/* Header - Week row */}
              <div className="flex h-7 bg-gray-50">
                {weeks.map((week, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center text-[9px] border-r border-gray-100 leading-tight ${
                      week.isCurrent ? 'bg-blue-100 font-bold text-blue-700' : 'text-gray-400'
                    }`}
                    style={{ width: WEEK_COL_WIDTH }}
                  >
                    <span className="font-medium">W{week.isoWeek}</span>
                    <span>{week.dateLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project rows with Gantt bars */}
            {projects.map(project => {
              const bars = projectBars.get(project.id) || [];
              return (
                <div
                  key={project.id}
                  className="h-11 border-b border-gray-100 relative"
                  style={{ width: totalGridWidth }}
                >
                  {/* Week column grid lines + quarter boundaries */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {weeks.map((week, idx) => (
                      <div
                        key={idx}
                        className={`border-r ${
                          quarterBoundaryIndices.includes(idx) ? 'border-gray-300' : 'border-gray-50'
                        } ${week.isCurrent ? 'bg-blue-50/40' : ''}`}
                        style={{ width: WEEK_COL_WIDTH }}
                      />
                    ))}
                  </div>

                  {/* Phase bars */}
                  {bars.map((bar, barIdx) => {
                    const left = bar.startWeekIdx * WEEK_COL_WIDTH + 2;
                    const width = (bar.endWeekIdx - bar.startWeekIdx + 1) * WEEK_COL_WIDTH - 4;
                    const config = PHASE_CONFIG[bar.phase];
                    const barColor = config?.bar || 'bg-gray-400';
                    const textColor = config?.text || 'text-white';
                    const showLabel = width > 50;

                    return (
                      <div
                        key={barIdx}
                        className={`absolute top-1.5 h-8 ${barColor} ${textColor} rounded flex items-center overflow-hidden shadow-sm`}
                        style={{ left, width }}
                        title={bar.phase}
                      >
                        {showLabel && (
                          <span className="text-[10px] font-medium truncate px-1.5">
                            {bar.phase}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 px-4 py-2 flex items-center gap-4 flex-wrap bg-gray-50">
        <span className="text-[10px] text-gray-500 font-semibold uppercase">Phases:</span>
        {(Object.keys(PHASE_CONFIG) as ProjectPhase[]).map(phase => (
          <div key={phase} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${PHASE_CONFIG[phase].bar}`} />
            <span className="text-[10px] text-gray-600">{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
