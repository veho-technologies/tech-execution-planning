'use client';

import React, { useState } from 'react';
import { Trash2, GripVertical, Info } from 'lucide-react';
import { Project, Sprint, SprintAllocation, Quarter, Team, Holiday } from '@/types';
import { calculateSprintAllocationDays, calculateSprintAllocatedCapacity, getPreviousSprint } from '@/lib/capacity';
import { parseISO, isWithinInterval, isBefore, isAfter, format } from 'date-fns';
import SprintCell from './SprintCell';
import SprintAllocationModal from './SprintAllocationModal';
import DateUpdateModal from './DateUpdateModal';
import ProjectFieldUpdateModal from './ProjectFieldUpdateModal';
import UnplannedWorkIndicator from './UnplannedWorkIndicator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableProjectRowProps {
  project: Project;
  sprints: Sprint[];
  allocations: SprintAllocation[];
  linearData: Record<string, any>;
  quarter: Quarter;
  team: Team;
  holidays: Holiday[];
  getAllocation: (projectId: string, sprintId: string) => SprintAllocation | undefined;
  getProjectTotal: (projectId: string, field: 'planned' | 'actual') => number;
  getProjectData: (project: Project) => any;
  getSprintStatus: (sprint: Sprint) => 'past' | 'current' | 'future';
  getPreviousSprint: (sprint: Sprint, sprints: Sprint[]) => Sprint | null;
  handleDeleteProject: (project: Project, title: string) => void;
  handlePlannedWeeksUpdate: (projectId: string, weeks: number) => void;
  handleMoveAllocation: (fromSprintId: string, toSprintId: string, projectId: string) => void;
  setModalOpen: (data: any) => void;
  setDateModalOpen: (data: any) => void;
  setFieldModalOpen: (data: any) => void;
  teamId: string;
}

