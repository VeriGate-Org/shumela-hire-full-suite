'use client';

import React from 'react';
import RequisitionList from '@/components/RequisitionList';

export default function RequisitionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Requisitions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and track hiring requisitions through the approval workflow
        </p>
      </div>
      <RequisitionList showAll />
    </div>
  );
}
