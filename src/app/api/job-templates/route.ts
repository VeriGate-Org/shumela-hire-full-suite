import { NextRequest, NextResponse } from 'next/server';
import { jobTemplateService } from '../../../services/jobTemplateService';
import { TemplateFilters } from '../../../types/jobTemplate';

// GET /api/job-templates - Get all templates with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: TemplateFilters = {};
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }
    if (searchParams.get('employmentType')) {
      filters.employmentType = searchParams.get('employmentType')!;
    }
    if (searchParams.get('location')) {
      filters.location = searchParams.get('location')!;
    }
    if (searchParams.get('createdBy')) {
      filters.createdBy = searchParams.get('createdBy')!;
    }
    if (searchParams.get('showArchived')) {
      filters.showArchived = searchParams.get('showArchived') === 'true';
    }

    const templates = await jobTemplateService.getAllTemplates(filters);

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error fetching job templates:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/job-templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      title,
      intro,
      responsibilities,
      requirements,
      benefits,
      location,
      employmentType,
      salaryRangeMin,
      salaryRangeMax,
      closingDate,
      contactEmail,
      isArchived = false,
      createdBy = 'demo_user@company.com'
    } = body;

    // Validate required fields
    if (!name || !title || !contactEmail) {
      return NextResponse.json(
        { success: false, message: 'Name, title, and contact email are required' },
        { status: 400 }
      );
    }

    const templateData = {
      name,
      description,
      title,
      intro: intro || '',
      responsibilities: responsibilities || '',
      requirements: requirements || '',
      benefits: benefits || '',
      location: location || '',
      employmentType: employmentType || 'Full-time',
      salaryRangeMin: salaryRangeMin ? Number(salaryRangeMin) : undefined,
      salaryRangeMax: salaryRangeMax ? Number(salaryRangeMax) : undefined,
      closingDate: closingDate ? new Date(closingDate) : undefined,
      contactEmail,
      isArchived,
      createdBy
    };

    const template = await jobTemplateService.createTemplate(templateData, createdBy);

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      data: template
    });

  } catch (error) {
    console.error('Error creating job template:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}