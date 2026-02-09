'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProjectFieldUpdateModalProps {
  projectId: string;
  projectName: string;
  fieldType: 'priority' | 'status';
  currentValue: any;
  currentValueName?: string;
  teamId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ProjectFieldUpdateModal({
  projectId,
  projectName,
  fieldType,
  currentValue,
  currentValueName,
  teamId,
  onClose,
  onSave,
}: ProjectFieldUpdateModalProps) {
  const [newValue, setNewValue] = useState(currentValue || '');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [availableStates, setAvailableStates] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  useEffect(() => {
    if (fieldType === 'status') {
      fetchAvailableStates();
    }
  }, [fieldType]);

  const fetchAvailableStates = async () => {
    setLoadingStates(true);
    try {
      console.log('Fetching workflow states for team:', teamId);
      const response = await fetch(`/api/linear/workflow-states?team_id=${teamId}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch states');
      }

      const data = await response.json();
      console.log('Workflow states from Linear:', data);

      if (Array.isArray(data)) {
        // If we got states from Linear, use them
        if (data.length > 0) {
          console.log('Using', data.length, 'states from Linear');
          setAvailableStates(data);
        } else {
          // No states found in Linear - allow manual entry
          console.warn('No project statuses found in Linear');
          // Add current state as an option if it exists
          const states = currentValue && currentValueName ? [{ id: currentValue, name: currentValueName }] : [];
          setAvailableStates(states);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching project statuses:', error);
      // On error, at least include the current state
      const states = currentValue && currentValueName ? [{ id: currentValue, name: currentValueName }] : [];
      setAvailableStates(states);
    } finally {
      setLoadingStates(false);
    }
  };

  const handleSave = async () => {
    if (fieldType === 'status' && !newValue) {
      alert('Please select a status');
      return;
    }

    if (fieldType === 'priority' && newValue === '') {
      alert('Please select a priority');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for this change');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/linear/update-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          fieldType,
          newValue,
          oldValue: currentValue,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update field');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating field:', error);
      alert(error.message || 'Failed to update. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const priorityOptions = [
    { value: 0, label: 'No Priority' },
    { value: 1, label: 'P1 - Urgent' },
    { value: 2, label: 'P2 - High' },
    { value: 3, label: 'P3 - Medium' },
    { value: 4, label: 'P4 - Low' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Update {fieldType === 'priority' ? 'Priority' : 'Status'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current {fieldType === 'priority' ? 'Priority' : 'Status'}
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
              {fieldType === 'priority'
                ? currentValue
                  ? `P${currentValue}`
                  : 'No Priority'
                : currentValueName || currentValue || 'Not set'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New {fieldType === 'priority' ? 'Priority' : 'Status'} *
            </label>
            {fieldType === 'priority' ? (
              <select
                value={newValue}
                onChange={(e) => setNewValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select priority...</option>
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : loadingStates ? (
              <div className="px-3 py-2 text-gray-500">Loading states...</div>
            ) : availableStates.length > 0 ? (
              <div>
                <select
                  value={newValue}
                  onChange={(e) => {
                    const selectedState = availableStates.find(s => s.id === e.target.value);
                    setNewValue(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status...</option>
                  {availableStates.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {availableStates.length} status{availableStates.length !== 1 ? 'es' : ''} from Linear
                </p>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter status (e.g., Started, In Progress, Completed)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-orange-600 mt-1">
                  No states found in Linear. You can type a custom status.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Reprioritized based on customer feedback, moved to implementation phase..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be posted as a project update in Linear
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800 font-medium">
              Linear Update Preview:
            </p>
            <div className="text-xs text-blue-700 mt-2 whitespace-pre-line">
              {fieldType === 'priority' ? '🎯' : '📊'} <strong>{fieldType === 'priority' ? 'Priority' : 'Status'} Updated via Capacity Planner</strong>
              {'\n'}
              {fieldType === 'priority'
                ? `Priority: ${currentValue ? `P${currentValue}` : 'None'} → ${newValue !== '' ? `P${newValue}` : '...'}`
                : `Status: ${currentValueName || currentValue || 'Not set'} → ${newValue ? availableStates.find(s => s.id === newValue)?.name || '...' : '...'}`}
              {'\n'}
              Reason: {reason.trim() || '...'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
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
            disabled={isSaving || !newValue || !reason.trim()}
          >
            {isSaving ? 'Updating...' : 'Update in Linear'}
          </button>
        </div>
      </div>
    </div>
  );
}
