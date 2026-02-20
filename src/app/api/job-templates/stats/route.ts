import { NextResponse } from 'next/server';
import { jobTemplateService } from '../../../../services/jobTemplateService';

// GET /api/job-templates/stats - Get template usage statistics
export async function GET() {
  try {
    const stats = await jobTemplateService.getTemplateStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching template stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}