function SortableProjectRow({
  project,
  sprints,
  allocations,
  linearData,
  quarter,
  team,
  holidays,
  getAllocation,
  getProjectTotal,
  getProjectData,
  getSprintStatus,
  getPreviousSprint,
  handleDeleteProject,
  handlePlannedWeeksUpdate,
  handleMoveAllocation,
  setModalOpen,
  setDateModalOpen,
  setFieldModalOpen,
  teamId,
}: SortableProjectRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalPlanned = getProjectTotal(project.id, 'planned');
  const totalActual = getProjectTotal(project.id, 'actual');
  const projectData = getProjectData(project);
  const remaining = totalPlanned - totalActual;

  return (
    <tr ref={setNodeRef} style={style} className="project-row">
      <td className="project-name-cell sticky left-0 bg-white z-10">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteProject(project, projectData.title)}
            className="text-gray-400 hover:text-red-600 flex-shrink-0 transition-colors"
            title="Remove project from this quarter"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span className="font-medium text-gray-900 truncate text-sm">
            {projectData.title}
          </span>
          {projectData.isLinked && (
            <a
              href={projectData.linearUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 text-xs flex-shrink-0"
              title="View in Linear"
            >
              ↗
            </a>
          )}
        </div>
      </td>
      <td
        className="metadata-cell text-center cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={() => setFieldModalOpen({
          project,
          projectData,
          fieldType: 'priority',
          currentValue: projectData.priority,
        })}
        title="Click to edit priority"
      >
        <span className={`priority-${projectData.priority} text-[10px] font-bold`}>
          P{projectData.priority || 'N'}
        </span>
      </td>
      <td
        className="metadata-cell cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={() => setFieldModalOpen({
          project,
          projectData,
          fieldType: 'status',
          currentValue: projectData.status,
        })}
        title="Click to edit status"
      >
        <span className="inline-block px-1 py-0.5 text-[10px] rounded bg-gray-100 text-gray-700 truncate max-w-full">
          {projectData.status || '-'}
        </span>
      </td>
      <td className="metadata-cell text-gray-600 truncate">
        {projectData.assignee ? projectData.assignee.split(' ')[0] : '-'}
      </td>
      <td className="metadata-cell text-center font-semibold text-blue-600">
        {projectData.progress ? `${Math.round(projectData.progress * 100)}` : '-'}
      </td>
      <td
        className="metadata-cell text-center text-gray-600 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
        onClick={() => setDateModalOpen({ project, projectData, dateType: 'start' })}
        title="Click to edit start date"
      >
        {projectData.startDate ? format(parseISO(projectData.startDate), 'M/d/yy') : '-'}
      </td>
      <td
        className="metadata-cell text-center text-gray-600 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
        onClick={() => setDateModalOpen({ project, projectData, dateType: 'target' })}
        title="Click to edit target date"
      >
        {projectData.targetDate ? format(parseISO(projectData.targetDate), 'M/d/yy') : '-'}
      </td>
      <td className="metadata-cell text-center">
        <input
          type="number"
          defaultValue={project.plannedWeeks || ''}
          onBlur={(e) => {
            const weeks = parseFloat(e.target.value);
            if (!isNaN(weeks) && weeks >= 0) {
              handlePlannedWeeksUpdate(project.id, weeks);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          placeholder="0"
          className="w-full text-center font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
          title="Planned capacity in weeks (press Enter or click away to save)"
          step="0.5"
          min="0"
        />
      </td>
      <td className="metadata-cell text-center">
        <div className="font-semibold text-blue-600">
          {totalPlanned.toFixed(1)}
        </div>
        {project.plannedWeeks && project.plannedWeeks > 0 && (
          (() => {
            const plannedDays = project.plannedWeeks * 5;
            const delta = totalPlanned - plannedDays;
            const percentDiff = plannedDays > 0 ? Math.abs(delta / plannedDays) * 100 : 0;

            // Determine color and icon based on difference
            let textColor = 'text-green-700';
            let icon = '✓';

            if (Math.abs(delta) < 0.5) {
              icon = '✓';
            } else if (delta > 0) {
              // Over-allocated
              if (percentDiff > 20) {
                textColor = 'text-red-700';
                icon = '↑↑';
              } else if (percentDiff > 5) {
                textColor = 'text-orange-700';
                icon = '↑';
              } else {
                textColor = 'text-yellow-700';
                icon = '↑';
              }
            } else {
              // Under-allocated
              if (percentDiff > 20) {
                textColor = 'text-blue-700';
                icon = '↓↓';
              } else if (percentDiff > 5) {
                textColor = 'text-blue-600';
                icon = '↓';
              } else {
                textColor = 'text-yellow-700';
                icon = '↓';
              }
            }

            return (
              <div
                className={`text-[9px] ${textColor} font-medium`}
                title={`Target: ${plannedDays.toFixed(1)}d (${project.plannedWeeks}w)\nAllocated: ${totalPlanned.toFixed(1)}d\nDelta: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}d (${delta >= 0 ? '+' : ''}${percentDiff.toFixed(1)}%)`}
              >
                {icon} {delta >= 0 ? '+' : ''}{delta.toFixed(1)}d
              </div>
            );
          })()
        )}
      </td>
      <td className="metadata-cell text-center font-semibold text-green-600">
        {totalActual.toFixed(1)}
      </td>
      <td className="metadata-cell text-center font-semibold text-orange-600">
        {remaining.toFixed(1)}
      </td>
      {sprints.map(sprint => {
        const allocation = getAllocation(project.id, sprint.id);
        const prevSprint = getPreviousSprint(sprint, sprints);
        const prevAllocation = prevSprint ? getAllocation(project.id, prevSprint.id) : null;

        return (
          <SprintCell
            key={sprint.id}
            allocation={allocation}
            previousSprintActual={prevAllocation?.actualDays || null}
            showActual={getSprintStatus(sprint) === 'past'}
            projectId={project.id}
            sprintId={sprint.id}
            onMoveAllocation={handleMoveAllocation}
            onClick={() => setModalOpen({
              project,
              sprint,
              allocation,
              previousSprintActual: prevAllocation?.actualDays || null,
            })}
          />
        );
      })}
    </tr>
  );
}

interface ExecutionTableProps {
  projects: Project[];
  sprints: Sprint[];
  allocations: SprintAllocation[];
  linearData: Record<string, any>;
  quarter: Quarter;
  team: Team;
  holidays: Holiday[];
  ptoDaysPerEngineer?: number;
  totalEngineers?: number;
  ktloEngineers?: number;
  meetingTimePercentage?: number | null;
  onUpdateAllocation: (allocation: Partial<SprintAllocation>) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
}

export default function ExecutionTable({
  projects,
  sprints,
  allocations,
  linearData,
  quarter,
  team,
  holidays,
  ptoDaysPerEngineer = 0,
  totalEngineers,
  ktloEngineers,
  meetingTimePercentage,
  onUpdateAllocation,
  onDeleteProject,
}: ExecutionTableProps) {
  // Use quarterly override values if provided, otherwise fall back to team defaults
  // Handle 0 as "not set" since 0 engineers doesn't make sense
  const effectiveTotalEngineers = (totalEngineers && totalEngineers > 0) ? totalEngineers : team.totalEngineers;
  const effectiveKtloEngineers = (ktloEngineers !== undefined && ktloEngineers >= 0) ? ktloEngineers : team.ktloEngineers;

  // Create effective quarter with override values for modal
  const effectiveQuarter: Quarter = meetingTimePercentage !== null && meetingTimePercentage !== undefined
    ? { ...quarter, meetingTimePercentage }
    : quarter;
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [modalOpen, setModalOpen] = useState<{
    project: Project;
    sprint: Sprint;
    allocation: SprintAllocation | undefined;
    previousSprintActual: number | null;
  } | null>(null);

  const [dateModalOpen, setDateModalOpen] = useState<{
    project: Project;
    projectData: any;
    dateType: 'start' | 'target';
  } | null>(null);

  const [fieldModalOpen, setFieldModalOpen] = useState<{
    project: Project;
    projectData: any;
    fieldType: 'priority' | 'status';
    currentValue: any;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  // Helper functions to determine sprint status
  const getSprintStatus = (sprint: Sprint): 'past' | 'current' | 'future' => {
    const today = new Date();
    const startDate = parseISO(sprint.startDate);
    const endDate = parseISO(sprint.endDate);

    if (isWithinInterval(today, { start: startDate, end: endDate })) {
      return 'current';
    } else if (isBefore(today, startDate)) {
      return 'future';
    } else {
      return 'past';
    }
  };

  const getAllocation = (projectId: string, sprintId: string): SprintAllocation | undefined => {
    return allocations.find(
      a => a.projectId === projectId && a.sprintId === sprintId
    );
  };

  const getProjectTotal = (projectId: string, field: 'planned' | 'actual'): number => {
    return allocations
      .filter(a => a.projectId === projectId)
      .reduce((sum, a) => sum + (field === 'planned' ? a.plannedDays : a.actualDays), 0);
  };


  // Calculate sprint capacity
  const getSprintCapacity = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return { total: 0, allocated: 0, remaining: 0, overCapacity: false };

    // Calculate total capacity for roadmap engineers using effective (override) values
    const roadmapEngineers = Math.max(0, effectiveTotalEngineers - effectiveKtloEngineers);
    const totalCapacity = calculateSprintAllocationDays(
      roadmapEngineers,
      sprint,
      effectiveQuarter,  // Use effectiveQuarter with override meeting time %
      holidays,
      ptoDaysPerEngineer
    );

    const allocated = calculateSprintAllocatedCapacity(sprintId, allocations);
    const remaining = totalCapacity - allocated;

    // Use a small tolerance (0.1 days) to handle floating point precision issues
    const overCapacity = remaining < -0.1;

    return {
      total: totalCapacity,
      allocated,
      remaining,
      overCapacity,
    };
  };

  // Get data from Linear (all project data comes from Linear)
  const getProjectData = (project: Project) => {
    const linearProject = linearData[project.linearIssueId];

    if (!linearProject) {
      // If Linear data isn't loaded yet, show placeholder
      return {
        title: 'Loading...',
        priority: null,
        priorityLabel: '-',
        status: '-',
        stateId: null,
        statusColor: null,
        assignee: '-',
        progress: null,
        plannedWeeks: null,
        isLinked: false,
        linearUrl: null,
        startDate: null,
        targetDate: null,
      };
    }

    return {
      title: linearProject.name,
      priority: linearProject.priority,
      priorityLabel: linearProject.priority ? `P${linearProject.priority}` : 'N/A',
      status: linearProject.state,
      stateId: linearProject.stateId,
      statusColor: null,
      assignee: linearProject.lead?.name,
      progress: linearProject.progress,
      plannedWeeks: linearProject.plannedWeeks,
      isLinked: true,
      linearUrl: linearProject.url,
      startDate: linearProject.startDate,
      targetDate: linearProject.targetDate,
    };
  };

  const handlePlannedWeeksUpdate = async (projectId: string, weeks: number) => {
    try {
      // Save planned weeks
      const saveResponse = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          planned_weeks: weeks,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save planned weeks');
      }

      // Refresh to update the comparison indicator
      await onUpdateAllocation({});
    } catch (error) {
      console.error('Error updating planned weeks:', error);
      alert(`Failed to update planned weeks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteProject = async (project: Project, projectTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${projectTitle}" from ${quarter.name}?\n\nThis will delete all sprint allocations for this project in this quarter.`
    );

    if (!confirmed) return;

    try {
      await onDeleteProject(project.id);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localProjects.findIndex((p) => p.id === active.id);
      const newIndex = localProjects.findIndex((p) => p.id === over.id);

      const newProjects = arrayMove(localProjects, oldIndex, newIndex);
      setLocalProjects(newProjects);

      // Update display_order for all projects
      const projectOrders = newProjects.map((project, index) => ({
        id: project.id,
        displayOrder: index,
      }));

      try {
        await fetch('/api/projects/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectOrders }),
        });
      } catch (error) {
        console.error('Error saving project order:', error);
        // Revert on error
        setLocalProjects(projects);
      }
    }
  };

  const handleMoveAllocation = async (fromSprintId: string, toSprintId: string, projectId: string) => {
    try {
      console.log('Moving allocation:', { projectId, fromSprintId, toSprintId });

      const response = await fetch('/api/allocations/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          from_sprint_id: fromSprintId,
          to_sprint_id: toSprintId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move allocation');
      }

      // Refresh data
      await onUpdateAllocation({});
    } catch (error) {
      console.error('Error moving allocation:', error);
      alert(`Failed to move allocation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="project-name-cell sticky left-0 bg-gray-100 z-20 font-semibold text-xs" rowSpan={2}>
              Project
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Priority (P0-P4 from Linear)">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">PRI</div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Current State/Status in Linear">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">ST</div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Project Lead/Owner from Linear">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">LEAD</div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Progress % (0-100) from Linear">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">%</div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Start Date from Linear">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">START</div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Target/End Date from Linear">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">END</div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Weeks Planned: High-level capacity estimate. Click sprint cells to allocate actual days.">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">WKS</div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Total Planned Days: Sum of sprint allocations. Badge shows comparison to WKS target.">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">PLN</div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2}>
              <div className="flex items-center justify-center gap-1">
                <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">ACT</div>
                <div
                  className="text-blue-500 hover:text-blue-700 cursor-help"
                  title="Auto-calculated from Linear 'In Progress' state. Tracks business days when issue was actively worked on. Distributes time across parallel work. Normalized by team focus factor. Click 'Sync Actuals' to update."
                >
                  <Info className="w-3 h-3" />
                </div>
              </div>
            </th>
            <th className="metadata-header cursor-help" rowSpan={2} title="Remaining Days: Planned minus Actual">
              <div className="text-gray-600 text-[10px] border-b border-dotted border-gray-400">REM</div>
            </th>
            {sprints.map(sprint => {
              const status = getSprintStatus(sprint);
              const capacity = getSprintCapacity(sprint.id);
              const headerClass = status === 'current'
                ? 'sprint-header bg-blue-100 border-2 border-blue-400 py-1'
                : status === 'past'
                ? 'sprint-header bg-gray-50 py-1'
                : 'sprint-header py-1';

              // Format dates compactly (MM/DD)
              const startDate = format(parseISO(sprint.startDate), 'M/d');
              const endDate = format(parseISO(sprint.endDate), 'M/d');

              // Calculate available roadmap engineers using effective (override) values
              const roadmapEngineers = Math.max(0, effectiveTotalEngineers - effectiveKtloEngineers);

              return (
                <th key={sprint.id} className={headerClass} colSpan={status === 'past' ? 2 : 1}>
                  <div className={`text-xs leading-tight ${status === 'current' ? 'font-bold text-blue-900' : 'font-semibold'}`}>
                    {sprint.name}{status === 'current' && ' ●'}
                  </div>
                  <div className={`text-[9px] ${status === 'current' ? 'text-blue-700' : 'text-gray-500'}`}>
                    {startDate}-{endDate}
                  </div>
                  <div className={`text-[9px] ${capacity.overCapacity ? 'text-red-600' : 'text-green-600'} font-semibold`}>
                    {capacity.allocated.toFixed(1)}/{capacity.total.toFixed(1)}d ({capacity.remaining >= 0 ? '+' : ''}{capacity.remaining.toFixed(1)})
                  </div>
                </th>
              );
            })}
          </tr>
          <tr>
            {sprints.map(sprint => {
              const status = getSprintStatus(sprint);
              return (
                <React.Fragment key={`${sprint.id}-headers`}>
                  <th className="sprint-header text-blue-600 text-[10px] py-0.5">
                    Plan
                  </th>
                  {status === 'past' && (
                    <th className="sprint-header text-green-600 text-[10px] py-0.5">
                      Act
                    </th>
                  )}
                </React.Fragment>
              );
            })}
          </tr>
        </thead>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localProjects.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {localProjects.length === 0 ? (
                <tr>
                  <td colSpan={11 + sprints.length * 2} className="text-center py-12 text-gray-500">
                    No projects found. Import projects from Linear to get started.
                  </td>
                </tr>
              ) : (
                <>
                  {localProjects.map(project => (
                    <SortableProjectRow
                      key={project.id}
                      project={project}
                      sprints={sprints}
                      allocations={allocations}
                      linearData={linearData}
                      quarter={quarter}
                      team={team}
                      holidays={holidays}
                      getAllocation={getAllocation}
                      getProjectTotal={getProjectTotal}
                      getProjectData={getProjectData}
                      getSprintStatus={getSprintStatus}
                      getPreviousSprint={getPreviousSprint}
                      handleDeleteProject={handleDeleteProject}
                      handlePlannedWeeksUpdate={handlePlannedWeeksUpdate}
                      handleMoveAllocation={handleMoveAllocation}
                      setModalOpen={setModalOpen}
                      setDateModalOpen={setDateModalOpen}
                      setFieldModalOpen={setFieldModalOpen}
                      teamId={team.id}
                    />
                  ))}
                  {/* Summary Row */}
                  <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                    <td className="project-name-cell sticky left-0 bg-gray-50 z-10 text-gray-700 py-2">
                      TOTAL ({localProjects.length} projects)
                    </td>
                    <td className="metadata-cell" colSpan={6}></td>
                    <td className="metadata-cell text-center text-purple-700">
                      {localProjects.reduce((sum, p) => sum + (p.plannedWeeks || 0), 0).toFixed(1)}
                    </td>
                    <td
                      className="metadata-cell text-center text-blue-700"
                      title={(() => {
                        const totalPlannedDays = localProjects.reduce((sum, p) => sum + getProjectTotal(p.id, 'planned'), 0);
                        const totalPlannedWeeks = localProjects.reduce((sum, p) => sum + (p.plannedWeeks || 0), 0);
                        const targetDays = totalPlannedWeeks * 5;
                        const delta = totalPlannedDays - targetDays;
                        return totalPlannedWeeks > 0 ? `Target: ${targetDays.toFixed(1)}d\nDelta: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}d` : '';
                      })()}
                    >
                      {localProjects.reduce((sum, p) => sum + getProjectTotal(p.id, 'planned'), 0).toFixed(1)}
                    </td>
                    <td className="metadata-cell text-center text-green-700">
                      {localProjects.reduce((sum, p) => sum + getProjectTotal(p.id, 'actual'), 0).toFixed(1)}
                    </td>
                    <td className="metadata-cell text-center text-orange-700">
                      {localProjects.reduce((sum, p) => {
                        const planned = getProjectTotal(p.id, 'planned');
                        const actual = getProjectTotal(p.id, 'actual');
                        return sum + (planned - actual);
                      }, 0).toFixed(1)}
                    </td>
                    {sprints.map(sprint => {
                      const sprintTotal = localProjects.reduce((sum, p) => {
                        const alloc = getAllocation(p.id, sprint.id);
                        return sum + (alloc?.plannedDays || 0);
                      }, 0);
                      const sprintEngineers = localProjects.reduce((sum, p) => {
                        const alloc = getAllocation(p.id, sprint.id);
                        return sum + (alloc?.numEngineers || 0);
                      }, 0);
                      const sprintActual = localProjects.reduce((sum, p) => {
                        const alloc = getAllocation(p.id, sprint.id);
                        return sum + (alloc?.actualDays || 0);
                      }, 0);
                      const status = getSprintStatus(sprint);

                      const roadmapEngineers = Math.max(0, effectiveTotalEngineers - effectiveKtloEngineers);

                      return (
                        <React.Fragment key={`total-${sprint.id}`}>
                          <td className="metadata-cell text-center">
                            {sprintTotal > 0 ? (
                              <div>
                                <div className="font-semibold text-blue-700">
                                  {sprintTotal.toFixed(1)}d
                                </div>
                                <div className="text-[9px] text-gray-600">
                                  {sprintEngineers.toFixed(1)}/{roadmapEngineers.toFixed(1)}e
                                </div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          {status === 'past' && (
                            <td className="metadata-cell text-center text-green-700">
                              {sprintActual > 0 ? `${sprintActual.toFixed(1)}d` : '-'}
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                  {/* Unplanned Work Row - Only show for past sprints */}
                  <tr className="bg-blue-50 border-t border-gray-300">
                    <td className="project-name-cell sticky left-0 bg-blue-50 z-10 text-gray-700 text-xs font-semibold">
                      Unplanned Work
                    </td>
                    <td className="metadata-cell" colSpan={10}></td>
                    {sprints.map(sprint => {
                      const status = getSprintStatus(sprint);
                      const isPast = status === 'past';
                      const capacity = getSprintCapacity(sprint.id);

                      return (
                        <React.Fragment key={`unplanned-${sprint.id}`}>
                          <td className="metadata-cell" colSpan={isPast ? 2 : 1}>
                            {isPast && team.linearTeamId ? (
                              <UnplannedWorkIndicator
                                sprint={sprint}
                                teamId={team.linearTeamId}
                                excludeProjectIds={localProjects.map(p => p.linearIssueId)}
                                sprintCapacity={capacity.total}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </>
              )}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>

      {/* Sprint Allocation Modal */}
      {modalOpen && (
        <SprintAllocationModal
          project={modalOpen.project}
          sprint={modalOpen.sprint}
          quarter={effectiveQuarter}
          holidays={holidays}
          allocation={modalOpen.allocation}
          previousSprintActual={modalOpen.previousSprintActual}
          ptoDaysPerEngineer={ptoDaysPerEngineer}
          onClose={() => setModalOpen(null)}
          onSave={async () => {
            await onUpdateAllocation({});
            setModalOpen(null);
          }}
        />
      )}

      {/* Date Update Modal */}
      {dateModalOpen && (
        <DateUpdateModal
          projectId={dateModalOpen.project.linearIssueId}
          projectName={dateModalOpen.projectData.title}
          dateType={dateModalOpen.dateType}
          currentDate={
            dateModalOpen.dateType === 'start'
              ? dateModalOpen.projectData.startDate
              : dateModalOpen.projectData.targetDate
          }
          onClose={() => setDateModalOpen(null)}
          onSave={async () => {
            await onUpdateAllocation({});
            setDateModalOpen(null);
          }}
        />
      )}

      {/* Field Update Modal (Priority/Status) */}
      {fieldModalOpen && team.linearTeamId && (
        <ProjectFieldUpdateModal
          projectId={fieldModalOpen.project.linearIssueId}
          projectName={fieldModalOpen.projectData.title}
          fieldType={fieldModalOpen.fieldType}
          currentValue={fieldModalOpen.currentValue}
          teamId={team.linearTeamId}
          onClose={() => setFieldModalOpen(null)}
          onSave={async () => {
            await onUpdateAllocation({});
            setFieldModalOpen(null);
          }}
        />
      )}
    </div>
  );
}

