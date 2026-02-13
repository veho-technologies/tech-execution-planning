'use client';

import { useState, useEffect } from 'react';
import { Project, Sprint, Quarter, SprintAllocation, ProjectPhase, Holiday, ALL_PHASES, parsePhases, serializePhases } from '@/types';
import { calculateSprintAllocationDays } from '@/lib/capacity';
import PhaseIndicator from './PhaseIndicator';
import { X } from 'lucide-react';

interface SprintAllocationModalProps {
  project: Project;
  sprint: Sprint;
  quarter: Quarter;
  holidays: Holiday[];
  allocation: SprintAllocation | undefined;
  previousSprintActual: number | null;
  ptoDaysPerEngineer?: number;
  onClose: () => void;
  onSave: () => void;
}

export default function SprintAllocationModal({
  project,
  sprint,
  quarter,
  holidays,
  allocation,
  previousSprintActual,
  ptoDaysPerEngineer = 0,
  onClose,
  onSave,
}: SprintAllocationModalProps) {
  const [selectedPhases, setSelectedPhases] = useState<ProjectPhase[]>(
    allocation?.phase ? parsePhases(allocation.phase) : ['Execution']
  );
  const [sprintGoal, setSprintGoal] = useState(allocation?.sprintGoal || '');
  const [numEngineers, setNumEngineers] = useState(allocation?.numEngineers || 0);
  const [engineersAssigned, setEngineersAssigned] = useState(allocation?.engineersAssigned || '');
  const [plannedDays, setPlannedDays] = useState(allocation?.plannedDays || 0);
  const [description, setDescription] = useState(allocation?.plannedDescription || '');
  const [isManualOverride, setIsManualOverride] = useState(allocation?.isManualOverride || false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate suggested days based on num_engineers
  const calculatedDays = calculateSprintAllocationDays(numEngineers, sprint, quarter, holidays, ptoDaysPerEngineer);

  // Update planned days when num_engineers changes
  // Changing num_engineers always recalculates and clears manual override
  useEffect(() => {
    setPlannedDays(calculatedDays);
    setIsManualOverride(false);
  }, [numEngineers, calculatedDays]);

  const handleSave = async () => {
    // Warn if manual override creates misaligned engineer/day ratio
    if (isManualOverride && numEngineers > 0) {
      const expectedDays = calculatedDays;
      const deviation = Math.abs(plannedDays - expectedDays);
      const percentDeviation = (deviation / expectedDays) * 100;

      if (percentDeviation > 10) {
        const confirmed = window.confirm(
          `⚠️ Manual override detected!\n\n` +
          `${numEngineers} engineers should auto-calculate to ${expectedDays.toFixed(1)} days.\n` +
          `You've set ${plannedDays.toFixed(1)} days (${percentDeviation.toFixed(0)}% off).\n\n` +
          `This will cause capacity math to not add up correctly.\n\n` +
          `Click "Use Calculated" button to fix, or OK to save anyway.`
        );
        if (!confirmed) {
          setIsSaving(false);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          sprint_id: sprint.id,
          phase: serializePhases(selectedPhases),
          sprint_goal: sprintGoal || null,
          num_engineers: numEngineers,
          engineers_assigned: engineersAssigned || null,
          planned_days: plannedDays,
          actual_days: allocation?.actualDays || 0,
          planned_description: description || null,
          is_manual_override: isManualOverride,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save allocation');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving allocation:', error);
      alert('Failed to save allocation. Please try again.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sprint Allocation Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {project.id} - {sprint.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Phase Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Auto-Calculated Days
                </label>
                <div className="text-3xl font-bold text-blue-700">
                  {calculatedDays.toFixed(1)} days
                </div>
                {(() => {
                  const startDate = new Date(sprint.startDate);
                  const endDate = new Date(sprint.endDate);
                  const holidayDates = holidays
                    .filter(h => {
                      const hDate = new Date(h.holidayDate);
                      return hDate >= startDate && hDate <= endDate;
                    });

                  // Calculate working days (approximate - excluding weekends)
                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const weeks = totalDays / 7;
                  const workingDays = Math.round(weeks * 5 - holidayDates.length);
                  const devFocusFactor = 1 - quarter.meetingTimePercentage;

                  return (
                    <div className="text-xs text-blue-700 mt-2 space-y-1">
                      <div className="font-mono">
                        = {numEngineers} eng × {workingDays} days × {(devFocusFactor * 100).toFixed(0)}% focus
                      </div>
                      <div className="text-blue-600">
                        Sprint: {totalDays} total days ({workingDays} working)
                        {holidayDates.length > 0 && ` - ${holidayDates.length} holiday(s)`}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Planned Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planned Days
                  {isManualOverride && (
                    <span className="ml-2 text-xs text-orange-600 font-semibold">
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
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
                    >
                      Use Calculated
                    </button>
                  )}
                </div>
                {isManualOverride && numEngineers > 0 && Math.abs(plannedDays - calculatedDays) > 0.5 && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                    ⚠️ Manual override: Expected {calculatedDays.toFixed(1)}d for {numEngineers} eng.
                    This breaks capacity math!
                  </div>
                )}
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

              {/* Actual Days - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Days (from Linear)
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                  {allocation?.actualDays && allocation.actualDays > 0
                    ? `${allocation.actualDays.toFixed(1)} days`
                    : 'Not tracked yet'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Add "Actual: X days" in Linear comments to track
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional notes or context"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
