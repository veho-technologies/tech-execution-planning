'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Quarter, Team, PTOEntry } from '@/types';

interface PTOManagerProps {
  quarter: Quarter;
  teams: Team[];
  onUpdate: () => void;
}

export default function PTOManager({ quarter, teams, onUpdate }: PTOManagerProps) {
  const [ptoEntries, setPtoEntries] = useState<PTOEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    team_id: '',
    engineer_name: '',
    start_date: '',
    end_date: '',
    days_count: 0,
    notes: '',
  });

  useEffect(() => {
    fetchPTO();
  }, [quarter]);

  const fetchPTO = async () => {
    try {
      const response = await fetch(`/api/pto?quarter_id=${quarter.id}`);
      const data = await response.json();
      setPtoEntries(data);
    } catch (error) {
      console.error('Error fetching PTO:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/pto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quarter_id: quarter.id,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          team_id: '',
          engineer_name: '',
          start_date: '',
          end_date: '',
          days_count: 0,
          notes: '',
        });
        fetchPTO();
        onUpdate();
      }
    } catch (error) {
      console.error('Error creating PTO entry:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this PTO entry?')) return;

    try {
      await fetch(`/api/pto/${id}`, { method: 'DELETE' });
      fetchPTO();
      onUpdate();
    } catch (error) {
      console.error('Error deleting PTO entry:', error);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">PTO Management</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add PTO
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engineer Name</label>
              <input
                type="text"
                value={formData.engineer_name}
                onChange={(e) => setFormData({ ...formData, engineer_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days Count</label>
              <input
                type="number"
                step="0.5"
                value={formData.days_count}
                onChange={(e) => setFormData({ ...formData, days_count: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add PTO
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engineer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ptoEntries.map((pto) => {
              const team = teams.find(t => t.id === pto.team_id);
              return (
                <tr key={pto.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{team?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{pto.engineer_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pto.start_date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pto.end_date}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600">{pto.days_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pto.notes}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(pto.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ptoEntries.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No PTO entries for this quarter
          </div>
        )}
      </div>
    </div>
  );
}
