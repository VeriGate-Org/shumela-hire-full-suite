'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { departmentService, Department } from '@/services/departmentService';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggleDepartment, setToggleDepartment] = useState<Department | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const canManage = user?.role === 'PLATFORM_OWNER' || user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch {
      setLoadError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;
    const term = searchTerm.toLowerCase();
    return departments.filter(
      d => d.name.toLowerCase().includes(term) ||
           d.code.toLowerCase().includes(term) ||
           (d.description && d.description.toLowerCase().includes(term))
    );
  }, [departments, searchTerm]);

  const stats = useMemo(() => ({
    total: departments.length,
    active: departments.filter(d => d.isActive).length,
    inactive: departments.filter(d => !d.isActive).length,
  }), [departments]);

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setEditingDepartment(null);
    setShowCreateModal(true);
  };

  const openEditModal = (department: Department) => {
    setFormName(department.name);
    setFormDescription(department.description || '');
    setEditingDepartment(department);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingDepartment(null);
    setFormName('');
    setFormDescription('');
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast('Department name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingDepartment) {
        await departmentService.update(editingDepartment.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        });
        toast('Department updated', 'success');
      } else {
        await departmentService.create({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        });
        toast('Department created', 'success');
      }
      closeModal();
      await loadDepartments();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save department', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (department: Department) => {
    setToggleDepartment(department);
  };

  const confirmToggleActive = async () => {
    if (!toggleDepartment) return;
    const department = toggleDepartment;
    setToggleDepartment(null);
    try {
      if (department.isActive) {
        await departmentService.deactivate(department.id);
        toast(`${department.name} deactivated`, 'success');
      } else {
        await departmentService.activate(department.id);
        toast(`${department.name} activated`, 'success');
      }
      await loadDepartments();
    } catch {
      toast('Failed to update department status', 'error');
    }
  };

  const actions = canManage ? (
    <button
      onClick={openCreateModal}
      className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full border-2 border-gold-500 bg-gold-500 text-shumelahire-900 hover:bg-gold-600 transition-colors uppercase tracking-wider"
    >
      <PlusIcon className="w-4 h-4 mr-2" />
      Add Department
    </button>
  ) : null;

  if (loading) {
    return (
      <PageWrapper title="Departments" subtitle="Manage organisational departments" actions={actions}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-sm shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-sm shadow p-6 animate-pulse">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (loadError) {
    return (
      <PageWrapper title="Departments" subtitle="Manage organisational departments" actions={actions}>
        <div className="bg-white rounded-sm shadow p-12 text-center">
          <p className="text-gray-500 mb-4">{loadError}</p>
          <button
            onClick={loadDepartments}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Departments" subtitle="Manage organisational departments" actions={actions}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-sm shadow p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-shumelahire-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-sm shadow p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white rounded-sm shadow p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl font-bold text-gray-400 mt-1">{stats.inactive}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-sm shadow p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments by name, code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
            />
          </div>
        </div>

        {/* Table */}
        {filteredDepartments.length === 0 ? (
          <EmptyState
            icon={BuildingOfficeIcon}
            title={searchTerm ? 'No departments match your search' : 'No departments yet'}
            description={searchTerm ? 'Try a different search term' : 'Create your first department to get started'}
          />
        ) : (
          <div className="bg-white rounded-sm shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    {canManage && (
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDepartments.map((department) => (
                    <tr key={department.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{department.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 font-mono">{department.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 line-clamp-1">{department.description || '\u2014'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {department.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(department)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(department)}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                department.isActive
                                  ? 'border-red-300 text-red-700 hover:bg-red-50'
                                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {department.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDepartment ? 'Edit Department' : 'Create Department'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="dept-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  id="dept-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                />
              </div>
              <div>
                <label htmlFor="dept-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="dept-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional description of this department"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full border-2 border-gold-500 bg-gold-500 text-shumelahire-900 hover:bg-gold-600 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingDepartment ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={toggleDepartment !== null}
        title={toggleDepartment?.isActive ? 'Deactivate Department' : 'Activate Department'}
        message={toggleDepartment?.isActive
          ? `Are you sure you want to deactivate "${toggleDepartment?.name}"? This may affect users and job postings assigned to this department.`
          : `Are you sure you want to activate "${toggleDepartment?.name}"?`}
        confirmLabel={toggleDepartment?.isActive ? 'Deactivate' : 'Activate'}
        variant={toggleDepartment?.isActive ? 'warning' : 'default'}
        onConfirm={confirmToggleActive}
        onCancel={() => setToggleDepartment(null)}
      />
    </PageWrapper>
  );
}
