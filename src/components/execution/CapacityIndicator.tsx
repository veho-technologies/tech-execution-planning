'use client';

import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface CapacityIndicatorProps {
  totalCapacity: number;
  allocatedCapacity: number;
  plannedWeeksTotal: number;
  forecastedCapacity: number;
  isOverCapacity: boolean;
}

export default function CapacityIndicator({
  totalCapacity,
  allocatedCapacity,
  plannedWeeksTotal,
  forecastedCapacity,
  isOverCapacity,
}: CapacityIndicatorProps) {
  const plannedWeeksDays = plannedWeeksTotal * 5;
  const plannedWeeksPercent = totalCapacity > 0 ? (plannedWeeksDays / totalCapacity) * 100 : 0;
  const forecastPercent = totalCapacity > 0 ? (forecastedCapacity / totalCapacity) * 100 : 0;
  const allocatedPercent = totalCapacity > 0 ? (allocatedCapacity / totalCapacity) * 100 : 0;

  const isPlannedWeeksOver = plannedWeeksDays > totalCapacity;
  const isForecastOver = forecastedCapacity > totalCapacity;

  const CapacityRow = ({
    label,
    value,
    percent,
    isOver,
    icon
  }: {
    label: string;
    value: number;
    percent: number;
    isOver: boolean;
    icon?: React.ReactNode;
  }) => {
    const available = totalCapacity - value;

    return (
      <div className="flex items-center justify-between text-sm py-1.5">
        <div className="flex items-center space-x-3">
          {icon}
          <span className="font-medium text-gray-700 w-32">{label}</span>
          <span className="text-gray-700">
            <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-blue-600'}`}>
              {value.toFixed(1)}d
            </span>
            <span className="text-gray-500"> / {totalCapacity.toFixed(1)}d</span>
          </span>
          <span className={`font-medium ${available < 0 ? 'text-red-600' : 'text-green-600'} w-24`}>
            {available >= 0 ? '+' : ''}{available.toFixed(1)}d
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <span className={`font-bold w-12 text-right ${isOver ? 'text-red-700' : 'text-blue-700'}`}>
            {percent.toFixed(0)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Quarter Capacity Overview</h3>
        {(isPlannedWeeksOver || isForecastOver) ? (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-semibold">Over Capacity</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Within Capacity</span>
          </div>
        )}
      </div>

      <div className="space-y-1 divide-y divide-gray-100">
        <CapacityRow
          label="Planned (WKS)"
          value={plannedWeeksDays}
          percent={plannedWeeksPercent}
          isOver={isPlannedWeeksOver}
          icon={<span className="text-purple-600 text-xs">📋</span>}
        />

        <CapacityRow
          label="Forecasted"
          value={forecastedCapacity}
          percent={forecastPercent}
          isOver={isForecastOver}
          icon={<TrendingUp className="w-3.5 h-3.5 text-orange-600" />}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-start space-x-4">
          <div>
            <span className="font-medium">📋 Planned:</span> Total from WKS column ({plannedWeeksTotal.toFixed(1)} weeks) - for quarterly planning
          </div>
          <div>
            <span className="font-medium">📈 Forecasted:</span> Past actuals + future/current planned - how we're tracking
          </div>
        </div>
      </div>
    </div>
  );
}
