'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle } from 'lucide-react';
import { Quarter, Team } from '@/types';

interface LinearSyncProps {
  quarter: Quarter;
  team: Team;
  onClose: () => void;
  onSync: () => void;
}

interface LinearProject {
  id: string;
  name: string;
  description: string | null;
  state: string;
  priority: number;
  targetDate: string | null;
  startDate: string | null;
  lead: { id: string; name: string; email: string } | null;
  url: string;
  progress: number;
}

export default function LinearSync({ quarter, team, onClose, onSync }: LinearSyncProps) {
  const [projects, setProjects] = useState<LinearProject[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (team.linearTeamId) {
      fetchLinearProjects();
    }
  }, [team]);

  const fetchLinearProjects = async () => {
    if (!team.linearTeamId) {
      alert('This team is not linked to a Linear team. Please configure the team first.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/linear/issues?team_id=${team.linearTeamId}`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching Linear projects:', error);
      alert('Failed to fetch Linear projects. Check your API key and team configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map(p => p.id)));
    }
  };

  const handleSync = async () => {
    if (selectedProjects.size === 0) {
      alert('Please select at least one project to sync.');
      return;
    }

    setSyncing(true);
    try {
      const selectedProjectsList = projects.filter(p => selectedProjects.has(p.id));

      for (const project of selectedProjectsList) {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `proj-${quarter.id}-${project.id}`,
            linear_issue_id: project.id,
            team_id: team.id,
            quarter_id: quarter.id,
            // Only store local planning fields
            planned_weeks: 0,
            internal_timeline: null,
            has_frm: false,
            notes: null,
            dependencies: null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to sync project:', project.name, errorData);
          throw new Error(`Failed to sync "${project.name}": ${errorData.details || errorData.error}`);
        }
      }

      alert(`Successfully synced ${selectedProjects.size} project(s) from Linear!`);
      onSync();
    } catch (error: any) {
      console.error('Error syncing projects:', error);
      alert(error.message || 'Failed to sync some projects. Check the console for details.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import from Linear</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing Linear projects from <span className="font-semibold text-purple-700">{team.name}</span> team
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Only issues that are part of Linear projects on this team will appear below
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!team.linearTeamId ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">
              This team is not linked to a Linear team. Please configure the team in Team Management first.
            </p>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-purple-800">
                  <span className="font-semibold">Filtering by team & projects:</span> Only issues that are part of Linear projects on the <span className="font-semibold">{team.name}</span> team will be shown
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-2" />
            <span className="text-gray-600">Loading issues from Linear...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedProjects.size === projects.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedProjects.size} of {projects.length} selected
                </span>
              </div>
              <button
                onClick={fetchLinearProjects}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedProjects.size === projects.length && projects.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Project Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        State
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Lead
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Target Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedProjects.has(project.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleToggleProject(project.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProjects.has(project.id)}
                            onChange={() => handleToggleProject(project.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="max-w-md truncate font-medium">{project.name}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                            {project.state}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {project.lead?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          {project.progress ? `${Math.round(project.progress * 100)}%` : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {projects.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No projects found in Linear for this team.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSync}
                disabled={selectedProjects.size === 0 || syncing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sync {selectedProjects.size} Project{selectedProjects.size !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
