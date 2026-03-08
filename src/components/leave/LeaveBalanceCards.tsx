'use client';

import { LeaveBalance } from '@/services/leaveService';

interface LeaveBalanceCardsProps {
  balances: LeaveBalance[];
  loading?: boolean;
}

export default function LeaveBalanceCards({ balances, loading }: LeaveBalanceCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow border p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">
        No leave balances found for this cycle year.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {balances.map((balance) => (
        <div
          key={balance.id}
          className="bg-white rounded-lg shadow border p-4 relative overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 w-1 h-full"
            style={{ backgroundColor: balance.colorCode }}
          />
          <div className="pl-3">
            <p className="text-sm font-medium text-gray-600">{balance.leaveTypeName}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {balance.availableDays}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              of {balance.entitledDays + balance.carriedForwardDays} days available
            </p>
            <div className="mt-3 flex gap-3 text-xs text-gray-500">
              <span>Taken: {balance.takenDays}</span>
              <span>Pending: {balance.pendingDays}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full"
                style={{
                  backgroundColor: balance.colorCode,
                  width: `${Math.min(100, ((balance.takenDays + balance.pendingDays) / (balance.entitledDays + balance.carriedForwardDays || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
