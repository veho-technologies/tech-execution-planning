// Shared status color mapping for project statuses
export function getStatusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-500';

  const statusLower = status.toLowerCase();

  // Completed/Done statuses - Green
  if (statusLower.includes('done') || statusLower.includes('complete') || statusLower.includes('shipped') || statusLower.includes('released')) {
    return 'bg-green-100 text-green-800 border border-green-300';
  }

  // Active work statuses - Blue/Purple
  if (statusLower.includes('progress') || statusLower.includes('building') || statusLower.includes('development') || statusLower.includes('rolling')) {
    return 'bg-blue-100 text-blue-800 border border-blue-300';
  }

  // Planning/Design statuses - Purple
  if (statusLower.includes('planning') || statusLower.includes('design') || statusLower.includes('scoping')) {
    return 'bg-purple-100 text-purple-800 border border-purple-300';
  }

  // Review/Testing statuses - Yellow
  if (statusLower.includes('review') || statusLower.includes('testing') || statusLower.includes('qa')) {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
  }

  // Blocked/Paused statuses - Red
  if (statusLower.includes('blocked') || statusLower.includes('paused') || statusLower.includes('hold')) {
    return 'bg-red-100 text-red-800 border border-red-300';
  }

  // Backlog/Not started - Gray
  if (statusLower.includes('backlog') || statusLower.includes('todo') || statusLower.includes('not started')) {
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  }

  // Canceled - Dark gray
  if (statusLower.includes('cancel') || statusLower.includes('deprecated')) {
    return 'bg-gray-200 text-gray-600 border border-gray-400';
  }

  // Default - Light gray
  return 'bg-gray-100 text-gray-700 border border-gray-300';
}
