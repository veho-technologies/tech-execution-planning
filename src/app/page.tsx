'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Initialize quarters on first load
    fetch('/api/init', { method: 'POST' }).catch(console.error);

    // Redirect to execution page
    router.push('/execution');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-gray-600">Redirecting to Execution Planning...</div>
    </div>
  );
}
