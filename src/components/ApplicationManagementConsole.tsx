'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api-fetch';

interface Application {
  id: number;
  candidateName: string;
  email: string;
  jobTitle: string;
  department: string;
  status: string;
  pipelineStage: string;
  rating: number;
  submittedAt: string;
  lastUpdated: string;
}

/** Map raw backend Application entity or DTO to the frontend Application shape */
function mapApplication(raw: any): Application {
  // Build candidate name from DTO field or nested applicant entity
  let candidateName = raw.candidateName || raw.applicantName || '';
  if (!candidateName && raw.applicant) {
    candidateName = raw.applicant.fullName
      || `${raw.applicant.firstName || raw.applicant.name || ''} ${raw.applicant.lastName || raw.applicant.surname || ''}`.trim();
  }

  const email = raw.email || raw.applicantEmail || raw.applicant?.email || '';
  const jobTitle = raw.jobTitle || raw.jobPosting?.title || '';
  const department = raw.department || raw.jobPosting?.department || '';
  const pipelineStage = raw.pipelineStage || raw.pipelineStageDisplayName || '';

  return {
    id: raw.id,
    candidateName,
    email,
    jobTitle,
    department,
    status: raw.status || '',
    pipelineStage,
    rating: raw.rating ?? 0,
    submittedAt: raw.submittedAt || raw.createdAt || '',
    lastUpdated: raw.lastUpdated || raw.updatedAt || '',
  };
}

interface SearchFilters {
  searchTerm: string;
  statuses: string[];
  departments: string[];
  jobTitle: string;
  dateFrom: string;
  dateTo: string;
  minRating: number;
  maxRating: number;
  sortBy: string;
  sortDirection: string;
  page: number;
  size: number;
}

interface BulkOperation {
  type: 'status' | 'rating' | 'stage';
  value: any;
  applicationIds: number[];
}

