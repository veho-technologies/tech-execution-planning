import { ProjectPhase, parsePhases } from '@/types';

interface PhaseIndicatorProps {
  phase: ProjectPhase | string;
}

const colors: Record<ProjectPhase, string> = {
  'Tech Spec': 'bg-purple-100 text-purple-800',
  'Execution': 'bg-blue-100 text-blue-800',
  'Developer Testing': 'bg-yellow-100 text-yellow-800',
  'UAT': 'bg-orange-100 text-orange-800',
  'Rollout': 'bg-green-100 text-green-800',
};

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const phases = parsePhases(phase);

  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {phases.map((p) => (
        <span
          key={p}
          className={`text-xs px-2 py-0.5 rounded font-medium ${colors[p] || 'bg-gray-100 text-gray-800'}`}
        >
          {p}
        </span>
      ))}
    </div>
  );
}
