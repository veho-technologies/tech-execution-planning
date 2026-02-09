'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DateUpdateModalProps {
  projectId: string;
  projectName: string;
  dateType: 'start' | 'target';
  currentDate: string | null;
  onClose: () => void;
  onSave: () => void;
}

export default function DateUpdateModal({
  projectId,
  projectName,
  dateType,
  currentDate,
  onClose,
  onSave,
}: DateUpdateModalProps) {
  const [newDate, setNewDate] = useState(currentDate || '');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!newDate) {
      alert('Please select a date');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for this date change');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/linear/update-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          dateType,
          newDate,
          oldDate: currentDate,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update date');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating date:', error);
      alert(error.message || 'Failed to update date. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateForDisplay = (date: string | null) => {
    if (!date) return 'Not set';
    try {
      return format(parseISO(date), 'MMM d, yyyy');
    } catch {
      return date;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Update {dateType === 'start' ? 'Start' : 'Target'} Date
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
              Current Date
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
              {formatDateForDisplay(currentDate)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Date *
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Dependencies shifted, scope changed, resource availability..."
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
              📅 <strong>Dates Updated via Capacity Planner</strong>
              {'\n'}
              {dateType === 'start' ? 'Start Date' : 'Target Date'}: {formatDateForDisplay(currentDate)} → {newDate ? formatDateForDisplay(newDate) : '...'}
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
            disabled={isSaving || !newDate || !reason.trim()}
          >
            {isSaving ? 'Updating...' : 'Update in Linear'}
          </button>
        </div>
      </div>
    </div>
  );
}
