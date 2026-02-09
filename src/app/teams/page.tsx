'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Team } from '@/types';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [linearTeams, setLinearTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    linearTeamId: '',
    totalEngineers: 0,
    ktloEngineers: 0,
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinearTeams = async () => {
    try {
      const response = await fetch('/api/linear/teams');
      const data = await response.json();

      // Handle error responses from API
      if (!response.ok || !Array.isArray(data)) {
        console.error('Error fetching Linear teams:', data);
        alert('Failed to fetch Linear teams. Check your API key configuration.');
        setLinearTeams([]);
        return;
      }

      setLinearTeams(data);
    } catch (error) {
      console.error('Error fetching Linear teams:', error);
      alert('Failed to fetch Linear teams. Check your API key configuration.');
      setLinearTeams([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams';
      const method = editingTeam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          linear_team_id: formData.linearTeamId,
          total_engineers: formData.totalEngineers,
          ktlo_engineers: formData.ktloEngineers,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingTeam(null);
        setFormData({
          id: '',
          name: '',
          linearTeamId: '',
          totalEngineers: 0,
          ktloEngineers: 0,
        });
        fetchTeams();
      }
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      id: team.id,
      name: team.name,
      linearTeamId: team.linearTeamId || '',
      totalEngineers: team.totalEngineers,
      ktloEngineers: team.ktloEngineers,
    });
    setShowForm(true);
    fetchLinearTeams();
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This will also delete all associated projects.')) {
      return;
    }

    try {
      await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleSyncFromLinear = async (team: Team) => {
    if (!team.linearTeamId) {
      alert('This team is not linked to Linear. Edit the team and select a Linear team first.');
      return;
    }

    // Get quarters
    const quartersRes = await fetch('/api/quarters');
    const quarters = await quartersRes.json();

    let quarterOptions = quarters.map((q: any, i: number) =>
      `${i + 1}. ${q.name} (${q.start_date} to ${q.end_date})`
    ).join('\n');

    const quarterChoice = prompt(
      `Import issues from Linear into which quarter?\n\n${quarterOptions}\n\nEnter the number (1-${quarters.length}):`
    );

    if (!quarterChoice) return;

    const index = parseInt(quarterChoice) - 1;
    if (index < 0 || index >= quarters.length) {
      alert('Invalid selection');
      return;
    }

    const selectedQuarter = quarters[index];

    try {
      const syncRes = await fetch(`/api/teams/${team.id}/sync-linear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter_id: selectedQuarter.id }),
      });

      const syncResult = await syncRes.json();

      if (syncRes.ok) {
        alert(
          `✅ Sync Complete!\n\n${syncResult.message}\n\nTotal issues in Linear: ${syncResult.total}\nNew imports: ${syncResult.imported}\nAlready existed: ${syncResult.skipped}`
        );
      } else {
        alert(`Error: ${syncResult.error}`);
      }
    } catch (error) {
      console.error('Error syncing from Linear:', error);
      alert('Failed to sync from Linear. Check console for details.');
    }
  };

  const handleNewTeam = () => {
    setEditingTeam(null);
    setFormData({
      id: `team-${Date.now()}`,
      name: '',
      linearTeamId: '',
      totalEngineers: 0,
      ktloEngineers: 0,
    });
    setShowForm(true);
    fetchLinearTeams();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Configure teams, link Linear boards, and set capacity parameters
          </p>
        </div>
        <button
          onClick={handleNewTeam}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                {team.linearTeamId && (
                  <span className="inline-flex items-center px-2 py-1 mt-2 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    Linked to Linear
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(team)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit team"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Engineers:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {team.totalEngineers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">KTLO Engineers:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {team.ktloEngineers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-sm font-medium text-blue-600">Roadmap Engineers:</span>
                <span className="text-xl font-bold text-blue-600">
                  {(team.totalEngineers || 0) - (team.ktloEngineers || 0)}
                </span>
              </div>

              {team.linearTeamId && (
                <div className="pt-3">
                  <button
                    onClick={() => handleSyncFromLinear(team)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync from Linear
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No teams configured. Click "Add Team" to create your first team.
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTeam ? 'Edit Team' : 'Add New Team'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTeam(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
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
                  Linear Team (optional)
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.linearTeamId}
                    onChange={(e) => setFormData({ ...formData, linearTeamId: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Not linked</option>
                    {Array.isArray(linearTeams) && linearTeams.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name} ({lt.key})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={fetchLinearTeams}
                    className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Engineers *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.totalEngineers}
                  onChange={(e) => setFormData({ ...formData, totalEngineers: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KTLO Engineers *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.ktloEngineers}
                  onChange={(e) => setFormData({ ...formData, ktloEngineers: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Engineers dedicated to KTLO (excluded from roadmap capacity)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">
                  Roadmap Engineers: {(formData.totalEngineers - formData.ktloEngineers).toFixed(1)}
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  These engineers will be counted for capacity planning
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTeam(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
