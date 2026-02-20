import { NextResponse } from 'next/server';
import { jobAdService } from '../../../../services/jobAdService';

// GET /api/ads/stats - Get job ad statistics
export async function GET() {
  try {
    const stats = await jobAdService.getStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching job ad stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}