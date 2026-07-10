'use client';

import { LeaveBalance } from '@/services/leaveService';

interface LeaveBalanceCardsProps {
  balances: LeaveBalance[];
  loading?: boolean;
}

function DonutChart({
  used,
  total,
  available,
  colorCode,
}: {
  used: number;
  total: number;
  available: number;
  colorCode: string;
}) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const usedPct = total > 0 ? Math.min(1, used / total) : 0;
  const dashArray = `${usedPct * circumference} ${circumference}`;
  // Lighter track color derived from the accent
  const trackOpacity = 0.15;

  return (
    <div className="relative w-[70px] h-[70px] flex-shrink-0">
      <svg viewBox="0 0 36 36" className="w-[70px] h-[70px] -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={colorCode}
          strokeWidth="3"
          opacity={trackOpacity}
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={colorCode}
          strokeWidth="3"
          strokeDasharray={dashArray}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-extrabold leading-none text-foreground">
          {available}
        </span>
        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground leading-tight">
          left
        </span>
      </div>
    </div>
  );
}

export default function LeaveBalanceCards({ balances, loading }: LeaveBalanceCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="enterprise-card p-5 flex items-center gap-4 animate-pulse">
            <div className="w-[70px] h-[70px] rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-4/5" />
              <div className="h-3 bg-muted rounded w-3/5" />
              <div className="h-1 bg-muted rounded w-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="enterprise-card p-6 text-center text-muted-foreground">
        No leave balances found for this cycle year.
      </div>
    );
  }

  const totalDays = (b: LeaveBalance) => b.entitledDays + b.carriedForwardDays;
  const usedDays = (b: LeaveBalance) => b.takenDays + b.pendingDays;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {balances.map((balance) => {
        const total = totalDays(balance) || 1;
        const used = usedDays(balance);
        const pct = Math.min(100, (used / total) * 100);

        return (
          <div
            key={balance.id}
            className="enterprise-card p-5 flex items-center gap-4"
          >
            <DonutChart
              used={used}
              total={totalDays(balance)}
              available={balance.availableDays}
              colorCode={balance.colorCode}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {balance.leaveTypeName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {used} of {totalDays(balance)} days used
              </p>
              {/* Progress bar */}
              <div className="mt-2 w-full h-1 bg-border rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500 ease-out"
                  style={{
                    backgroundColor: balance.colorCode,
                    width: `${pct}%`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
