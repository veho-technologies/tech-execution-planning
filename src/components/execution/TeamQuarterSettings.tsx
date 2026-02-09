'use client';

import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Team, Quarter, TeamQuarterSettings } from '@/types';

interface TeamQuarterSettingsProps {
  team: Team;
  quarter: Quarter;
  onUpdate: () => void;
}

export default function TeamQuarterSettingsComponent({ team, quarter, onUpdate }: TeamQuarterSettingsProps) {
  const [settings, setSettings] = useState<TeamQuarterSettings | null>(null);
  const [totalEngineers, setTotalEngineers] = useState<number>(team.totalEngineers);
  const [ktloEngineers, setKtloEngineers] = useState<number>(team.ktloEngineers);
  const [meetingTimePercentage, setMeetingTimePercentage] = useState<number>(quarter.meetingTimePercentage);
  const [ptoDaysPerEngineer, setPtoDaysPerEngineer] = useState<number>(team.ptoDaysPerEngineer);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [team.id, quarter.id]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/team-quarter-settings?team_id=${team.id}&quarter_id=${quarter.id}`);
      const data = await res.json();

      if (data.length > 0) {
        setSettings(data[0]);
        setTotalEngineers(data[0].totalEngineers);
        setKtloEngineers(data[0].ktloEngineers);
        setMeetingTimePercentage(data[0].meetingTimePercentage);
        setPtoDaysPerEngineer(data[0].ptoDaysPerEngineer);
      } else {
        setSettings(null);
        setTotalEngineers(team.totalEngineers);
        setKtloEngineers(team.ktloEngineers);
        setMeetingTimePercentage(quarter.meetingTimePercentage);
        setPtoDaysPerEngineer(team.ptoDaysPerEngineer);
      }
    } catch (error) {
      console.error('Error fetching team quarter settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/team-quarter-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: team.id,
          quarter_id: quarter.id,
          total_engineers: totalEngineers,
          ktlo_engineers: ktloEngineers,
          meeting_time_percentage: meetingTimePercentage,
          pto_days_per_engineer: ptoDaysPerEngineer,
        }),
      });

      setShowForm(false);
      onUpdate();
      fetchSettings();
    } catch (error) {
      console.error('Error saving team quarter settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  const roadmapEngineers = Math.max(0, totalEngineers - ktloEngineers);
  const usingDefaults = settings === null;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm">
          <Settings className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-indigo-900">Team Capacity</span>
          {!showForm && (
            <>
              <span className="text-gray-600">•</span>
              <span className="text-gray-700">
                <span className="font-medium">{totalEngineers}</span> total
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-700">
                <span className="font-medium">{ktloEngineers}</span> KTLO
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-indigo-900 font-medium">
                {roadmapEngineers} roadmap
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-700">
                <span className="font-medium">{(meetingTimePercentage * 100).toFixed(0)}%</span> meetings
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-700">
                <span className="font-medium">{ptoDaysPerEngineer}</span> PTO days
              </span>
            </>
          )}
          {usingDefaults && !showForm && (
            <>
              <span className="text-gray-600">•</span>
              <span className="text-orange-600 text-xs">Using defaults</span>
            </>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Configure
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-2 pt-2 border-t border-indigo-200 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700 w-24">Total Engineers:</label>
              <input
                type="number"
                value={totalEngineers}
                onChange={(e) => setTotalEngineers(parseFloat(e.target.value) || 0)}
                step="0.5"
                min="0"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700 w-24">KTLO Engineers:</label>
              <input
                type="number"
                value={ktloEngineers}
                onChange={(e) => setKtloEngineers(parseFloat(e.target.value) || 0)}
                step="0.5"
                min="0"
                max={totalEngineers}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700 w-24">Meeting Time %:</label>
              <input
                type="number"
                value={(meetingTimePercentage * 100).toFixed(0)}
                onChange={(e) => setMeetingTimePercentage((parseFloat(e.target.value) || 0) / 100)}
                step="5"
                min="0"
                max="100"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-600">%</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700 w-24">PTO Days/Eng:</label>
              <input
                type="number"
                value={ptoDaysPerEngineer}
                onChange={(e) => setPtoDaysPerEngineer(parseFloat(e.target.value) || 0)}
                step="0.5"
                min="0"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <span className="text-xs text-indigo-800">
              Roadmap Engineers: <strong>{roadmapEngineers.toFixed(1)}</strong> •
              Dev Focus: <strong>{((1 - meetingTimePercentage) * 100).toFixed(0)}%</strong>
            </span>
            <div className="flex-1"></div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                fetchSettings();
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
