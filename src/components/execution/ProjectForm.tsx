'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Quarter, Team, Project } from '@/types';

interface ProjectFormProps {
  quarter: Quarter;
  team: Team;
  project: Project | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ProjectForm({ quarter, team, project, onClose, onSave }: ProjectFormProps) {
  const isLinkedToLinear = !!project?.linear_issue_id;

  const [formData, setFormData] = useState({
    id: project?.id || `proj-${Date.now()}`,
    title: project?.title || '',
    priority: project?.priority || 3,
    engineering_poc: project?.engineering_poc || '',
    engineering_lead: project?.engineering_lead || '',
    status: project?.status || '',
    health: project?.health || null,
    external_timeline: project?.external_timeline || '',
    internal_timeline: project?.internal_timeline || '',
    original_effort: project?.original_effort || 0,
    has_frm: project?.has_frm || false,
    notes: project?.notes || '',
    dependencies: project?.dependencies || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = project ? `/api/projects/${project.id}` : '/api/projects';
      const method = project ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          team_id: team.id,
          quarter_id: quarter.id,
        }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {project ? 'Edit Project' : 'Add New Project'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLinkedToLinear && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-purple-900">
                    Linked to Linear
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Title, Priority, Status, Assignee, and Estimate come directly from Linear and cannot be edited here.
                    Update them in Linear to see changes reflected.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isLinkedToLinear}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
            />
            {isLinkedToLinear && (
              <p className="text-xs text-gray-500 mt-1">From Linear - edit in Linear to update</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                disabled={isLinkedToLinear}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={1}>P1 - Urgent</option>
                <option value={2}>P2 - High</option>
                <option value={3}>P3 - Normal</option>
                <option value={4}>P4 - Low</option>
                <option value={0}>P0 - None</option>
              </select>
              {isLinkedToLinear && (
                <p className="text-xs text-gray-500 mt-1">From Linear</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <input
                type="text"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={isLinkedToLinear}
                placeholder="e.g., In Progress, Done"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {isLinkedToLinear && (
                <p className="text-xs text-gray-500 mt-1">From Linear</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignee / POC
              </label>
              <input
                type="text"
                value={formData.engineering_poc}
                onChange={(e) => setFormData({ ...formData, engineering_poc: e.target.value })}
                disabled={isLinkedToLinear}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {isLinkedToLinear && (
                <p className="text-xs text-gray-500 mt-1">From Linear (Assignee)</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engineering Lead
              </label>
              <input
                type="text"
                value={formData.engineering_lead}
                onChange={(e) => setFormData({ ...formData, engineering_lead: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimate (days)
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.original_effort}
              onChange={(e) => setFormData({ ...formData, original_effort: parseFloat(e.target.value) || 0 })}
              disabled={isLinkedToLinear}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {isLinkedToLinear && (
              <p className="text-xs text-gray-500 mt-1">From Linear (Estimate field)</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External Timeline
              </label>
              <input
                type="date"
                value={formData.external_timeline}
                onChange={(e) => setFormData({ ...formData, external_timeline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Timeline
              </label>
              <input
                type="date"
                value={formData.internal_timeline}
                onChange={(e) => setFormData({ ...formData, internal_timeline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.has_frm}
                onChange={(e) => setFormData({ ...formData, has_frm: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Has FRM (Functional Requirements)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependencies / Risks
            </label>
            <textarea
              value={formData.dependencies}
              onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