export default function ApplicationManagementConsole() {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    statuses: [],
    departments: [],
    jobTitle: '',
    dateFrom: '',
    dateTo: '',
    minRating: 0,
    maxRating: 5,
    sortBy: 'submittedAt',
    sortDirection: 'desc',
    page: 0,
    size: 20
  });

  const [bulkOperation, setBulkOperation] = useState<BulkOperation>({
    type: 'status',
    value: '',
    applicationIds: []
  });

  const [statistics, setStatistics] = useState({
    totalApplications: 0,
    newApplications: 0,
    inReviewApplications: 0,
    averageRating: 0
  });

  const [statusOptions, setStatusOptions] = useState<string[]>(['SUBMITTED', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'REFERENCE_CHECK', 'OFFER_PENDING', 'OFFERED', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'REJECTED', 'WITHDRAWN', 'HIRED']);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations']);
  const [stageOptions, setStageOptions] = useState<string[]>(['APPLICATION', 'SCREENING', 'INTERVIEW', 'TECHNICAL', 'FINAL', 'OFFER']);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await apiFetch('/api/applications/manage/filter-options');
        if (response.ok) {
          const data = await response.json();
          if (data.statuses?.length) setStatusOptions(data.statuses);
          if (data.departments?.length) setDepartmentOptions(data.departments);
          if (data.pipelineStages?.length) setStageOptions(data.pipelineStages);
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  const searchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters.statuses.length > 0) filters.statuses.forEach(s => params.append('statuses', s));
      if (filters.departments.length > 0) filters.departments.forEach(d => params.append('departments', d));
      if (filters.jobTitle) params.append('jobTitle', filters.jobTitle);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.minRating > 0) params.append('minRating', String(filters.minRating));
      if (filters.maxRating < 5) params.append('maxRating', String(filters.maxRating));
      params.append('sortBy', filters.sortBy);
      params.append('sortDirection', filters.sortDirection);
      params.append('page', String(filters.page));
      params.append('size', String(filters.size));

      const response = await apiFetch(`/api/applications/manage/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const rawList = data.content || data.applications || [];
        setApplications(rawList.map(mapApplication));
        setTotalElements(data.totalElements || data.total || 0);
      } else {
        setError('Failed to load applications');
        setApplications([]);
      }
    } catch (err) {
      console.error('Error searching applications:', err);
      setError('Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    searchApplications();
    fetchStatistics();
  }, [searchApplications]);

  const [statsError, setStatsError] = useState(false);

  const fetchStatistics = async () => {
    try {
      setStatsError(false);
      const response = await apiFetch('/api/applications/manage/statistics');
      if (response.ok) {
        const data = await response.json();
        setStatistics({
          totalApplications: data.totalApplications ?? 0,
          newApplications: data.newApplications ?? 0,
          inReviewApplications: data.inReviewApplications ?? 0,
          averageRating: data.averageRating ?? 0
        });
      } else {
        setStatsError(true);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setStatsError(true);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
  };

  const handleSelectApplication = (applicationId: number) => {
    setSelectedApplications(prev =>
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(app => app.id));
    }
  };

  const handleViewApplication = (applicationId: number) => {
    router.push(`/applications/${applicationId}`);
  };

  const handleReviewApplication = async (applicationId: number) => {
    try {
      const response = await apiFetch(`/api/applications/${applicationId}/status?status=SCREENING`, {
        method: 'PUT',
      });
      if (response.ok) {
        searchApplications();
        fetchStatistics();
      }
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  const handleRejectApplication = async (applicationId: number) => {
    if (!confirm('Are you sure you want to reject this application?')) return;
    try {
      const response = await apiFetch(`/api/applications/${applicationId}/status?status=REJECTED`, {
        method: 'PUT',
      });
      if (response.ok) {
        searchApplications();
        fetchStatistics();
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
    }
  };

  const executeBulkOperation = async () => {
    if (selectedApplications.length === 0) return;
    if (!bulkOperation.value) {
      toast('Please select a value for the bulk operation', 'error');
      return;
    }

    try {
      const bulkPayload: Record<string, any> = { applicationIds: selectedApplications };
      let endpoint = '';

      if (bulkOperation.type === 'status') {
        endpoint = '/api/applications/manage/bulk/status';
        bulkPayload.status = bulkOperation.value;
      } else if (bulkOperation.type === 'rating') {
        endpoint = '/api/applications/manage/bulk/rating';
        const ratingsMap: Record<string, number> = {};
        for (const appId of selectedApplications) {
          ratingsMap[String(appId)] = parseInt(bulkOperation.value);
        }
        bulkPayload.ratings = ratingsMap;
      } else if (bulkOperation.type === 'stage') {
        endpoint = '/api/applications/manage/bulk/pipeline-stage';
        bulkPayload.pipelineStage = bulkOperation.value;
      }

      const response = await apiFetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkPayload),
      });

      if (response.ok) {
        const result = await response.json().catch(() => null);
        const updatedCount = result?.updatedIds?.length ?? selectedApplications.length;
        const errorCount = result?.errors?.length ?? 0;

        if (errorCount > 0 && updatedCount > 0) {
          toast(`Updated ${updatedCount} application(s). ${errorCount} failed.`, 'info');
        } else if (errorCount > 0 && updatedCount === 0) {
          toast(`All ${errorCount} operations failed`, 'error');
        } else {
          toast(`Updated ${updatedCount} application(s)`, 'success');
        }

        setSelectedApplications([]);
        setShowBulkActions(false);
        searchApplications();
        fetchStatistics();
      } else {
        toast('Error executing bulk operation', 'error');
      }
    } catch (err) {
      console.error('Error executing bulk operation:', err);
      toast('Error executing bulk operation', 'error');
    }
  };

  const exportApplications = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters.statuses.length > 0) filters.statuses.forEach(s => params.append('statuses', s));
      if (filters.departments.length > 0) filters.departments.forEach(d => params.append('departments', d));
      params.append('format', 'csv');

      const response = await apiFetch(`/api/applications/manage/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'applications-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast('Error exporting applications', 'error');
      }
    } catch (err) {
      console.error('Error exporting applications:', err);
      toast('Error exporting applications', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // TODO: Consolidate with backend-provided statusCssClass from ApplicationResponse
  const getStatusColor = (status: string) => {
    const colors = {
      APPLIED: 'bg-gold-100 text-gold-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      INTERVIEWED: 'bg-purple-100 text-purple-800',
      OFFERED: 'bg-green-100 text-green-800',
      HIRED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        &#9733;
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white rounded-sm shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Application Management Console</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Filters
            </button>
            <button
              onClick={exportApplications}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Export
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gold-50 p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gold-600">Total Applications</p>
              {statsError && <span className="text-orange-500 text-xs" title="Failed to load statistics">&#9888;</span>}
            </div>
            <p className="text-2xl font-bold text-violet-900">{statistics.totalApplications}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-600">New Applications</p>
              {statsError && <span className="text-orange-500 text-xs" title="Failed to load statistics">&#9888;</span>}
            </div>
            <p className="text-2xl font-bold text-green-900">{statistics.newApplications}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-yellow-600">In Review</p>
              {statsError && <span className="text-orange-500 text-xs" title="Failed to load statistics">&#9888;</span>}
            </div>
            <p className="text-2xl font-bold text-yellow-900">{statistics.inReviewApplications}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-purple-600">Avg Rating</p>
              {statsError && <span className="text-orange-500 text-xs" title="Failed to load statistics">&#9888;</span>}
            </div>
            <p className="text-2xl font-bold text-purple-900">{statistics.averageRating.toFixed(1)}</p>
          </div>
        </div>

        {/* Basic Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by candidate name, email, or job title..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/60"
          >
            Search
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-sm shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                multiple
                value={filters.statuses}
                onChange={(e) => handleFilterChange('statuses', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                multiple
                value={filters.departments}
                onChange={(e) => handleFilterChange('departments', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60"
              >
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  max="5"
                  placeholder="Min"
                  value={filters.minRating || ''}
                  onChange={(e) => handleFilterChange('minRating', parseInt(e.target.value) || 0)}
                  className="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60"
                />
                <input
                  type="number"
                  min="0"
                  max="5"
                  placeholder="Max"
                  value={filters.maxRating || ''}
                  onChange={(e) => handleFilterChange('maxRating', parseInt(e.target.value) || 5)}
                  className="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="datetime-local"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="datetime-local"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60"
                >
                  <option value="submittedAt">Submit Date</option>
                  <option value="lastUpdated">Last Updated</option>
                  <option value="rating">Rating</option>
                  <option value="candidateName">Candidate Name</option>
                </select>
                <select
                  value={filters.sortDirection}
                  onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
                  className="border border-gray-300 rounded-sm px-3 py-2 focus:ring-2 focus:ring-gold-500/60"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({
                  searchTerm: '',
                  statuses: [],
                  departments: [],
                  jobTitle: '',
                  dateFrom: '',
                  dateTo: '',
                  minRating: 0,
                  maxRating: 5,
                  sortBy: 'submittedAt',
                  sortDirection: 'desc',
                  page: 0,
                  size: 20
                });
                searchApplications();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (
        <div className="bg-white rounded-sm shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {selectedApplications.length} application(s) selected
              </span>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-[#05527E] text-white rounded-full hover:opacity-90 text-sm"
              >
                Bulk Actions
              </button>
            </div>
            <button
              onClick={() => setSelectedApplications([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Selection
            </button>
          </div>

          {showBulkActions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-sm">
              <div className="flex items-center space-x-4">
                <select
                  value={bulkOperation.type}
                  onChange={(e) => setBulkOperation(prev => ({ ...prev, type: e.target.value as any }))}
                  className="border border-gray-300 rounded-sm px-3 py-2"
                >
                  <option value="status">Update Status</option>
                  <option value="rating">Set Rating</option>
                  <option value="stage">Change Stage</option>
                </select>

                {bulkOperation.type === 'status' && (
                  <select
                    value={bulkOperation.value}
                    onChange={(e) => setBulkOperation(prev => ({ ...prev, value: e.target.value }))}
                    className="border border-gray-300 rounded-sm px-3 py-2"
                  >
                    <option value="">Select Status</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                )}

                {bulkOperation.type === 'rating' && (
                  <select
                    value={bulkOperation.value}
                    onChange={(e) => setBulkOperation(prev => ({ ...prev, value: e.target.value }))}
                    className="border border-gray-300 rounded-sm px-3 py-2"
                  >
                    <option value="">Select Rating</option>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                )}

                {bulkOperation.type === 'stage' && (
                  <select
                    value={bulkOperation.value}
                    onChange={(e) => setBulkOperation(prev => ({ ...prev, value: e.target.value }))}
                    className="border border-gray-300 rounded-sm px-3 py-2"
                  >
                    <option value="">Select Stage</option>
                    {stageOptions.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={executeBulkOperation}
                  disabled={!bulkOperation.value}
                  className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-300"
                >
                  Execute
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-red-700 text-sm">
          {error}
          <button onClick={searchApplications} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white rounded-sm shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedApplications.length === applications.length && applications.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-gold-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(application.id)}
                        onChange={() => handleSelectApplication(application.id)}
                        className="rounded border-gray-300 text-gold-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.candidateName || 'Unknown Candidate'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.jobTitle}</div>
                      <div className="text-sm text-gray-500">{application.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.pipelineStage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {renderStars(application.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          ({application.rating})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(application.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewApplication(application.id)}
                        className="text-gold-600 hover:text-violet-900 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleReviewApplication(application.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleRejectApplication(application.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {applications.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleFilterChange('page', Math.max(0, filters.page - 1))}
                disabled={filters.page === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={(filters.page + 1) * filters.size >= totalElements}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{filters.page * filters.size + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min((filters.page + 1) * filters.size, totalElements)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalElements}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-sm shadow-sm -space-x-px">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(0, filters.page - 1))}
                    disabled={filters.page === 0}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={(filters.page + 1) * filters.size >= totalElements}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
