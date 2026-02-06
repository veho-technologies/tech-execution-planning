'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, Save, RefreshCw, Clock } from 'lucide-react';
import { Quarter, Team, Sprint, Project, SprintAllocation, CapacityCalculation, Holiday } from '@/types';
import { calculateQuarterCapacity } from '@/lib/capacity';
import ExecutionTable from '@/components/execution/ExecutionTable';
import LinearSync from '@/components/execution/LinearSync';
import CapacityIndicator from '@/components/execution/CapacityIndicator';
import TeamQuarterSettings from '@/components/execution/TeamQuarterSettings';

export default function ExecutionPage() {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<SprintAllocation[]>([]);
  const [linearData, setLinearData] = useState<Record<string, any>>({});
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [showLinearSync, setShowLinearSync] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncingActuals, setSyncingActuals] = useState(false);
  const [capacityCalc, setCapacityCalc] = useState<CapacityCalculation | null>(null);
  const [ptoDaysPerEngineer, setPtoDaysPerEngineer] = useState<number>(0);
  const [effectiveTotalEngineers, setEffectiveTotalEngineers] = useState<number>(0);
  const [effectiveKtloEngineers, setEffectiveKtloEngineers] = useState<number>(0);
  const [effectiveMeetingTimePercentage, setEffectiveMeetingTimePercentage] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (selectedQuarter && selectedTeam) {
        // Check if sprints already exist for this quarter
        const sprintsRes = await fetch(`/api/sprints?quarter_id=${selectedQuarter.id}`);
        const existingSprints = await sprintsRes.json();

        // Only sync cycles if no sprints exist yet (first load)
        // Otherwise, skip sync to preserve allocations
        const shouldSync = existingSprints.length === 0;
        console.log(`Loading quarter ${selectedQuarter.name}: ${existingSprints.length} sprints exist, syncCycles=${shouldSync}`);

        await fetchExecutionData(shouldSync);
        calculateCapacity();
      }
    };

    loadData();
  }, [selectedQuarter, selectedTeam]);

  const fetchInitialData = async () => {
    try {
      const [quartersRes, teamsRes] = await Promise.all([
        fetch('/api/quarters'),
        fetch('/api/teams'),
      ]);

      const quartersData = await quartersRes.json();
      const teamsData = await teamsRes.json();

      setQuarters(quartersData);
      setTeams(teamsData);

      if (quartersData.length > 0) setSelectedQuarter(quartersData[0]);
      if (teamsData.length > 0) setSelectedTeam(teamsData[0]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncCyclesFromLinear = async () => {
    if (!selectedQuarter || !selectedTeam || !selectedTeam.linearTeamId) return;

    try {
      const cyclesRes = await fetch(`/api/linear/cycles?team_id=${selectedTeam.linearTeamId}`);
      const cycles = await cyclesRes.json();

      console.log('Fetched cycles from Linear:', cycles);

      // Helper function to calculate overlap days between cycle and quarter
      const getOverlapDays = (cycleStart: Date, cycleEnd: Date, quarterStart: Date, quarterEnd: Date): number => {
        const overlapStart = cycleStart > quarterStart ? cycleStart : quarterStart;
        const overlapEnd = cycleEnd < quarterEnd ? cycleEnd : quarterEnd;

        if (overlapStart > overlapEnd) return 0;

        const diffTime = overlapEnd.getTime() - overlapStart.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
        return diffDays;
      };

      // Filter cycles: only include cycles that have MAX days in this quarter
      const quarterStart = new Date(selectedQuarter.startDate);
      const quarterEnd = new Date(selectedQuarter.endDate);

      // Define adjacent quarters for comparison
      const prevQuarterStart = new Date(quarterStart);
      prevQuarterStart.setMonth(prevQuarterStart.getMonth() - 3);
      const prevQuarterEnd = new Date(quarterStart);
      prevQuarterEnd.setDate(prevQuarterEnd.getDate() - 1);

      const nextQuarterStart = new Date(quarterEnd);
      nextQuarterStart.setDate(nextQuarterStart.getDate() + 1);
      const nextQuarterEnd = new Date(nextQuarterStart);
      nextQuarterEnd.setMonth(nextQuarterEnd.getMonth() + 3);

      const cyclesInQuarter = cycles.filter((cycle: any) => {
        const cycleStart = new Date(cycle.startsAt);
        const cycleEnd = new Date(cycle.endsAt);

        // Calculate overlap with current quarter
        const currentQuarterDays = getOverlapDays(cycleStart, cycleEnd, quarterStart, quarterEnd);

        if (currentQuarterDays === 0) return false;

        // Calculate overlap with previous and next quarters
        const prevQuarterDays = getOverlapDays(cycleStart, cycleEnd, prevQuarterStart, prevQuarterEnd);
        const nextQuarterDays = getOverlapDays(cycleStart, cycleEnd, nextQuarterStart, nextQuarterEnd);

        // Include cycle if current quarter has the maximum overlap
        const isMaxInCurrent = currentQuarterDays >= prevQuarterDays && currentQuarterDays >= nextQuarterDays;

        if (isMaxInCurrent) {
          console.log(`Cycle ${cycle.number}: Current=${currentQuarterDays}d, Prev=${prevQuarterDays}d, Next=${nextQuarterDays}d → Assigned to current`);
        }

        return isMaxInCurrent;
      });

      console.log(`Filtered ${cyclesInQuarter.length} cycles for quarter ${selectedQuarter.name}`);

      // Delete existing sprints for this quarter to ensure clean sync
      try {
        await fetch(`/api/sprints?quarter_id=${selectedQuarter.id}`, {
          method: 'DELETE',
        });
      } catch (deleteError) {
        console.error('Error deleting old sprints:', deleteError);
      }

      // Sync cycles to database as sprints
      for (const cycle of cyclesInQuarter) {
        // Generate a name if not provided
        const cycleName = cycle.name || `Cycle ${cycle.number}`;

        try {
          // Use quarter-specific sprint ID to ensure cycles are unique per quarter
          await fetch('/api/sprints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: `sprint-${selectedQuarter.id}-${cycle.id}`,
              quarter_id: selectedQuarter.id,
              name: cycleName,
              start_date: cycle.startsAt,
              end_date: cycle.endsAt,
              sprint_number: cycle.number,
            }),
          });
        } catch (sprintError) {
          console.error(`Error syncing cycle ${cycle.id}:`, sprintError);
        }
      }
    } catch (error) {
      console.error('Error fetching or syncing Linear cycles:', error);
    }
  };

  const fetchExecutionData = async (syncCycles: boolean = true) => {
    if (!selectedQuarter || !selectedTeam) return;

    try {
      // Optionally sync cycles from Linear
      if (syncCycles && selectedTeam.linearTeamId) {
        await syncCyclesFromLinear();
      }

      const [sprintsRes, projectsRes] = await Promise.all([
        fetch(`/api/sprints?quarter_id=${selectedQuarter.id}`),
        fetch(`/api/projects?quarter_id=${selectedQuarter.id}&team_id=${selectedTeam.id}`),
      ]);

      const sprintsData = await sprintsRes.json();
      const projectsData = await projectsRes.json();

      console.log('Fetched sprints:', sprintsData.length, 'sprints');
      console.log('Fetched projects:', projectsData.length, 'projects');

      setSprints(sprintsData);
      setProjects(projectsData);

      // Fetch Linear data for linked projects
      const linkedProjectIds = projectsData
        .filter((p: Project) => p.linearIssueId)
        .map((p: Project) => p.linearIssueId);

      if (linkedProjectIds.length > 0) {
        try {
          const linearRes = await fetch('/api/linear/projects/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectIds: linkedProjectIds }),
          });
          const linearDataMap = await linearRes.json();
          console.log('Fetched Linear data for', Object.keys(linearDataMap).length, 'projects');
          setLinearData(linearDataMap);
        } catch (error) {
          console.error('Error fetching Linear project data:', error);
        }
      } else {
        console.log('No linked projects to fetch Linear data for');
        setLinearData({});
      }

      if (projectsData.length > 0) {
        const projectIds = projectsData.map((p: Project) => p.id).join(',');
        console.log('Fetching allocations for project IDs:', projectIds);
        const allocsRes = await fetch(
          `/api/allocations?project_id=${projectIds}`
        );

        if (!allocsRes.ok) {
          console.error('Failed to fetch allocations:', allocsRes.status, allocsRes.statusText);
          setAllocations([]);
          return;
        }

        const allocsData = await allocsRes.json();
        console.log('Fetched allocations:', Array.isArray(allocsData) ? allocsData.length : 0, 'allocations', allocsData);
        setAllocations(Array.isArray(allocsData) ? allocsData : []);
      } else {
        console.log('No projects, setting empty allocations');
        setAllocations([]);
      }
    } catch (error) {
      console.error('Error fetching execution data:', error);
    }
  };

  const syncActualsFromLinear = async () => {
    if (!sprints || sprints.length === 0) {
      alert('No sprints found. Create sprints first.');
      return;
    }

    setSyncingActuals(true);

    try {
      // Sync actuals for all sprints in the quarter
      const results = await Promise.all(
        sprints.map(async (sprint) => {
          try {
            const response = await fetch(`/api/sprints/${sprint.id}/sync-actuals?team_id=${selectedTeam.id}`, {
              method: 'POST',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to sync');
            }

            return await response.json();
          } catch (error) {
            console.error(`Error syncing sprint ${sprint.name}:`, error);
            return { error: error.message, sprintName: sprint.name };
          }
        })
      );

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        alert(`Synced with some errors:\n${errors.map(e => `${e.sprintName}: ${e.error}`).join('\n')}`);
      } else {
        const totalProjects = results.reduce((sum, r) => sum + (r.allocations?.length || 0), 0);
        alert(`✅ Successfully synced actual days for ${totalProjects} projects across ${sprints.length} sprints`);
      }

      // Refresh data
      await fetchExecutionData(false);
    } catch (error) {
      console.error('Error syncing actuals:', error);
      alert('Failed to sync actual days from Linear');
    } finally {
      setSyncingActuals(false);
    }
  };

  const calculateCapacity = async () => {
    if (!selectedQuarter || !selectedTeam) return;

    try {
      const [holidaysRes, ptoRes, teamSettingsRes] = await Promise.all([
        fetch(`/api/holidays?quarter_id=${selectedQuarter.id}`),
        fetch(`/api/pto?quarter_id=${selectedQuarter.id}&team_id=${selectedTeam.id}`),
        fetch(`/api/team-quarter-settings?team_id=${selectedTeam.id}&quarter_id=${selectedQuarter.id}`),
      ]);

      const holidaysData = await holidaysRes.json();
      const ptoEntries = await ptoRes.json();
      const teamSettings = await teamSettingsRes.json();

      setHolidays(holidaysData);

      // Use per-quarter settings if available, otherwise fall back to team/quarter defaults
      const settings = teamSettings.length > 0 ? teamSettings[0] : null;
      const totalEngineers = settings?.totalEngineers ?? selectedTeam.totalEngineers;
      const ktloEngineers = settings?.ktloEngineers ?? selectedTeam.ktloEngineers;
      const meetingTimePercentage = settings?.meetingTimePercentage ?? selectedQuarter.meetingTimePercentage;

      // PTO can be overridden per quarter, falls back to team default
      const ptoDaysPerEngineerValue = settings?.ptoDaysPerEngineer ?? selectedTeam?.ptoDaysPerEngineer ?? 0;

      // Store effective values (quarterly override or team default)
      setEffectiveTotalEngineers(totalEngineers);
      setEffectiveKtloEngineers(ktloEngineers);
      setEffectiveMeetingTimePercentage(meetingTimePercentage);
      setPtoDaysPerEngineer(ptoDaysPerEngineerValue);

      const calc = calculateQuarterCapacity(
        selectedQuarter,
        selectedTeam,
        holidaysData,
        ptoEntries,
        totalEngineers,
        ktloEngineers,
        meetingTimePercentage,
        ptoDaysPerEngineerValue
      );
      setCapacityCalc(calc);
    } catch (error) {
      console.error('Error calculating capacity:', error);
    }
  };

  const handleLinearSynced = () => {
    setShowLinearSync(false);
    // Sync cycles when importing new projects
    fetchExecutionData(true);
  };

  const handleAllocationUpdate = async (allocation: Partial<SprintAllocation>) => {
    try {
      // Only POST if there's actual data to update (not an empty object used just for refresh)
      if (Object.keys(allocation).length > 0) {
        await fetch('/api/allocations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(allocation),
        });
      }

      // Refresh data WITHOUT syncing cycles to avoid deleting sprints and allocations
      await fetchExecutionData(false);
    } catch (error) {
      console.error('Error updating allocation:', error);
      throw error;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Delete the project
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Refresh data WITHOUT syncing cycles
      await fetchExecutionData(false);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.plannedDays, 0);
  const totalCapacity = capacityCalc?.adjustedCapacityDays || 0;
  const isOverCapacity = totalAllocated > totalCapacity;

  // Calculate total planned weeks from WKS column
  const plannedWeeksTotal = projects.reduce((sum, p) => sum + (p.plannedWeeks || 0), 0);

  // Calculate forecasted capacity (actual for past sprints + planned for current/future)
  const forecastedCapacity = allocations.reduce((sum, alloc) => {
    const sprint = sprints.find(s => s.id === alloc.sprintId);
    if (!sprint) return sum;

    const today = new Date();
    const sprintEnd = new Date(sprint.endDate);

    // For past sprints: ONLY use actuals (even if 0)
    // For current/future sprints: use planned
    if (sprintEnd < today) {
      return sum + alloc.actualDays;
    } else {
      return sum + alloc.plannedDays;
    }
  }, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Execution Planning</h1>
          <p className="text-gray-600 mt-1">
            Track projects across sprints and monitor capacity utilization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchExecutionData(true)}
            className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
            title="Refresh cycles and projects from Linear"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh from Linear
          </button>
          <button
            onClick={syncActualsFromLinear}
            disabled={syncingActuals || !selectedTeam?.linearTeamId || sprints.length === 0}
            className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Calculate actual days from Linear issue state history"
          >
            <Clock className="w-4 h-4 mr-2" />
            {syncingActuals ? 'Syncing...' : 'Sync Actuals'}
          </button>
          <button
            onClick={() => setShowLinearSync(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            disabled={!selectedTeam?.linearTeamId}
            title={!selectedTeam?.linearTeamId ? "Link team to Linear first" : `Import projects from ${selectedTeam?.name}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Import Projects from Linear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
            <select
              value={selectedQuarter?.id || ''}
              onChange={(e) => {
                const quarter = quarters.find(q => q.id === e.target.value);
                setSelectedQuarter(quarter || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {quarters.map(quarter => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name} ({quarter.startDate} to {quarter.endDate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                setSelectedTeam(team || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({(team.totalEngineers || 0) - (team.ktloEngineers || 0)} engineers)
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedQuarter && selectedTeam && (
          <TeamQuarterSettings
            team={selectedTeam}
            quarter={selectedQuarter}
            onUpdate={() => {
              calculateCapacity();
              // Don't sync cycles when just updating settings
              fetchExecutionData(false);
            }}
          />
        )}

        {capacityCalc && (
          <CapacityIndicator
            totalCapacity={totalCapacity}
            allocatedCapacity={totalAllocated}
            plannedWeeksTotal={plannedWeeksTotal}
            forecastedCapacity={forecastedCapacity}
            isOverCapacity={isOverCapacity}
          />
        )}

        {sprints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {!selectedTeam?.linearTeamId
                ? 'Link this team to Linear to see cycles.'
                : 'No cycles found in Linear for this team.'}
            </p>
            <p className="text-sm text-gray-500">
              Cycles are automatically synced from Linear when you refresh.
            </p>
          </div>
        ) : (
          selectedQuarter && selectedTeam && (
            <ExecutionTable
              projects={projects}
              sprints={sprints}
              allocations={allocations}
              linearData={linearData}
              quarter={selectedQuarter}
              team={selectedTeam}
              holidays={holidays}
              ptoDaysPerEngineer={ptoDaysPerEngineer}
              totalEngineers={effectiveTotalEngineers}
              ktloEngineers={effectiveKtloEngineers}
              meetingTimePercentage={effectiveMeetingTimePercentage}
              onUpdateAllocation={handleAllocationUpdate}
              onDeleteProject={handleDeleteProject}
            />
          )
        )}
      </div>

      {showLinearSync && selectedQuarter && selectedTeam && (
        <LinearSync
          quarter={selectedQuarter}
          team={selectedTeam}
          onClose={() => setShowLinearSync(false)}
          onSync={handleLinearSynced}
        />
      )}
    </div>
  );
}
