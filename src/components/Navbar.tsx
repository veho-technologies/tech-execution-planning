'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Tech Execution Planning
            </span>
          </Link>

          <div className="flex items-center space-x-1">
            <Link
              href="/execution"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith('/execution')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Execution
            </Link>

            <Link
              href="/teams"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith('/teams')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Teams
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
