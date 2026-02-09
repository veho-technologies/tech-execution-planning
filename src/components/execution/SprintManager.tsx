'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Quarter, Sprint } from '@/types';
import { addWeeks, format, parseISO } from 'date-fns';

interface SprintManagerProps {
  quarter: Quarter;
  onClose: () => void;
  onSave: () => void;
}

export default function SprintManager({ quarter, onClose, onSave }: SprintManagerProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    sprint_number: 1,
  });

  useEffect(() => {
    fetchSprints();
  }, [quarter]);

  const fetchSprints = async () => {
    try {
      const response = await fetch(`/api/sprints?quarter_id=${quarter.id}`);
      const data = await response.json();
      setSprints(data);

      if (data.length > 0) {
        const lastSprint = data[data.length - 1];
        const nextStart = addWeeks(parseISO(lastSprint.end_date), 0);
        const nextEnd = addWeeks(nextStart, 2);

        setFormData({
          name: `Sprint ${lastSprint.sprint_number + 1}`,
          start_date: format(nextStart, 'yyyy-MM-dd'),
          end_date: format(nextEnd, 'yyyy-MM-dd'),
          sprint_number: lastSprint.sprint_number + 1,
        });
      } else {
        setFormData({
          name: 'Sprint 1',
          start_date: quarter.start_date,
          end_date: format(addWeeks(parseISO(quarter.start_date), 2), 'yyyy-MM-dd'),
          sprint_number: 1,
        });
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `sprint-${Date.now()}`,
          quarter_id: quarter.id,
          ...formData,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        fetchSprints();
      }
    } catch (error) {
      console.error('Error creating sprint:', error);
    }
  };

  const handleGenerateSprints = () => {
    const count = parseInt(prompt('How many 2-week sprints to generate?') || '0');
    if (count <= 0) return;

    const generateSprints = async () => {
      const startDate = parseISO(quarter.start_date);
      const existingCount = sprints.length;

      for (let i = 0; i < count; i++) {
        const sprintStart = addWeeks(startDate, i * 2);
        const sprintEnd = addWeeks(sprintStart, 2);

        await fetch('/api/sprints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `sprint-${Date.now()}-${i}`,
            quarter_id: quarter.id,
            name: `Sprint ${existingCount + i + 1}`,
            start_date: format(sprintStart, 'yyyy-MM-dd'),
            end_date: format(sprintEnd, 'yyyy-MM-dd'),
            sprint_number: existingCount + i + 1,
          }),
        });
      }

      fetchSprints();
    };

    generateSprints();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Manage Sprints - {quarter.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sprint
          </button>
          <button
            onClick={handleGenerateSprints}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Generate Multiple Sprints
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sprint Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sprint Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sprints.map((sprint) => {
                const start = parseISO(sprint.start_date);
                const end = parseISO(sprint.end_date);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <tr key={sprint.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {sprint.sprint_number}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {sprint.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {sprint.start_date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {sprint.end_date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {days} days
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sprints.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No sprints created yet. Click "Add Sprint" or "Generate Multiple Sprints" to start.
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
