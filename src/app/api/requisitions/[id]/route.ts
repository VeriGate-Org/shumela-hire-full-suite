import { NextRequest, NextResponse } from 'next/server';
import { requisitionService } from '../../../../services/requisitionService';
import { auditLogService } from '../../../../services/auditLogService';

// GET /api/requisitions/[id] - Get specific requisition
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    const requisition = await requisitionService.getRequisition(params.id);

    if (!requisition) {
      return NextResponse.json(
        { success: false, message: 'Requisition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: requisition
    });

  } catch (error) {
    console.error('Error fetching requisition:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/requisitions/[id] - Update requisition
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const {
      jobTitle,
      department,
      location,
      employmentType,
      salaryMin,
      salaryMax,
      description,
      userId = 'demo_user',
      userRole = 'HR_MANAGER'
    } = body;

    // Get current requisition to track changes
    const currentRequisition = await requisitionService.getRequisition(params.id);
    if (!currentRequisition) {
      return NextResponse.json(
        { success: false, message: 'Requisition not found' },
        { status: 404 }
      );
    }

    // Build updates object
    const updates: Record<string, unknown> = {};
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (department !== undefined) updates.department = department;
    if (location !== undefined) updates.location = location;
    if (employmentType !== undefined) updates.employmentType = employmentType;
    if (salaryMin !== undefined) updates.salaryMin = Number(salaryMin);
    if (salaryMax !== undefined) updates.salaryMax = Number(salaryMax);
    if (description !== undefined) updates.description = description;

    // Update requisition
    const updatedRequisition = await requisitionService.updateRequisition(params.id, updates);

    if (!updatedRequisition) {
      return NextResponse.json(
        { success: false, message: 'Failed to update requisition' },
        { status: 500 }
      );
    }

    // Log update
    await auditLogService.logRequisitionUpdated(
      params.id,
      userId,
      userRole,
      updates
    );

    return NextResponse.json({
      success: true,
      message: 'Requisition updated successfully',
      data: updatedRequisition
    });

  } catch (error) {
    console.error('Error updating requisition:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/requisitions/[id] - Delete requisition
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';
    const userRole = searchParams.get('userRole') || 'HR_MANAGER';

    const deleted = await requisitionService.deleteRequisition(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Requisition not found' },
        { status: 404 }
      );
    }

    // Log deletion
    await auditLogService.logWorkflowTransition(
      params.id,
      'delete',
      'unknown',
      'deleted',
      userId,
      userRole
    );

    return NextResponse.json({
      success: true,
      message: 'Requisition deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting requisition:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}