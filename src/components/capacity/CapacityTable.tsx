'use client';

import { CapacityCalculation, Quarter } from '@/types';
import { calculateUtilization } from '@/lib/capacity';

interface CapacityTableProps {
  calculations: CapacityCalculation[];
  quarter: Quarter;
}

export default function CapacityTable({ calculations, quarter }: CapacityTableProps) {
  const totalCapacity = calculations.reduce((sum, calc) => sum + calc.adjusted_capacity_days, 0);
  const totalWeeks = calculations.reduce((sum, calc) => sum + calc.roadmap_planning_weeks, 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Team
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Engineers
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              KTLO Engineers
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Roadmap Engineers
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Working Days
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Focus Factor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PTO Days
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capacity (Days)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capacity (Weeks)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {calculations.map((calc) => (
            <tr key={calc.team.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{calc.team.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {calc.team.total_engineers}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {calc.team.ktlo_engineers}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                {calc.roadmap_engineers}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {calc.working_days}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {(calc.dev_focus_factor * 100).toFixed(0)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {calc.pto_adjustments.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                {calc.adjusted_capacity_days.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                {calc.roadmap_planning_weeks.toFixed(1)}
              </td>
            </tr>
          ))}
          {calculations.length > 1 && (
            <tr className="bg-gray-100 font-bold">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan={7}>
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                {totalCapacity.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                {totalWeeks.toFixed(1)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Total Quarter Capacity</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {totalCapacity.toFixed(1)} days
          </div>
          <div className="text-sm text-blue-700 mt-1">
            {totalWeeks.toFixed(1)} weeks
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Per Sprint Average</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {(totalWeeks / 13).toFixed(1)} weeks
          </div>
          <div className="text-sm text-green-700 mt-1">
            Assuming 13 sprints per quarter
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Total Roadmap Engineers</div>
          <div className="text-2xl font-bold text-purple-900 mt-1">
            {calculations.reduce((sum, calc) => sum + calc.roadmap_engineers, 0)}
          </div>
          <div className="text-sm text-purple-700 mt-1">
            Across all teams
          </div>
        </div>
      </div>
    </div>
  );
}
