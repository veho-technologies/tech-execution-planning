'use client';

import { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface StartDatePromptModalProps {
  projectName: string;
  onConfirm: (startDate: string) => void;
  onCancel: () => void;
}

export default function StartDatePromptModal({
  projectName,
  onConfirm,
  onCancel,
}: StartDatePromptModalProps) {
  const [startDate, setStartDate] = useState('');

  const handleConfirm = () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }
    onConfirm(startDate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Set Start Date
            </h2>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="text-sm text-gray-700 mb-4">
            To automatically allocate planned weeks across sprints, we need a start date for this project.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Sprints will be allocated starting from the sprint that contains this date.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!startDate}
            className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Allocate Sprints
          </button>
        </div>
      </div>
    </div>
  );
}
