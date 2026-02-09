'use client';

import { useState } from 'react';
import { SprintAllocation } from '@/types';
import PhaseIndicator from './PhaseIndicator';

interface SprintCellProps {
  allocation: SprintAllocation | undefined;
  previousSprintActual: number | null;
  onClick: () => void;
  showActual?: boolean;
  projectId: string;
  sprintId: string;
  onMoveAllocation?: (fromSprintId: string, toSprintId: string, projectId: string) => void;
}

export default function SprintCell({
  allocation,
  previousSprintActual,
  onClick,
  showActual = true,
  projectId,
  sprintId,
  onMoveAllocation,
}: SprintCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const showOverCapacityWarning =
    previousSprintActual &&
    allocation?.actualDays &&
    allocation.actualDays > previousSprintActual * 1.2;

  const handleDragStart = (e: React.DragEvent) => {
    if (!allocation) return;
    e.stopPropagation();

    // Store the allocation data in the drag event
    e.dataTransfer.setData('application/json', JSON.stringify({
      projectId,
      sprintId,
      allocation,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { projectId: draggedProjectId, sprintId: fromSprintId } = data;

      // Don't do anything if dropping on the same sprint
      if (fromSprintId === sprintId) return;

      // Only allow moving allocations for the same project
      if (draggedProjectId !== projectId) return;

      // Call the move handler
      if (onMoveAllocation) {
        onMoveAllocation(fromSprintId, sprintId, projectId);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <>
      {/* Planned Cell */}
      <td
        className={`sprint-cell cursor-pointer hover:bg-blue-50 transition-colors ${
          isDragOver ? 'ring-2 ring-blue-500 bg-blue-100' : ''
        }`}
        onClick={onClick}
        draggable={!!allocation}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-1 py-2">
          {/* Phase Badge */}
          {allocation && (
            <div className="flex justify-center">
              <PhaseIndicator phase={allocation.phase} />
            </div>
          )}

          {/* Days and Engineers */}
          {allocation?.plannedDays ? (
            <div className="text-center group">
              <div className="text-blue-600 font-semibold">
                {allocation.plannedDays.toFixed(1)}d
              </div>
              {allocation.numEngineers > 0 && (
                <div className="text-xs text-gray-600">
                  ({allocation.numEngineers} eng)
                </div>
              )}
              {allocation.engineersAssigned && (
                <div className="text-xs text-gray-500 truncate max-w-[120px]" title={allocation.engineersAssigned}>
                  {allocation.engineersAssigned}
                </div>
              )}
              <div className="flex items-center justify-center gap-1 mt-1">
                {allocation.isManualOverride && (
                  <div className="text-xs text-orange-600" title="Manual override">
                    ✏️
                  </div>
                )}
                <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Drag to move to another sprint">
                  ⋮⋮
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">Click to plan</div>
          )}
        </div>
      </td>

      {/* Actual Cell - Only show for past/current sprints */}
      {showActual && (
        <td
          className="sprint-cell cursor-pointer hover:bg-green-50 transition-colors"
          onClick={onClick}
        >
          <div className="space-y-1 py-2">
            {allocation?.actualDays && allocation.actualDays > 0 ? (
              <div className="text-center">
                <div className="text-green-600 font-semibold">
                  {allocation.actualDays.toFixed(1)}d
                </div>
                {showOverCapacityWarning && (
                  <div className="text-xs text-red-600 font-semibold" title="Over capacity compared to previous sprint">
                    ⚠️ +20%
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400">-</div>
            )}
          </div>
        </td>
      )}
    </>
  );
}


