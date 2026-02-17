'use client';

import React, { useState, useEffect } from 'react';
// Using placeholder icons - install lucide-react or replace with your preferred icon library
const Search = ({ className }: { className?: string }) => <span className={className}>🔍</span>;
const Filter = ({ className }: { className?: string }) => <span className={className}>🔽</span>;
const Download = ({ className }: { className?: string }) => <span className={className}>💾</span>;
const Users = ({ className }: { className?: string }) => <span className={className}>👥</span>;
const Star = ({ className }: { className?: string }) => <span className={className}>⭐</span>;
const Clock = ({ className }: { className?: string }) => <span className={className}>⏰</span>;
const CheckCircle = ({ className }: { className?: string }) => <span className={className}>✅</span>;

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
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
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

  // Available filter options
  const statusOptions = ['APPLIED', 'UNDER_REVIEW', 'INTERVIEWED', 'OFFERED', 'HIRED', 'REJECTED'];
  const departmentOptions = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
  const stageOptions = ['APPLICATION', 'SCREENING', 'INTERVIEW', 'TECHNICAL', 'FINAL', 'OFFER'];

  useEffect(() => {
    searchApplications();
    fetchStatistics();
  }, [filters.page, filters.size, filters.sortBy, filters.sortDirection]);

  const searchApplications = async () => {
    setLoading(true);
    try {
      // Mock data instead of API call
      const mockApplications: Application[] = [
        {
          id: 1,
          candidateName: 'John Doe',
          email: 'john.doe@email.com',
          jobTitle: 'Senior Software Engineer',
          department: 'Engineering',
          status: 'UNDER_REVIEW',
          pipelineStage: 'INTERVIEW',
          rating: 4.2,
          submittedAt: '2024-01-15T10:00:00Z',
          lastUpdated: '2024-01-16T14:30:00Z'
        },
        {
          id: 2,
          candidateName: 'Jane Smith',
          email: 'jane.smith@email.com',
          jobTitle: 'Product Manager',
          department: 'Product',
          status: 'INTERVIEWED',
          pipelineStage: 'FINAL',
          rating: 4.8,
          submittedAt: '2024-01-10T14:30:00Z',
          lastUpdated: '2024-01-17T09:15:00Z'
        },
        {
          id: 3,
          candidateName: 'Mike Johnson',
          email: 'mike.johnson@email.com',
          jobTitle: 'UX Designer',
          department: 'Design',
          status: 'APPLIED',
          pipelineStage: 'APPLICATION',
          rating: 3.9,
          submittedAt: '2024-01-18T11:20:00Z',
          lastUpdated: '2024-01-18T11:20:00Z'
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Apply basic filtering based on search term
      let filteredApps = mockApplications;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredApps = mockApplications.filter(app => 
          app.candidateName.toLowerCase().includes(searchLower) ||
          app.email.toLowerCase().includes(searchLower) ||
          app.jobTitle.toLowerCase().includes(searchLower) ||
          app.department.toLowerCase().includes(searchLower)
        );
      }

      setApplications(filteredApps);
      setTotalElements(filteredApps.length);
    } catch (error) {
      console.error('Error searching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Mock statistics data instead of API call
      const mockStats = {
        totalApplications: 245,
        newApplications: 18,
        inReviewApplications: 42,
        averageRating: 4.2
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStatistics(mockStats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 0 }));
    searchApplications();
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

  const executeBulkOperation = async () => {
    if (selectedApplications.length === 0) return;

    try {
      // Mock bulk operation instead of API calls
      console.log('Executing bulk operation:', {
        type: bulkOperation.type,
        value: bulkOperation.value,
        applicationIds: selectedApplications
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state to reflect the bulk operation
      if (bulkOperation.type === 'status') {
        setApplications(prev => prev.map(app => 
          selectedApplications.includes(app.id) 
            ? { ...app, status: bulkOperation.value, lastUpdated: new Date().toISOString() }
            : app
        ));
      } else if (bulkOperation.type === 'rating') {
        setApplications(prev => prev.map(app => 
          selectedApplications.includes(app.id) 
            ? { ...app, rating: parseInt(bulkOperation.value), lastUpdated: new Date().toISOString() }
            : app
        ));
      } else if (bulkOperation.type === 'stage') {
        setApplications(prev => prev.map(app => 
          selectedApplications.includes(app.id) 
            ? { ...app, pipelineStage: bulkOperation.value, lastUpdated: new Date().toISOString() }
            : app
        ));
      }

      setSelectedApplications([]);
      setShowBulkActions(false);
      alert(`Bulk operation completed successfully. Updated ${selectedApplications.length} applications.`);
    } catch (error) {
      console.error('Error executing bulk operation:', error);
      alert('Error executing bulk operation');
    }
  };

  const exportApplications = async () => {
    try {
      // Mock export functionality
      console.log('Exporting applications with filters:', filters);
      
      // Create a simple CSV export
      const csvData = applications.map(app => ({
        'Candidate Name': app.candidateName,
        'Email': app.email,
        'Job Title': app.jobTitle,
        'Department': app.department,
        'Status': app.status,
        'Pipeline Stage': app.pipelineStage,
        'Rating': app.rating,
        'Submitted At': app.submittedAt,
        'Last Updated': app.lastUpdated
      }));

      // Simulate download
      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'applications-export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting applications:', error);
      alert('Error exporting applications');
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
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
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
              className="flex items-center px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button
              onClick={exportApplications}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gold-50 p-4 rounded-sm">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-gold-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gold-600">Total Applications</p>
                <p className="text-2xl font-bold text-violet-900">{statistics.totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-sm">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-600">New Applications</p>
                <p className="text-2xl font-bold text-green-900">{statistics.newApplications}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-sm">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-600">In Review</p>
                <p className="text-2xl font-bold text-yellow-900">{statistics.inReviewApplications}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-sm">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Rating</p>
                <p className="text-2xl font-bold text-purple-900">{statistics.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by candidate name, email, or job title..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/60"
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
            {/* Status Filter */}
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

            {/* Department Filter */}
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

            {/* Rating Filter */}
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

            {/* Date Range Filter */}
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

            {/* Sort Options */}
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
              className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600"
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50"
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
                className="px-4 py-2 bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 text-sm"
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
                  className="px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 disabled:bg-gray-300"
                >
                  Execute
                </button>
              </div>
            </div>
          )}
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
                            {application.candidateName}
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
                      <button className="text-gold-600 hover:text-violet-900 mr-3 rounded-full">
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-3 rounded-full">
                        Review
                      </button>
                      <button className="text-red-600 hover:text-red-900 rounded-full">
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
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={(filters.page + 1) * filters.size >= totalElements}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
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
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={(filters.page + 1) * filters.size >= totalElements}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
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
