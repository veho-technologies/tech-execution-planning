'use client';

import { useState, useEffect } from 'react';
import { Project, Sprint, Quarter, SprintAllocation, ProjectPhase, Holiday, ALL_PHASES, parsePhases, serializePhases } from '@/types';
import { calculateSprintAllocationDays } from '@/lib/capacity';
import PhaseIndicator from './PhaseIndicator';

interface SprintAllocationDetailRowProps {
  project: Project;
  sprint: Sprint;
  quarter: Quarter;
  holidays: Holiday[];
  allocation: SprintAllocation | undefined;
  previousSprintActual: number | null;
  onUpdate: (allocation: Partial<SprintAllocation>) => Promise<void>;
  onClose: () => void;
}

export default function SprintAllocationDetailRow({
  project,
  sprint,
  quarter,
  holidays,
  allocation,
  previousSprintActual,
  onUpdate,
  onClose,
}: SprintAllocationDetailRowProps) {
  const [selectedPhases, setSelectedPhases] = useState<ProjectPhase[]>(
    allocation?.phase ? parsePhases(allocation.phase) : ['Execution']
  );
  const [sprintGoal, setSprintGoal] = useState(allocation?.sprint_goal || '');
  const [numEngineers, setNumEngineers] = useState(allocation?.num_engineers || 0);
  const [engineersAssigned, setEngineersAssigned] = useState(allocation?.engineers_assigned || '');
  const [plannedDays, setPlannedDays] = useState(allocation?.planned_days || 0);
  const [actualDays, setActualDays] = useState(allocation?.actual_days || 0);
  const [description, setDescription] = useState(allocation?.planned_description || '');
  const [isManualOverride, setIsManualOverride] = useState(allocation?.is_manual_override || false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate suggested days based on num_engineers
  const calculatedDays = calculateSprintAllocationDays(numEngineers, sprint, quarter, holidays);

  // Update planned days when num_engineers changes (if not manual override)
  useEffect(() => {
    if (!isManualOverride) {
      setPlannedDays(calculatedDays);
    }
  }, [numEngineers, calculatedDays, isManualOverride]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        project_id: project.id,
        sprint_id: sprint.id,
        phase: serializePhases(selectedPhases),
        sprint_goal: sprintGoal || null,
        num_engineers: numEngineers,
        engineers_assigned: engineersAssigned || null,
        planned_days: plannedDays,
        actual_days: actualDays,
        planned_description: description || null,
        is_manual_override: isManualOverride,
      });
      onClose();
    } catch (error) {
      console.error('Error saving allocation:', error);
      alert('Failed to save allocation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseCalculated = () => {
    setPlannedDays(calculatedDays);
    setIsManualOverride(false);
  };

  const handleManualPlannedChange = (value: number) => {
    setPlannedDays(value);
    setIsManualOverride(true);
  };

  const showOverCapacityWarning = previousSprintActual && plannedDays > previousSprintActual * 1.2;

  return (
    <div className="bg-gray-50 border-t-2 border-b-2 border-blue-300 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              Sprint Allocation Details
            </h3>
            <p className="text-sm text-gray-600">
              {project.id} - {sprint.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Phase Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Phase(s)
              </label>
              <div className="space-y-2">
                {ALL_PHASES.map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPhases.includes(p)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPhases([...selectedPhases, p]);
                        } else {
                          const next = selectedPhases.filter(sp => sp !== p);
                          if (next.length > 0) setSelectedPhases(next);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <PhaseIndicator phase={p} />
                  </label>
                ))}
              </div>
            </div>

            {/* Sprint Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sprint Goal (Optional)
              </label>
              <textarea
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="e.g., Complete user authentication flow"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Engineer Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Engineers
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={numEngineers}
                onChange={(e) => setNumEngineers(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engineer Names (comma-separated)
              </label>
              <input
                type="text"
                value={engineersAssigned}
                onChange={(e) => setEngineersAssigned(e.target.value)}
                placeholder="e.g., Alice, Bob, Charlie"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Calculated Days */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <label className="block text-sm font-medium text-blue-900 mb-1">
                Auto-Calculated Days
              </label>
              <div className="text-2xl font-bold text-blue-700">
                {calculatedDays.toFixed(1)} days
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {numEngineers} engineers × sprint days × dev focus factor
              </div>
            </div>

            {/* Planned Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Days
                {isManualOverride && (
                  <span className="ml-2 text-xs text-orange-600">
                    ✏️ Manual Override
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={plannedDays}
                  onChange={(e) => handleManualPlannedChange(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isManualOverride && (
                  <button
                    onClick={handleUseCalculated}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                  >
                    Use Calculated
                  </button>
                )}
              </div>
            </div>

            {/* Previous Sprint Comparison */}
            {previousSprintActual !== null && (
              <div className={`border rounded-md p-3 ${showOverCapacityWarning ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-sm font-medium text-gray-700">
                  Previous Sprint Actual: {previousSprintActual.toFixed(1)} days
                </div>
                {showOverCapacityWarning && (
                  <div className="text-sm text-red-600 font-semibold mt-1">
                    ⚠️ Planned is 20%+ over previous actual
                  </div>
                )}
              </div>
            )}

            {/* Actual Days - Read Only (from Linear) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Days (from Linear)
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                {actualDays > 0 ? `${actualDays.toFixed(1)} days` : 'Not tracked yet'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Add "Actual: X days" in Linear comments to track
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional notes or context"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
