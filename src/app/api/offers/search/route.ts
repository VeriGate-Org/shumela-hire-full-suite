import { NextRequest, NextResponse } from 'next/server';

interface Offer {
  id: number;
  offerNumber: string;
  version: number;
  status: string;
  statusDisplayName: string;
  statusIcon: string;
  statusCssClass: string;
  offerType: string;
  negotiationStatus: string;
  negotiationStatusDisplayName: string;
  negotiationStatusIcon: string;
  negotiationStatusCssClass: string;
  jobTitle: string;
  department: string;
  baseSalary: number;
  currency: string;
  totalCompensation: number;
  startDate: string;
  offerExpiryDate: string;
  offerSentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  negotiationRounds: number;
  application: {
    id: number;
    applicant: {
      firstName: string;
      lastName: string;
      email: string;
    };
    jobPosting: {
      title: string;
      department: string;
    };
  };
  createdAt: string;
  createdBy: number;
}

const mockOffers: any[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  const status = searchParams.get('status');
  const offerType = searchParams.get('offerType');
  const department = searchParams.get('department');
  const minSalary = searchParams.get('minSalary');
  const maxSalary = searchParams.get('maxSalary');

  let filteredOffers = [...mockOffers];

  // Apply filters
  if (status) {
    filteredOffers = filteredOffers.filter(offer => offer.status === status);
  }
  if (offerType) {
    filteredOffers = filteredOffers.filter(offer => offer.offerType === offerType);
  }
  if (department) {
    filteredOffers = filteredOffers.filter(offer => 
      offer.department.toLowerCase().includes(department.toLowerCase())
    );
  }
  if (minSalary) {
    filteredOffers = filteredOffers.filter(offer => offer.baseSalary >= parseInt(minSalary));
  }
  if (maxSalary) {
    filteredOffers = filteredOffers.filter(offer => offer.baseSalary <= parseInt(maxSalary));
  }

  // Pagination
  const startIndex = page * size;
  const endIndex = startIndex + size;
  const paginatedOffers = filteredOffers.slice(startIndex, endIndex);

  return NextResponse.json({
    content: paginatedOffers,
    totalElements: filteredOffers.length,
    totalPages: Math.ceil(filteredOffers.length / size),
    currentPage: page,
    size: size,
    first: page === 0,
    last: page >= Math.ceil(filteredOffers.length / size) - 1
  });
}
