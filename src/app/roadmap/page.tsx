'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Team, Sprint, Project, SprintAllocation, Quarter } from '@/types';
import RoadmapGantt from '@/components/roadmap/RoadmapGantt';

export default function RoadmapPage() {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allAllocations, setAllAllocations] = useState<SprintAllocation[]>([]);
  const [allProjectInstances, setAllProjectInstances] = useState<Project[]>([]); // non-deduplicated, for allocation lookups
  const [linearData, setLinearData] = useState<Record<string, any>>({});

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Filter state
  const [filterLead, setFilterLead] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPhase, setFilterPhase] = useState<string>('All');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTeam && quarters.length > 0) {
      fetchAllQuartersData();
    }
  }, [selectedTeam, quarters]);

  const fetchInitialData = async () => {
    try {
      const [quartersRes, teamsRes] = await Promise.all([
        fetch('/api/quarters'),
        fetch('/api/teams'),
      ]);

      const quartersData = await quartersRes.json();
      const teamsData = await teamsRes.json();

      const safeQuarters = Array.isArray(quartersData) ? quartersData : [];
      const safeTeams = Array.isArray(teamsData) ? teamsData : [];

      // Sort quarters chronologically
      safeQuarters.sort((a: Quarter, b: Quarter) => a.startDate.localeCompare(b.startDate));

      setQuarters(safeQuarters);
      setTeams(safeTeams);

      if (safeTeams.length > 0) setSelectedTeam(safeTeams[0]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllQuartersData = async () => {
    if (!selectedTeam || quarters.length === 0) return;

    try {
      // Only fetch current and future quarters (skip fully past ones)
      const now = new Date();
      const relevantQuarters = quarters.filter(q => new Date(q.endDate) >= now);

      // Fetch sprints and projects for relevant quarters in parallel
      const sprintPromises = relevantQuarters.map(q =>
        fetch(`/api/sprints?quarter_id=${q.id}`).then(r => r.json()).then(d => Array.isArray(d) ? d : [])
      );
      const projectPromises = relevantQuarters.map(q =>
        fetch(`/api/projects?quarter_id=${q.id}&team_id=${selectedTeam.id}`).then(r => r.json()).then(d => Array.isArray(d) ? d : [])
      );

      const [sprintResults, projectResults] = await Promise.all([
        Promise.all(sprintPromises),
        Promise.all(projectPromises),
      ]);

      const combinedSprints = sprintResults.flat();
      const combinedProjects = projectResults.flat();

      // Deduplicate projects by linearIssueId — keep the earliest quarter's version for display,
      // but we need all project IDs for allocations
      const seenLinearIds = new Set<string>();
      const uniqueProjects: Project[] = [];
      const allProjectIds: string[] = [];

      // Sort projects by quarter start date then displayOrder
      const quarterStartMap = new Map(quarters.map(q => [q.id, q.startDate]));
      combinedProjects.sort((a, b) => {
        const qA = quarterStartMap.get(a.quarterId) || '';
        const qB = quarterStartMap.get(b.quarterId) || '';
        if (qA !== qB) return qA.localeCompare(qB);
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });

      for (const p of combinedProjects) {
        allProjectIds.push(p.id);
        if (!seenLinearIds.has(p.linearIssueId)) {
          seenLinearIds.add(p.linearIssueId);
          uniqueProjects.push(p);
        }
      }

      setAllSprints(combinedSprints);
      setAllProjects(uniqueProjects);
      setAllProjectInstances(combinedProjects);

      // Fetch Linear data for all unique projects
      const linkedProjectIds = uniqueProjects
        .filter(p => p.linearIssueId)
        .map(p => p.linearIssueId);

      if (linkedProjectIds.length > 0) {
        try {
          const linearRes = await fetch('/api/linear/projects/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectIds: linkedProjectIds }),
          });
          const linearDataMap = await linearRes.json();
          setLinearData(linearDataMap);
          setLastSynced(new Date());
        } catch (error) {
          console.error('Error fetching Linear data:', error);
        }
      }

      // Fetch allocations for ALL project IDs (across all quarters), batched to avoid URL length limits
      if (allProjectIds.length > 0) {
        const BATCH_SIZE = 20;
        const allAllocsData: SprintAllocation[] = [];
        for (let i = 0; i < allProjectIds.length; i += BATCH_SIZE) {
          const batch = allProjectIds.slice(i, i + BATCH_SIZE);
          const res = await fetch(`/api/allocations?project_id=${batch.join(',')}`);
          if (res.ok) {
            const data = await res.json();
            allAllocsData.push(...(Array.isArray(data) ? data : []));
          }
        }
        setAllAllocations(allAllocsData);
      }
    } catch (error) {
      console.error('Error fetching roadmap data:', error);
    }
  };

  // Compute the full date range from all sprints
  const dateRange = useMemo(() => {
    if (allSprints.length === 0) return null;
    const dates = allSprints.flatMap(s => [s.startDate, s.endDate]).sort();
    return { startDate: dates[0], endDate: dates[dates.length - 1] };
  }, [allSprints]);

  // Derive filter options
  const leadOptions = useMemo(() => {
    const leads = new Set<string>();
    allProjects.forEach(p => {
      const ld = linearData[p.linearIssueId];
      const leadName = typeof ld?.lead === 'object' ? ld?.lead?.name : ld?.lead;
      if (leadName) leads.add(leadName);
    });
    return Array.from(leads).sort();
  }, [allProjects, linearData]);

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    allProjects.forEach(p => {
      const ld = linearData[p.linearIssueId];
      if (ld?.status) statuses.add(ld.status);
    });
    return Array.from(statuses).sort();
  }, [allProjects, linearData]);

  const phaseOptions = useMemo(() => {
    const phases = new Set<string>();
    allAllocations.forEach(a => {
      if (a.phase) phases.add(a.phase);
    });
    return Array.from(phases).sort();
  }, [allAllocations]);

  // Filter projects - only show projects that have at least one allocation
  const filteredProjects = useMemo(() => {
    // Pre-build Map<projectId, linearIssueId> for O(1) lookups
    const projectToLinearId = new Map<string, string>();
    for (const p of allProjectInstances) {
      projectToLinearId.set(p.id, p.linearIssueId);
    }

    // Build set of linearIssueIds that have allocations
    const idsWithAllocations = new Set<string>();
    // Pre-build Set<linearIssueId> per phase for phase filter
    const phaseToLinearIds = new Map<string, Set<string>>();
    for (const a of allAllocations) {
      const linearId = projectToLinearId.get(a.projectId);
      if (linearId) {
        idsWithAllocations.add(linearId);
        if (a.phase) {
          let s = phaseToLinearIds.get(a.phase);
          if (!s) { s = new Set(); phaseToLinearIds.set(a.phase, s); }
          s.add(linearId);
        }
      }
    }

    return allProjects.filter(p => {
      // Must have allocations to appear on the roadmap
      if (!idsWithAllocations.has(p.linearIssueId)) return false;

      const ld = linearData[p.linearIssueId];
      const leadName = typeof ld?.lead === 'object' ? ld?.lead?.name : ld?.lead;
      if (filterLead !== 'All' && leadName !== filterLead) return false;
      if (filterStatus !== 'All' && ld?.status !== filterStatus) return false;
      if (filterPhase !== 'All') {
        const phaseSet = phaseToLinearIds.get(filterPhase);
        if (!phaseSet?.has(p.linearIssueId)) return false;
      }
      return true;
    });
  }, [allProjects, allProjectInstances, linearData, allAllocations, filterLead, filterStatus, filterPhase]);

  // Stats — single pass
  const activeStatuses = ['building', 'rolling', 'piloting', 'progress'];
  const notStartedStatuses = ['backlog', 'planned', 'not started', 'paused'];
  const doneStatuses = ['done', 'complete'];
  const today = new Date();

  const totalProjects = allProjects.length;
  let activeCount = 0;
  let notStartedCount = 0;
  let overdueCount = 0;
  for (const p of allProjects) {
    const ld = linearData[p.linearIssueId];
    if (!ld?.status) continue;
    const statusLower = ld.status.toLowerCase();
    if (activeStatuses.some(s => statusLower.includes(s))) activeCount++;
    if (notStartedStatuses.some(s => statusLower.includes(s))) notStartedCount++;
    if (ld.targetDate && new Date(ld.targetDate) < today && !doneStatuses.some(s => statusLower.includes(s))) overdueCount++;
  }

  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roadmap</h1>
          <p className="text-gray-600 mt-1">{formattedDate}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Team selector */}
          <select
            value={selectedTeam?.id || ''}
            onChange={e => {
              const team = teams.find(t => t.id === e.target.value);
              setSelectedTeam(team || null);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          {lastSynced && (
            <span className="text-sm text-gray-500">
              Synced {lastSynced.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAllQuartersData}
            className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Projects</p>
          <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Not Started</p>
          <p className="text-2xl font-bold text-gray-600">{notStartedCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select value={filterLead} onChange={e => setFilterLead(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="All">All Leads</option>
            {leadOptions.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="All">All Statuses</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="All">All Phases</option>
            {phaseOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Gantt chart */}
      <div className="bg-white rounded-lg shadow">
        {dateRange && allSprints.length > 0 ? (
          <RoadmapGantt
            projects={filteredProjects}
            allProjectInstances={allProjectInstances}
            sprints={allSprints}
            allocations={allAllocations}
            linearData={linearData}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            quarters={quarters}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No data found. Select a team to view the roadmap.</p>
          </div>
        )}
      </div>
    </div>
  );
}
