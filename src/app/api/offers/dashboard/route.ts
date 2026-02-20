import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Replace with actual database queries
  const dashboardCounts = {
    totalOffers: 0,
    pendingOffers: 0,
    activeNegotiations: 0,
    recentAcceptances: 0,
    expiringSoon: 0,
    averageSalary: 0,
    totalValue: 0,
  };

  return NextResponse.json(dashboardCounts);
}
