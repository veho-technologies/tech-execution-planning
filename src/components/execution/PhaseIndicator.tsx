import { ProjectPhase } from '@/types';

interface PhaseIndicatorProps {
  phase: ProjectPhase;
}

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const colors: Record<ProjectPhase, string> = {
    'Tech Spec': 'bg-purple-100 text-purple-800',
    'Execution': 'bg-blue-100 text-blue-800',
    'UAT': 'bg-orange-100 text-orange-800',
    'Rollout': 'bg-green-100 text-green-800',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[phase]}`}>
      {phase}
    </span>
  );
}
