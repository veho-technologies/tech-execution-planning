'use client';

import React, { useState, useEffect } from 'react';
import { Sprint } from '@/types';

interface UnplannedWorkItem {
  projectId: string | null;
  projectName: string;
  projectUrl: string | null;
  issueCount: number;
  totalEstimate: number;
  totalActualDays: number;
  engineers: string[];
  issues: Array<{
    id: string;
    identifier: string;
    title: string;
    url: string;
    assignee: { name: string; email: string } | null;
    state: string;
    completedAt: string | null;
    estimate: number | null;
    actualDays: number | null;
    priority: number;
    priorityLabel: string;
    labels: Array<{ name: string; color: string }>;
  }>;
}

interface UnplannedWorkIndicatorProps {
  sprint: Sprint;
  teamId: string;
  excludeProjectIds: string[];
  sprintCapacity: number;
}

export default function UnplannedWorkIndicator({
  sprint,
  teamId,
  excludeProjectIds,
  sprintCapacity,
}: UnplannedWorkIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [unplannedWork, setUnplannedWork] = useState<UnplannedWorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<{
    totalIssues: number;
    totalEstimate: number;
    totalActualDays: number;
    priorityCounts: {
      urgent: number;
      high: number;
      normal: number;
      low: number;
      none: number;
    };
  } | null>(null);

  const fetchUnplannedWork = async () => {
    if (unplannedWork.length > 0) {
      // Already fetched
      setIsExpanded(!isExpanded);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/linear/unplanned-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          sprintId: sprint.id,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          excludeProjectIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unplanned work');
      }

      const data = await response.json();
      setUnplannedWork(data.unplannedWork);
      setMetrics(data.metrics);
      setIsExpanded(true);
    } catch (error) {
      console.error('Error fetching unplanned work:', error);
      alert('Failed to fetch unplanned work from Linear');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get priority color and label
  const getPriorityStyle = (priority: number) => {
    switch (priority) {
      case 1: return { bg: 'bg-red-100', text: 'text-red-700', label: 'P1' };
      case 2: return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'P2' };
      case 3: return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'P3' };
      case 4: return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'P4' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'P-' };
    }
  };

  // Helper to identify work type from labels
  const getWorkTypeLabel = (labels: Array<{ name: string; color: string }>) => {
    const bugLabels = ['bug', 'defect', 'issue'];
    const featureLabels = ['feature', 'enhancement'];
    const incidentLabels = ['incident', 'outage', 'urgent'];
    const techDebtLabels = ['tech-debt', 'technical-debt', 'refactor'];

    for (const label of labels) {
      const lowerName = label.name.toLowerCase();
      if (bugLabels.some(b => lowerName.includes(b))) return { type: 'Bug', color: 'bg-red-100 text-red-700' };
      if (incidentLabels.some(i => lowerName.includes(i))) return { type: 'Incident', color: 'bg-purple-100 text-purple-700' };
      if (featureLabels.some(f => lowerName.includes(f))) return { type: 'Feature', color: 'bg-green-100 text-green-700' };
      if (techDebtLabels.some(t => lowerName.includes(t))) return { type: 'Tech Debt', color: 'bg-orange-100 text-orange-700' };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-xs text-gray-500 italic">
        Loading unplanned work...
      </div>
    );
  }

  // Calculate capacity percentage
  const capacityPercentage = metrics && sprintCapacity > 0
    ? ((metrics.totalEstimate / sprintCapacity) * 100).toFixed(1)
    : null;

  return (
    <div className="mt-2">
      <button
        onClick={fetchUnplannedWork}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        {isExpanded ? '▼' : '▶'} Show unplanned work
        {metrics && ` (${metrics.totalIssues} issues, ${metrics.totalActualDays.toFixed(1)} days)`}
      </button>

      {isExpanded && metrics && (
        <div className="mt-2 border border-gray-200 rounded p-2 bg-gray-50">
          {/* Metrics Summary */}
          <div className="mb-3 pb-2 border-b border-gray-300">
            <div className="text-xs font-semibold text-gray-800 mb-1">
              Unplanned Work Summary:
            </div>
            <div className="flex gap-3 flex-wrap text-[10px]">
              <div>
                <span className="text-gray-600">Total Issues:</span>{' '}
                <span className="font-semibold">{metrics.totalIssues}</span>
              </div>
              {metrics.totalActualDays > 0 && (
                <div>
                  <span className="text-gray-600">Actual Days:</span>{' '}
                  <span className="font-semibold">{metrics.totalActualDays.toFixed(1)}</span>
                </div>
              )}
              {metrics.totalEstimate > 0 && (
                <>
                  <div>
                    <span className="text-gray-600">Story Points:</span>{' '}
                    <span className="font-semibold">{metrics.totalEstimate}</span>
                  </div>
                  {capacityPercentage && (
                    <div>
                      <span className="text-gray-600">% of Capacity:</span>{' '}
                      <span className={`font-semibold ${parseFloat(capacityPercentage) > 20 ? 'text-red-600' : 'text-orange-600'}`}>
                        {capacityPercentage}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Priority Breakdown */}
            {(metrics.priorityCounts.urgent > 0 || metrics.priorityCounts.high > 0) && (
              <div className="mt-2 flex gap-2 flex-wrap text-[10px]">
                {metrics.priorityCounts.urgent > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                    P1: {metrics.priorityCounts.urgent}
                  </span>
                )}
                {metrics.priorityCounts.high > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                    P2: {metrics.priorityCounts.high}
                  </span>
                )}
                {metrics.priorityCounts.normal > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                    P3: {metrics.priorityCounts.normal}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Issues by Project */}
          {unplannedWork.length > 0 ? (
            <div className="space-y-3">
              {unplannedWork.map((item, idx) => (
                <div key={idx} className="border-b border-gray-200 pb-2 last:border-0">
                  <div className="font-semibold text-gray-800 text-xs mb-1">
                    {item.projectName}
                    <span className="ml-2 text-gray-500 font-normal">
                      ({item.issueCount} issues
                      {item.totalActualDays > 0 && `, ${item.totalActualDays.toFixed(1)} days`}
                      {item.totalEstimate > 0 && `, ${item.totalEstimate} pts`})
                    </span>
                  </div>
                  <div className="ml-2 space-y-1">
                    {item.issues.map((issue) => {
                      const priorityStyle = getPriorityStyle(issue.priority);
                      const workType = getWorkTypeLabel(issue.labels);

                      return (
                        <div key={issue.id} className="text-xs flex items-start gap-1">
                          <div className="flex-1">
                            <a
                              href={issue.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                            >
                              {issue.identifier}: {issue.title}
                              <span className="text-[10px]">↗</span>
                            </a>
                            <div className="flex gap-1 mt-0.5 flex-wrap items-center">
                              {/* Priority Badge */}
                              <span className={`text-[9px] px-1 py-0.5 rounded ${priorityStyle.bg} ${priorityStyle.text} font-medium`}>
                                {priorityStyle.label}
                              </span>
                              {/* Work Type Badge */}
                              {workType && (
                                <span className={`text-[9px] px-1 py-0.5 rounded ${workType.color} font-medium`}>
                                  {workType.type}
                                </span>
                              )}
                              {/* Actual Days */}
                              {issue.actualDays && issue.actualDays > 0 && (
                                <span className="text-[9px] text-gray-600 font-semibold">
                                  {issue.actualDays.toFixed(1)}d
                                </span>
                              )}
                              {/* Estimate */}
                              {issue.estimate && (
                                <span className="text-[9px] text-gray-600">
                                  {issue.estimate} pts
                                </span>
                              )}
                              {/* Assignee */}
                              {issue.assignee && (
                                <span className="text-[9px] text-gray-600">
                                  • {issue.assignee.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              No unplanned work found in Linear for this sprint
            </div>
          )}
        </div>
      )}
    </div>
  );
}
